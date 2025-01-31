import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { visualizationId } = await request.json();
        if (!visualizationId) {
            return NextResponse.json({ error: "Visualization ID is required" }, { status: 400 });
        }

        // Get the temporary visualization data from localStorage (client will send it)
        const { data: tempData } = await request.json();
        if (!tempData) {
            return NextResponse.json({ error: "No visualization data provided" }, { status: 400 });
        }

        // Create a new permanent visualization
        const { data: visualization, error: vizError } = await supabase
            .from('visualizations')
            .insert({
                user_id: session.user.id,
                title: tempData.title || 'Untitled Visualization',
                description: tempData.text,
                status: 'completed',
                selected_voice: tempData.voice
            })
            .select()
            .single();

        if (vizError) {
            console.error('Error creating visualization:', vizError);
            throw vizError;
        }

        // Create sections
        if (tempData.sections) {
            const sectionsToInsert = tempData.sections.map(section => ({
                visualization_id: visualization.id,
                section_type: section.section_type,
                content: section.content,
                sequence_order: section.sequence_order,
                status: 'completed'
            }));

            const { error: sectionsError } = await supabase
                .from('visualization_sections')
                .insert(sectionsToInsert);

            if (sectionsError) {
                console.error('Error creating sections:', sectionsError);
                throw sectionsError;
            }
        }

        // If there's audio, move it from temp to permanent storage
        if (tempData.audio_url) {
            // Extract the temp file path from the URL
            const urlParts = new URL(tempData.audio_url);
            const tempPath = urlParts.pathname.split('/visualization-audio/')[1].split('?')[0];
            
            // Create new permanent path
            const newPath = `visualizations/${session.user.id}/${visualization.id}.mp3`;

            // Move the file
            const { error: moveError } = await supabase
                .storage
                .from('visualization-audio')
                .move(tempPath, newPath);

            if (moveError) {
                console.error('Error moving audio file:', moveError);
                throw moveError;
            }

            // Store the new path in the database
            const { error: audioError } = await supabase
                .from('visualization_audio')
                .insert({
                    visualization_id: visualization.id,
                    storage_path: newPath
                });

            if (audioError) {
                console.error('Error storing audio path:', audioError);
                throw audioError;
            }
        }

        return NextResponse.json({ 
            success: true,
            visualization
        });

    } catch (error) {
        console.error('Error associating visualization:', error);
        return NextResponse.json(
            { error: error.message || "Failed to associate visualization" },
            { status: 500 }
        );
    }
} 