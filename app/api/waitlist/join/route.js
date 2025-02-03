import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req) {
  try {
    const { email, metadata = {} } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    try {
      const supabase = createClient();

      // Try to insert the email into the waitlist
      const { error: insertError } = await supabase
        .from('waitlist')
        .insert([
          { 
            email: email.toLowerCase(), // Store emails in lowercase
            metadata: {
              ...metadata,
              userAgent: req.headers.get('user-agent'),
              timestamp: new Date().toISOString(),
            },
            source: 'signup_page'
          }
        ]);

      // If there's a unique constraint violation, return a 409 Conflict
      if (insertError?.code === '23505') {
        return NextResponse.json(
          { error: "You're already on our waitlist! We'll notify you when we launch." },
          { status: 409 }
        );
      }

      // For any other database error
      if (insertError) {
        console.error('Database error:', insertError);
        return NextResponse.json(
          { error: "Failed to join waitlist" },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: "Successfully joined the waitlist!"
      });

    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }
} 