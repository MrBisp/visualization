import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

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
            .select('*')
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

        if (vizError) {
            console.error('Error fetching visualization metadata:', vizError);
            return NextResponse.json({ error: 'Failed to fetch visualization' }, { status: 500 });
        }

        // Fetch audio separately
        const { data: audioData, error: audioError } = await supabase
            .from('visualization_audio')
            .select('storage_path')
            .eq('visualization_id', id)
            .limit(1)
            .single({ timeout: 10000 });

        if (audioError) {
            console.error('Error fetching audio:', audioError);
        }

        // Get a signed URL if we have a storage path (valid for 1 hour)
        let audioUrl = null;
        if (audioData?.storage_path) {
            const { data: { signedUrl }, error: signedUrlError } = await supabase
                .storage
                .from('visualization-audio')
                .createSignedUrl(audioData.storage_path, 3600);

            if (signedUrlError) {
                console.error('Error creating signed URL:', signedUrlError);
            } else {
                audioUrl = signedUrl;
            }
        }

        // Construct the final response
        const visualization = {
            ...visualizationData,
            audio_url: audioUrl
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