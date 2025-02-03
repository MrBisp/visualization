import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

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

// This is just a tiny test MP3 file in base64 format
const TEST_AUDIO = Buffer.from('SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAECEhYaQtAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV', 'base64');

export async function POST(request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        // Generate a unique filename for storage
        const fileName = `${Date.now()}.mp3`;
        const filePath = `temp-visualizations/${id}/${fileName}`;

        // Upload the test audio file to Supabase Storage
        const { error: storageError } = await supabase
            .storage
            .from('visualization-audio')
            .upload(filePath, TEST_AUDIO, {
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

        return NextResponse.json({ 
            success: true,
            audio_url: signedUrl
        });

    } catch (error) {
        console.error('Error in test route:', error);
        return NextResponse.json(
            { error: error.message || "Failed to complete test" },
            { status: 500 }
        );
    }
} 