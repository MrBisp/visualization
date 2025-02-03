import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

export async function GET(request, { params }) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Visualization ID is required' }, { status: 400 });
        }

        // Get the audio storage path
        const { data: audioData, error: audioError } = await supabase
            .from('visualization_audio')
            .select('storage_path')
            .eq('visualization_id', id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (audioError) {
            console.error('Error fetching audio:', audioError);
            return NextResponse.json({ error: 'Failed to fetch audio data' }, { status: 500 });
        }

        if (!audioData?.[0]?.storage_path) {
            return NextResponse.json({ error: 'No audio found for this visualization' }, { status: 404 });
        }

        // Get a signed URL that expires in 1 hour
        const { data: { signedUrl }, error: signedUrlError } = await supabase
            .storage
            .from('visualization-audio')
            .createSignedUrl(audioData[0].storage_path, 3600);

        if (signedUrlError) {
            console.error('Error creating signed URL:', signedUrlError);
            return NextResponse.json({ error: 'Failed to generate audio URL' }, { status: 500 });
        }

        return NextResponse.json({ audio_url: signedUrl });
    } catch (error) {
        console.error('Error in audio route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 