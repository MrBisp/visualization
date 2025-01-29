import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

const SECTION_PROMPTS = {
    introduction: `You are an expert in guided visualization and meditation. Create a 1-2 minute introduction that:
        - Sets a calming context
        - Guides the listener to take deep breaths and relax
        - Establishes a first-person perspective
        - Uses present tense
        - Speaks directly to the listener
        Keep the tone warm and professional. Focus on physical and mental relaxation.`,
    
    scene_setup: `You are an expert in guided visualization. Create a 2-3 minute scene setup that:
        - Describes the environment in rich, vivid detail
        - Includes multiple sensory details (sight, sound, touch, smell)
        - Creates an immersive atmosphere
        - Uses present tense and first-person perspective
        - Maintains a natural, flowing narrative
        Focus on creating a vivid mental picture.`,
    
    emotional_priming: `You are an expert in guided visualization. Create a 3-minute emotional preparation that:
        - Builds confidence and positive emotions
        - Describes physical sensations of calmness and readiness
        - Uses encouraging and empowering language
        - Maintains first-person perspective
        - Addresses common anxieties or concerns
        Focus on emotional and mental preparation.`,
    
    action_execution: `You are an expert in guided visualization. Create a 6-8 minute action sequence that:
        - Narrates the key actions in detail
        - Includes internal thoughts and feelings
        - Emphasizes success and mastery
        - Uses present tense and first-person perspective
        - Incorporates specific details from the scenario
        Focus on the actual performance or execution.`,
    
    reflection: `You are an expert in guided visualization. Create a 2-3 minute closing reflection that:
        - Reinforces the positive experience
        - Connects the visualization to future success
        - Gradually brings awareness back to the present
        - Ends with confidence and optimism
        - Maintains a professional, encouraging tone
        Focus on cementing the positive visualization.`
};

export async function POST(req) {
    try {
        const { systemPrompt, userPrompt, sectionType } = await req.json();
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });

        return NextResponse.json({ 
            content: completion.choices[0].message.content,
            sectionType 
        });
    } catch (error) {
        console.error('Section generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate section' }, 
            { status: 500 }
        );
    }
} 