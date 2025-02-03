import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import OpenAI from "openai";
import { getOpenAIVoiceId } from "@/app/constants/voices";

const openai = new OpenAI();

// Create Supabase client with service role key for admin access
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    }
);

const MAX_TTS_LENGTH = 4000; // Slightly less than 4096 to be safe

// Add retry helper at the top
async function retryOperation(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            
            // Only retry on connection/stream errors
            if (!error.code?.includes('STREAM') && !error.code?.includes('ECONNRESET')) {
                throw error;
            }

            const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
            console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Helper function to split text into chunks that respect sentence boundaries
function splitTextIntoChunks(text, maxLength) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxLength) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                // If a single sentence is too long, split it by words
                const words = sentence.split(' ');
                let wordChunk = '';
                for (const word of words) {
                    if ((wordChunk + ' ' + word).length > maxLength) {
                        chunks.push(wordChunk.trim());
                        wordChunk = word;
                    } else {
                        wordChunk += (wordChunk ? ' ' : '') + word;
                    }
                }
                if (wordChunk) {
                    currentChunk = wordChunk;
                }
            }
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    return chunks;
}

export async function GET(request) {
    return NextResponse.json({ status: 'Route is working' });
}

export async function POST(request) {
    console.log('Complete visualization API route hit');
    try {
        const body = await request.json();
        const { id, text, voice } = body;
        
        if (!id) {
            console.error('No visualization ID provided');
            return NextResponse.json({ error: "Visualization ID is required" }, { status: 400 });
        }

        // Get the current session to check if user is logged in
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized - must be logged in" }, { status: 401 });
        }
        console.log('User session:', session.user.email);

        // If text and voice are provided, this is a conversion from preview to full version
        if (text && voice) {
            // Split text into chunks that respect the TTS character limit
            const textChunks = splitTextIntoChunks(text, MAX_TTS_LENGTH);
            console.log(`Split text into ${textChunks.length} chunks`);

            // Generate TTS for each chunk in parallel
            const audioChunksPromises = textChunks.map(async (chunk, i) => {
                console.log(`Starting audio chunk ${i + 1} of ${textChunks.length}`);
                // Use the provided voice directly since it's already in OpenAI format
                const openAIVoice = voice;
                
                const generateChunk = async () => {
                    const mp3 = await openai.audio.speech.create({
                        model: "tts-1",
                        voice: openAIVoice,
                        input: chunk,
                    });
                    return Buffer.from(await mp3.arrayBuffer());
                };

                const buffer = await retryOperation(generateChunk);
                console.log(`Completed audio chunk ${i + 1} of ${textChunks.length}`);
                return buffer;
            });

            // Wait for all chunks to complete
            const audioChunks = await Promise.all(audioChunksPromises);
            console.log('All audio chunks generated successfully');

            // Combine all audio chunks into a single buffer
            const combinedBuffer = Buffer.concat(audioChunks);
            
            // Generate a unique filename for storage
            const fileName = `${id}/${Date.now()}.mp3`;
            const filePath = `visualizations/${session.user.id}/${fileName}`;

            // Upload the audio file to Supabase Storage
            const { data: storageData, error: storageError } = await supabase
                .storage
                .from('visualization-audio')
                .upload(filePath, combinedBuffer, {
                    contentType: 'audio/mp3',
                    cacheControl: '3600'
                });

            if (storageError) {
                console.error('Error uploading to storage:', storageError);
                throw storageError;
            }

            // Get a signed URL that expires in 1 hour
            const { data: { signedUrl }, error: signedUrlError } = await supabase
                .storage
                .from('visualization-audio')
                .createSignedUrl(filePath, 3600);

            if (signedUrlError) {
                console.error('Error creating signed URL:', signedUrlError);
                throw signedUrlError;
            }

            // Store the file path in the database
            const { error: audioError } = await supabase
                .from('visualization_audio')
                .insert({
                    visualization_id: id,
                    storage_path: filePath,
                    created_at: new Date().toISOString(),
                    audio_type: 'full'
                });

            if (audioError) {
                console.error('Error storing audio path:', audioError);
                throw audioError;
            }

            return NextResponse.json({ 
                success: true,
                audio_url: signedUrl
            });
        }

        // Regular flow for generating audio from sections
        const { data: visualization, error: fetchError } = await supabase
            .from('visualizations')
            .select(`
                *,
                visualization_sections (
                    *
                )
            `)
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Error fetching visualization:', fetchError);
            throw fetchError;
        }

        if (!visualization) {
            console.error('No visualization found with ID:', id);
            return NextResponse.json({ error: "Visualization not found" }, { status: 404 });
        }

        // Combine all section content in the correct order
        const orderedSections = visualization.visualization_sections
            .sort((a, b) => a.sequence_order - b.sequence_order);
        
        const fullText = orderedSections
            .map(section => section.content)
            .join('\n\n');

        // Split text into chunks that respect the TTS character limit
        const textChunks = splitTextIntoChunks(fullText, MAX_TTS_LENGTH);
        console.log(`Split text into ${textChunks.length} chunks`);

        // Generate TTS for each chunk in parallel
        const audioChunksPromises = textChunks.map(async (chunk, i) => {
            console.log(`Starting audio chunk ${i + 1} of ${textChunks.length}`);
            const openAIVoice = getOpenAIVoiceId(visualization.selected_voice) || 'alloy';
            
            const generateChunk = async () => {
                const mp3 = await openai.audio.speech.create({
                    model: "tts-1",
                    voice: openAIVoice,
                    input: chunk,
                });
                return Buffer.from(await mp3.arrayBuffer());
            };

            const buffer = await retryOperation(generateChunk);
            console.log(`Completed audio chunk ${i + 1} of ${textChunks.length}`);
            return buffer;
        });

        // Wait for all chunks to complete
        const audioChunks = await Promise.all(audioChunksPromises);
        console.log('All audio chunks generated successfully');
        //Log the tokens used $15.00 usd per 1,000,000 characters
        const totalLength = textChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        console.log(`Total length: ${totalLength}`);
        console.log(`Tokens used: ${totalLength / 1000000 * 15.00}`);
        console.log(`Cost: $${(totalLength / 1000000 * 15.00).toFixed(2)}`);
        console.log("Generations per 1 USD: ", 1 / (totalLength / 1000000 * 15.00));

        // Combine all audio chunks into a single buffer
        const combinedBuffer = Buffer.concat(audioChunks);
        
        // Generate a unique filename for storage
        const fileName = `${visualization.id}/${Date.now()}.mp3`;
        const filePath = `visualizations/${visualization.user_id}/${fileName}`;

        // Upload the audio file to Supabase Storage
        const { data: storageData, error: storageError } = await supabase
            .storage
            .from('visualization-audio')
            .upload(filePath, combinedBuffer, {
                contentType: 'audio/mp3',
                cacheControl: '3600'
            });

        if (storageError) {
            console.error('Error uploading to storage:', storageError);
            throw storageError;
        }

        // Get a signed URL that expires in 1 hour
        const { data: { signedUrl }, error: signedUrlError } = await supabase
            .storage
            .from('visualization-audio')
            .createSignedUrl(filePath, 3600);

        if (signedUrlError) {
            console.error('Error creating signed URL:', signedUrlError);
            throw signedUrlError;
        }
        
        // Store the file path in the database
        const { error: audioError } = await supabase
            .from('visualization_audio')
            .insert({
                visualization_id: id,
                storage_path: filePath,
                created_at: new Date().toISOString(),
                audio_type: 'full'
            });

        if (audioError) {
            console.error('Error storing audio path:', audioError);
            throw audioError;
        }

        // Update visualization status to completed
        const { error: updateError } = await supabase
            .from('visualizations')
            .update({ 
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating visualization status:', updateError);
            throw updateError;
        }

        return NextResponse.json({ 
            success: true,
            audio_url: signedUrl
        });

    } catch (error) {
        console.error('Error completing visualization:', error);
        return NextResponse.json(
            { error: error.message || "Failed to complete visualization" },
            { status: 500 }
        );
    }
} 