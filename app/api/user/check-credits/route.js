import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";

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

        // Get latest credit count from database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('credits')
            .eq('id', session.user.id)
            .single();

        if (userError) {
            console.error('Error fetching user credits:', userError);
            return NextResponse.json({ error: "Failed to check credits" }, { status: 500 });
        }

        if (!userData || userData.credits < 1) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
        }

        return NextResponse.json({ 
            success: true,
            credits: userData.credits
        });
    } catch (error) {
        console.error('Error checking credits:', error);
        return NextResponse.json(
            { error: error.message || "Failed to check credits" },
            { status: 500 }
        );
    }
} 