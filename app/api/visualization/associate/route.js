import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        // Verify user is authenticated
        const session = await getServerSession(authOptions);
        console.log('Session:', session); // Debug log

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
        }

        // Get request body
        const body = await request.json();
        const { visualizationId } = body;

        if (!visualizationId) {
            return NextResponse.json({ error: 'Missing visualization ID' }, { status: 400 });
        }

        // Get the auth user ID from the session
        const userId = session.user.id;
        console.log('User ID from session:', userId); // Debug log

        if (!userId) {
            return NextResponse.json({ error: 'No user ID in session' }, { status: 401 });
        }

        // First verify the visualization exists
        const { data: existingViz, error: fetchError } = await supabase
            .from('visualizations')
            .select('id, user_id')
            .eq('id', visualizationId)
            .single();

        if (fetchError) {
            console.error('Error fetching visualization:', fetchError);
            return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
        }

        console.log('Existing visualization:', existingViz); // Debug log

        // Update the visualization to associate it with the user
        const { data, error } = await supabase
            .from('visualizations')
            .update({ user_id: userId })
            .eq('id', visualizationId)
            .select('id, user_id, created_at, updated_at, title, description, status, selected_voice')
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ 
                error: 'Failed to update visualization',
                details: error.message
            }, { status: 500 });
        }

        console.log('Updated visualization:', data); // Debug log

        return NextResponse.json({ success: true, visualization: data });
    } catch (error) {
        console.error('Error associating visualization:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
} 