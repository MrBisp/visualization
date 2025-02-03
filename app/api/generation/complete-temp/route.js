import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import OpenAI from "openai";

const openai = new OpenAI();
const MAX_TTS_LENGTH = 4000; // Slightly less than 4096 to be safe

// Create Supabase client with service role key for admin access
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role key instead of anon key
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    }
);

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

export async function POST(request) {
    try {
        const { id, text, voice } = await request.json();

        if (!id || !text || !voice) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if audio already exists for this temp ID
        const tempPath = `temp-visualizations/${id.replace('temp-', '')}/`;
        const { data: existingFiles } = await supabase
            .storage
            .from('visualization-audio')
            .list(tempPath);

        if (existingFiles && existingFiles.length > 0) {
            // If audio exists, return a signed URL for the existing file
            const existingFile = existingFiles[0];
            const { data: { signedUrl }, error: signedUrlError } = await supabase
                .storage
                .from('visualization-audio')
                .createSignedUrl(`${tempPath}${existingFile.name}`, 3600);

            if (signedUrlError) {
                console.error('Error creating signed URL for existing file:', signedUrlError);
                throw signedUrlError;
            }

            return NextResponse.json({ 
                success: true,
                audio_url: signedUrl,
                audio_type: 'temp'
            });
        }

        // For temporary visualizations, we'll use the temp ID as part of the path
        // but we don't need to store it in the database
        const fileName = `${Date.now()}.mp3`;
        const filePath = `temp-visualizations/${id.replace('temp-', '')}/${fileName}`;

        // Split text into chunks if needed
        const textChunks = splitTextIntoChunks(text, MAX_TTS_LENGTH);
        console.log(`Split text into ${textChunks.length} chunks`);

        // Generate TTS for each chunk in parallel
        const audioChunksPromises = textChunks.map(async (chunk, i) => {
            console.log(`Starting audio chunk ${i + 1} of ${textChunks.length}`);
            const mp3 = await openai.audio.speech.create({
                model: "tts-1",
                voice: voice,
                input: chunk,
            });
            const buffer = Buffer.from(await mp3.arrayBuffer());
            console.log(`Completed audio chunk ${i + 1} of ${textChunks.length}`);
            return buffer;
        });

        // Wait for all chunks to complete
        const audioChunks = await Promise.all(audioChunksPromises);
        console.log('All audio chunks generated successfully');

        // Combine audio chunks if needed
        const finalBuffer = Buffer.concat(audioChunks);

        // Upload the audio file to Supabase Storage
        const { error: storageError } = await supabase
            .storage
            .from('visualization-audio')
            .upload(filePath, finalBuffer, {
                contentType: 'audio/mp3',
                cacheControl: '3600',
                upsert: true
            });

        if (storageError) {
            console.error('Error uploading to storage:', storageError);
            throw storageError;
        }

        // Create a signed URL that expires in 1 hour
        const { data: { signedUrl }, error: signedUrlError } = await supabase
            .storage
            .from('visualization-audio')
            .createSignedUrl(filePath, 3600);

        if (signedUrlError) {
            console.error('Error creating signed URL:', signedUrlError);
            throw signedUrlError;
        }

        // Also get a public URL as a fallback
        const { data: { publicUrl } } = supabase
            .storage
            .from('visualization-audio')
            .getPublicUrl(filePath);

        return NextResponse.json({ 
            success: true,
            audio_url: signedUrl || publicUrl,
            audio_type: 'temp'
        });

    } catch (error) {
        console.error('Error in complete-temp route:', error);
        return NextResponse.json(
            { error: error.message || "Failed to complete visualization" },
            { status: 500 }
        );
    }
} 