import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI();

export async function POST(req) {
    try {
        const { systemPrompt, userPrompt } = await req.json();

        //console.log("-- New AI Request --")
        //console.log("System Prompt:", systemPrompt);
        //console.log("User Prompt:", userPrompt);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        //console.log("-- AI Response --")
        //console.log("Content:", completion.choices[0].message.content);
        //console.log("-- End of AI Response --")

        return NextResponse.json({ content: completion.choices[0].message.content });

        
    } catch (error) {
        console.error('OpenAI API error:', error);
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }
}