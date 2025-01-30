import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // First fetch just the visualization and audio to check existence and access
        const { data: basicData, error: basicError } = await supabase
            .from('visualizations')
            .select(`
                *,
                visualization_audio(audio_url)
            `)
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

        if (basicError) {
            console.error('Error fetching basic visualization data:', basicError);
            return NextResponse.json({ 
                error: 'Failed to fetch visualization',
                details: basicError.message 
            }, { status: 500 });
        }

        if (!basicData) {
            return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
        }

        // Then fetch the sections in a separate query
        const { data: sections, error: sectionsError } = await supabase
            .from('visualization_sections')
            .select('*')
            .eq('visualization_id', id)
            .order('sequence_order', { ascending: true });

        if (sectionsError) {
            console.error('Error fetching sections:', sectionsError);
            return NextResponse.json({ 
                error: 'Failed to fetch visualization sections',
                details: sectionsError.message 
            }, { status: 500 });
        }

        // Construct the final response
        const visualization = {
            ...basicData,
            sections: sections || [],
            audio_url: basicData.visualization_audio?.[0]?.audio_url
        };

        // Clean up the response
        delete visualization.visualization_audio;

        return NextResponse.json(visualization);
    } catch (error) {
        console.error('Error in GET /api/visualization/[id]:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message 
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