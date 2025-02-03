import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    }
);

export async function POST(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            console.log('POST /api/visualization/[id]/audio/cleanup: Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const userId = session.user.id;

        console.log('Cleaning up stale audio records for:', { id, userId });

        // Get all audio records for this visualization
        const { data: audioRecords, error: fetchError } = await supabase
            .from('visualization_audio')
            .select('*')
            .eq('visualization_id', id);

        if (fetchError) {
            console.error('Error fetching audio records:', fetchError);
            throw fetchError;
        }

        if (!audioRecords?.length) {
            console.log('No audio records found to clean up');
            return NextResponse.json({ message: 'No records to clean up' });
        }

        // Check each record's file existence and delete if missing
        const cleanupPromises = audioRecords.map(async (record) => {
            const { data: fileExists } = await supabase
                .storage
                .from('visualization-audio')
                .list(record.storage_path.split('/').slice(0, -1).join('/'));

            const fileName = record.storage_path.split('/').pop();
            if (!fileExists?.some(file => file.name === fileName)) {
                console.log('Deleting stale audio record:', record.id);
                const { error: deleteError } = await supabase
                    .from('visualization_audio')
                    .delete()
                    .eq('id', record.id);

                if (deleteError) {
                    console.error('Error deleting audio record:', deleteError);
                    return false;
                }
                return true;
            }
            return false;
        });

        const results = await Promise.all(cleanupPromises);
        const deletedCount = results.filter(Boolean).length;

        console.log(`Cleaned up ${deletedCount} stale audio records`);
        return NextResponse.json({ 
            message: `Cleaned up ${deletedCount} stale audio records`,
            deletedCount 
        });
    } catch (error) {
        console.error('Error in cleanup route:', error);
        return NextResponse.json({ 
            error: 'Failed to clean up audio records',
            details: error.message
        }, { status: 500 });
    }
} 