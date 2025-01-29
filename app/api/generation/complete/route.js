import { NextResponse } from "next/server";
import { supabase } from "@/libs/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import OpenAI from "openai";

const openai = new OpenAI();

const MAX_TTS_LENGTH = 4000; // Slightly less than 4096 to be safe

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
        const { id } = body;
        
        if (!id) {
            console.error('No visualization ID provided');
            return NextResponse.json({ error: "Visualization ID is required" }, { status: 400 });
        }

        // Get the current session to check if user is logged in
        const session = await getServerSession(authOptions);
        console.log('User session:', session?.user?.email || 'No session');

        // First, get all completed sections to generate TTS
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

        // Generate TTS for each chunk
        const audioChunks = [];
        for (let i = 0; i < textChunks.length; i++) {
            const chunk = textChunks[i];
            const mp3 = await openai.audio.speech.create({
                model: "tts-1",
                voice: visualization.selected_voice,
                input: chunk,
            });
            const buffer = Buffer.from(await mp3.arrayBuffer());
            audioChunks.push(buffer);
            console.log(`Generated audio chunk ${i + 1} of ${textChunks.length}`);
        }

        // Combine all audio chunks into a single base64 string
        const combinedBuffer = Buffer.concat(audioChunks);
        const audioData = `data:audio/mp3;base64,${combinedBuffer.toString('base64')}`;
        
        // Store audio data in Supabase
        const { error: audioError } = await supabase
            .from('visualization_audio')
            .insert({
                visualization_id: id,
                audio_url: audioData,
                created_at: new Date().toISOString()
            });

        if (audioError) {
            console.error('Error storing audio:', audioError);
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

        // Get the final visualization data with sections and audio
        const { data: finalVisualization, error: finalFetchError } = await supabase
            .from('visualizations')
            .select(`
                *,
                visualization_sections (
                    *
                ),
                visualization_audio (
                    *
                )
            `)
            .eq('id', id)
            .single();

        if (finalFetchError) {
            console.error('Error fetching final visualization:', finalFetchError);
            throw finalFetchError;
        }

        return NextResponse.json({ 
            success: true,
            visualization: finalVisualization
        });

    } catch (error) {
        console.error('Error completing visualization:', error);
        return NextResponse.json(
            { error: error.message || "Failed to complete visualization" },
            { status: 500 }
        );
    }
} 