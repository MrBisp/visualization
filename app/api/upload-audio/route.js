import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { randomUUID } from 'crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file'); // Expecting a File object
        const visualizationId = formData.get('visualizationId');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!visualizationId) {
            return NextResponse.json({ error: 'No visualization ID provided' }, { status: 400 });
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `visualizations/${session.user.id}/${randomUUID()}.${fileExt}`;

        // Upload file to storage
        const { data: storageData, error: storageError } = await supabase
            .storage
            .from('visualization-audio')
            .upload(filePath, file, {
                contentType: file.type
            });

        if (storageError) throw storageError;

        // Store the file path in the database
        const { data: audioData, error: audioError } = await supabase
            .from('visualization_audio')
            .insert([
                {
                    visualization_id: visualizationId,
                    storage_path: filePath,
                    audio_type: 'full'
                }
            ])
            .select()
            .single();

        if (audioError) throw audioError;

        // Get a signed URL that expires in 1 hour
        const { data: { signedUrl }, error: signedUrlError } = await supabase
            .storage
            .from('visualization-audio')
            .createSignedUrl(filePath, 3600);

        if (signedUrlError) throw signedUrlError;

        return NextResponse.json({ 
            audio_url: signedUrl,
            storage_path: filePath
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
