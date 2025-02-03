import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { createClient } from '@supabase/supabase-js';

// This tells Next.js this is a dynamic route
export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
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

        // Check if user exists in public.users table
        const { data: user, error } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .single();

        if (error || !user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ success: true }), {
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