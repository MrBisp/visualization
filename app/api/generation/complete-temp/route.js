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

        // Generate TTS using OpenAI
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: voice,
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        // Generate a unique filename for storage
        const fileName = `${Date.now()}.mp3`;
        const filePath = `temp-visualizations/${id}/${fileName}`;

        // Upload the audio file to Supabase Storage
        const { data: storageData, error: storageError } = await supabase
            .storage
            .from('visualization-audio')
            .upload(filePath, buffer, {
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
            .createSignedUrl(filePath, 3600); // 1 hour expiration

        if (signedUrlError) {
            console.error('Error creating signed URL:', signedUrlError);
            throw signedUrlError;
        }

        return NextResponse.json({ 
            success: true,
            audio_url: signedUrl
        });

    } catch (error) {
        console.error('Error in complete-temp route:', error);
        return NextResponse.json(
            { error: error.message || "Failed to complete visualization" },
            { status: 500 }
        );
    }
} 