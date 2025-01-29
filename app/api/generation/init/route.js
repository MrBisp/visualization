import { NextResponse } from 'next/server';

export async function POST(request) {
    const { text, voiceId } = await request.json();
    
    // Generate a unique ID for this generation
    const generationId = Date.now().toString();
    
    // Here you could store the initial data in your database
    // await db.generations.create({ id: generationId, text, voiceId, status: 'pending' });
    
    return NextResponse.json({ generationId });
}