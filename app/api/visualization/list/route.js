import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Fetch visualizations with their latest audio
        const { data: visualizations, error } = await supabase
            .from('visualizations')
            .select(`
                *,
                visualization_sections (
                    section_type,
                    status
                ),
                visualization_audio (
                    id,
                    storage_path,
                    audio_type
                )
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching visualizations:', error);
            return new Response(JSON.stringify({ error: 'Failed to fetch visualizations' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Process visualizations to include overall status
        const processedVisualizations = await Promise.all(visualizations.map(async visualization => {
            // Calculate overall status based on sections
            const sections = visualization.visualization_sections || [];
            let status = visualization.status;

            if (sections.length > 0) {
                const allCompleted = sections.every(section => section.status === 'completed');
                const hasFailed = sections.some(section => section.status === 'failed');
                const hasProcessing = sections.some(section => section.status === 'processing');

                if (hasFailed) status = 'failed';
                else if (hasProcessing) status = 'processing';
                else if (allCompleted) status = 'completed';
                else status = 'pending';
            }

            // Check if audio exists and get signed URL if it does
            const audioFile = visualization.visualization_audio?.[0];
            const hasAudio = !!audioFile;
            let audioUrl = null;
            let audioType = null;

            if (hasAudio && audioFile.storage_path) {
                const { data: { signedUrl }, error: signedUrlError } = await supabase
                    .storage
                    .from('visualization-audio')
                    .createSignedUrl(audioFile.storage_path, 3600);
                
                if (!signedUrlError) {
                    audioUrl = signedUrl;
                    audioType = audioFile.audio_type;
                }
            }

            return {
                ...visualization,
                status,
                has_audio: hasAudio,
                audio_url: audioUrl,
                audio_type: audioType,
                visualization_sections: undefined,
                visualization_audio: undefined
            };
        }));

        return new Response(JSON.stringify(processedVisualizations), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Server error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
} 