import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

// This tells Next.js this is a dynamic route
export const dynamic = 'force-dynamic';

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
        console.log('GET /api/visualization/[id] route hit');
        
        const session = await getServerSession(authOptions);
        if (!session) {
            console.log('No session found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        console.log('Visualization ID:', id);
        console.log('User ID:', session.user.id);
        
        const { data: visualizationData, error: vizError } = await supabase
            .from('visualizations')
            .select(`
                *,
                visualization_sections (
                    id,
                    section_type,
                    content,
                    sequence_order
                )
            `)
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

        if (vizError) {
            console.error('Error fetching visualization metadata:', vizError);
            return NextResponse.json({ error: 'Failed to fetch visualization' }, { status: 500 });
        }

        // Fetch audio separately
        const { data: audioFiles, error: audioError } = await supabase
            .from('visualization_audio')
            .select('storage_path, audio_type')
            .eq('visualization_id', id)
            .order('created_at', { ascending: false });

        if (audioError) {
            console.error('Error fetching audio:', audioError);
        }

        // Get a signed URL if we have a storage path (valid for 1 hour)
        let audioUrl = null;
        let audioType = null;
        
        if (audioFiles?.length > 0) {
            // Check if we have a full version
            const fullVersion = audioFiles.find(audio => audio.audio_type === 'full');
            const tempVersion = audioFiles.find(audio => audio.audio_type === 'temp');

            // If we have both versions, delete the temp version
            if (fullVersion && tempVersion) {
                console.log('Found both temp and full versions, cleaning up temp version...');
                
                // Delete the temp file from storage
                const { error: deleteStorageError } = await supabase
                    .storage
                    .from('visualization-audio')
                    .remove([tempVersion.storage_path]);

                if (deleteStorageError) {
                    console.error('Error deleting temp file from storage:', deleteStorageError);
                }

                // Delete the temp record from the database
                const { error: deleteRecordError } = await supabase
                    .from('visualization_audio')
                    .delete()
                    .eq('visualization_id', id)
                    .eq('audio_type', 'temp');

                if (deleteRecordError) {
                    console.error('Error deleting temp record from database:', deleteRecordError);
                }
            }

            // Use the full version if available, otherwise use temp
            const audioToUse = fullVersion || tempVersion;
            if (audioToUse) {
                const { data: { signedUrl }, error: signedUrlError } = await supabase
                    .storage
                    .from('visualization-audio')
                    .createSignedUrl(audioToUse.storage_path, 3600);

                if (signedUrlError) {
                    console.error('Error creating signed URL:', signedUrlError);
                } else {
                    audioUrl = signedUrl;
                    audioType = audioToUse.audio_type;
                }
            }
        }

        // Construct the final response
        const visualization = {
            ...visualizationData,
            audio_url: audioUrl,
            audio_type: audioType
        };

        // Clean up the response
        delete visualization.visualization_audio;

        return NextResponse.json(visualization);
    } catch (error) {
        console.error('Error in GET /api/visualization/[id]:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // First verify the visualization belongs to the user
        const { data: visualization, error: vizError } = await supabase
            .from('visualizations')
            .select('id')
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

        if (vizError || !visualization) {
            return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
        }

        // Delete the visualization (cascade will handle related records)
        const { error: deleteError } = await supabase
            .from('visualizations')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting visualization:', deleteError);
            return NextResponse.json({ error: 'Failed to delete visualization' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/visualization/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();

        // Validate the request body
        if (!body.title || typeof body.title !== 'string') {
            return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
        }

        // First verify the visualization belongs to the user
        const { data: visualization, error: vizError } = await supabase
            .from('visualizations')
            .select('id')
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

        if (vizError || !visualization) {
            return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
        }

        // Update the visualization title
        const { error: updateError } = await supabase
            .from('visualizations')
            .update({ title: body.title.trim() })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating visualization:', updateError);
            return NextResponse.json({ error: 'Failed to update visualization' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in PATCH /api/visualization/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 