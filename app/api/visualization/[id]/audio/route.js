import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
        db: {
            schema: 'public'
        },
        global: {
            headers: { 'x-my-custom-header': 'visualization-audio' },
        },
        auth: {
            persistSession: false
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
                audio_url,
                visualization:visualizations!inner(user_id)
            `)
            .eq('visualization_id', id)
            .eq('visualizations.user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        clearTimeout(timeoutId);

        if (audioError) {
            // If it's a timeout error and we haven't exceeded retries, try again
            if ((audioError.code === '57014' || audioError.message?.includes('timeout')) && retryCount < maxRetries) {
                // Add exponential backoff
                const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 8000);
                console.log(`Waiting ${backoffTime}ms before retry ${retryCount + 1}...`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                
                console.log(`Retry ${retryCount + 1} for audio fetch...`);
                return await fetchWithRetry(id, userId, retryCount + 1);
            }
            throw audioError;
        }

        // If no data or wrong user, return null
        if (!audioData || audioData.visualization.user_id !== userId) {
            return null;
        }

        return {
            audio_url: audioData.audio_url
        };
    } catch (error) {
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const userId = session.user.id;

        // Fetch audio data with retry mechanism
        const audioData = await fetchWithRetry(id, userId);

        if (!audioData) {
            return NextResponse.json({ error: 'Audio not found or unauthorized access' }, { status: 404 });
        }

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