import { NextResponse } from 'next/server';

export async function POST(request) {
    await request.json(); // Still parse the request but don't destructure unused variables
    
    // Generate a unique ID for this generation
    const generationId = Date.now().toString();
    
    // Here you could store the initial data in your database
    // await db.generations.create({ id: generationId, text, voiceId, status: 'pending' });
    
    return NextResponse.json({ generationId });
}