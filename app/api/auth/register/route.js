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

        // Check if user already exists in auth.users
        const { data: existingAuthUser, error: authCheckError } = await supabase
            .from('auth.users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingAuthUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // First create the user in auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: password,
            email_confirm: true,
            user_metadata: {
                name
            }
        });

        if (authError) {
            console.error('Error creating auth user:', authError);
            return NextResponse.json(
                { error: "Failed to create user" },
                { status: 500 }
            );
        }

        // Then create the user in public.users with the same ID
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert([
                {
                    id: authUser.user.id,
                    email,
                    name,
                    password: hashedPassword
                }
            ])
            .select()
            .single();

        if (userError) {
            console.error('Error creating user record:', userError);
            // Try to clean up the auth user if public user creation fails
            await supabase.auth.admin.deleteUser(authUser.user.id);
            return NextResponse.json(
                { error: "Failed to create user" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
