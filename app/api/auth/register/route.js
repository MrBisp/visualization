import { NextResponse } from "next/server";
import { supabase } from "@/libs/supabase";
import bcrypt from "bcryptjs";

export async function POST(req) {
    try {
        const { email, password, name, inviteCode } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with all required fields
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert({
                email,
                password: hashedPassword,
                name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (userError) throw userError;

        // If there's an invite code, handle the follow relationship
        if (inviteCode) {
            const { data: invite } = await supabase
                .from('invites')
                .select('inviter_id')
                .eq('code', inviteCode)
                .eq('used', false)
                .gt('expires_at', new Date().toISOString())
                .single();

            if (invite) {
                // Create mutual follow relationship
                await supabase.from('follows').insert([
                    { follower_id: invite.inviter_id, following_id: user.id },
                    { follower_id: user.id, following_id: invite.inviter_id }
                ]);

                // Mark invite as used
                await supabase
                    .from('invites')
                    .update({ used: true, used_by: user.id })
                    .eq('code', inviteCode);
            }
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
