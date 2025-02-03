import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, name, password } = body;

        if (!email || !name || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // First check if user exists in public.users
        const { data: existingPublicUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingPublicUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Then check if user exists in auth
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
            console.error('Error checking existing users:', listError);
            return NextResponse.json(
                { error: "Failed to check existing users" },
                { status: 500 }
            );
        }

        const userExists = users?.some(user => user.email.toLowerCase() === email.toLowerCase());
        if (userExists) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Create the auth user first
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name
            }
        });

        if (authError) {
            console.error('Error creating auth user:', authError);
            return NextResponse.json(
                { error: "Failed to create user in auth system" },
                { status: 500 }
            );
        }

        // Hash password for public.users table
        const hashedPassword = await bcrypt.hash(password, 10);

        // Then create the user in public.users
        const { data: publicUser, error: publicError } = await supabase
            .from('users')
            .insert({
                id: authUser.user.id,
                email,
                name,
                password: hashedPassword,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (publicError) {
            console.error('Error creating public user:', publicError);
            // Clean up the auth user if public user creation fails
            await supabase.auth.admin.deleteUser(authUser.user.id);
            return NextResponse.json(
                { error: "Failed to create user record" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            user: {
                id: publicUser.id,
                name: publicUser.name,
                email: publicUser.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
