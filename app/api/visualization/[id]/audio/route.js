import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        db: {
            schema: 'public'
        },
        global: {
            headers: { 'x-my-custom-header': 'visualization-audio' },
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    }
);

async function fetchWithRetry(id, userId, retryCount = 0) {
    const maxRetries = 3;
    const timeout = 30000; // 30 seconds timeout

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Get the latest audio entry for this visualization, ensuring it belongs to the user
        const { data: audioData, error: audioError } = await supabase
            .from('visualization_audio')
            .select(`
                storage_path,
                visualization:visualizations!inner(user_id)
            `)
            .eq('visualization_id', id)
            .eq('visualizations.user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        clearTimeout(timeoutId);

        if (audioError) {
            console.error('Error fetching audio data:', audioError);
            throw audioError;
        }

        // If no data or wrong user, return null
        if (!audioData || audioData.visualization.user_id !== userId) {
            console.log('No audio data found or unauthorized access');
            return null;
        }

        if (!audioData.storage_path) {
            console.error('No storage path found in audio data');
            return null;
        }

        console.log('Found audio data:', { storage_path: audioData.storage_path });

        // Create signed URL with error handling
        const signedUrlResponse = await supabase
            .storage
            .from('visualization-audio')
            .createSignedUrl(audioData.storage_path, 3600);

        if (signedUrlResponse.error) {
            console.error('Error creating signed URL:', signedUrlResponse.error);
            throw signedUrlResponse.error;
        }

        if (!signedUrlResponse.data?.signedUrl) {
            console.error('No signed URL in response:', signedUrlResponse);
            throw new Error('Failed to generate signed URL');
        }

        return {
            audio_url: signedUrlResponse.data.signedUrl
        };
    } catch (error) {
        console.error('Error in fetchWithRetry:', error);
        if (retryCount < maxRetries) {
            // Add exponential backoff here too
            const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 8000);
            console.log(`Waiting ${backoffTime}ms before retry ${retryCount + 1} after error:`, error);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            
            return await fetchWithRetry(id, userId, retryCount + 1);
        }
        throw error;
    }
}

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            console.log('GET /api/visualization/[id]/audio: Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const userId = session.user.id;

        console.log('Fetching audio for visualization:', { id, userId });

        // Fetch audio data with retry mechanism
        const audioData = await fetchWithRetry(id, userId);

        if (!audioData) {
            console.log('Audio not found or unauthorized for:', { id, userId });
            return NextResponse.json({ error: 'Audio not found or unauthorized access' }, { status: 404 });
        }

        console.log('Successfully retrieved signed URL for:', { id });
        return NextResponse.json({ audio_url: audioData.audio_url });
    } catch (error) {
        console.error('Error in GET /api/visualization/[id]/audio:', error);
        
        // Provide more specific error messages
        const errorMessage = error.code === '57014' 
            ? 'The audio file is taking too long to load. Please try again.'
            : 'Failed to load audio. Please try refreshing the page.';

        return NextResponse.json({ 
            error: errorMessage,
            details: error.message,
            code: error.code
        }, { status: 500 });
    }
} 