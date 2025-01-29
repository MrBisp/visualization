import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        return NextResponse.json({ 
            isAuthenticated: !!session,
            userId: session?.user?.id 
        });
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json({ 
            isAuthenticated: false,
            error: 'Failed to check authentication'
        }, { status: 500 });
    }
} 