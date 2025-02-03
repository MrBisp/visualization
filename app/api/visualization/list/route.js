import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

// This tells Next.js this is a dynamic route
export const dynamic = 'force-dynamic';

// Create Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: visualizations, error } = await supabase
            .from('visualizations')
            .select(`
                *,
                visualization_audio (
                    storage_path,
                    audio_type
                )
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(visualizations);
    } catch (error) {
        console.error('Error fetching visualizations:', error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch visualizations" },
            { status: 500 }
        );
    }
} 