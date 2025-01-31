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
        const { text, section_type, isPreview } = await req.json();
        
        if (!text || !section_type) {
            return NextResponse.json({ error: "Text and section type are required" }, { status: 400 });
        }

        // Get the system prompt for this section type
        const systemPrompt = SECTION_PROMPTS[section_type];
        if (!systemPrompt) {
            return NextResponse.json({ error: "Invalid section type" }, { status: 400 });
        }

        // Create the user prompt
        const userPrompt = `
            Create a natural, flowing visualization script that:
            - Uses present tense
            - Speaks directly to the listener with I-language (e.g. "I am walking into the room" instead of "You are walking into the room")
            - Includes appropriate pauses (mark them with [...])
            - Uses concrete, specific language
            - Avoids complex metaphors
            - Maintains a professional, warm tone
            
            The script should feel natural when spoken and help the listener fully immerse in the visualization.
            
            Format the response with:
            - Clear paragraphs
            - [...] for pauses
            - No special characters that might interfere with text-to-speech
            - Notice that you will only write some of the content, meaning that before and after the content, other text will be added. Therefore it is important not to write anything like: "Here you go" or anything like that, as it will interrupt the flow of the script. 
            - Also, only focus on the part you are asked to write, and do not write anything else.
            ${isPreview ? '- Keep the content concise as this is a preview.' : ''}
            
            Based on this scenario: "${text}"`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: isPreview ? 750 : 1500,
        });

        return NextResponse.json({ 
            content: completion.choices[0].message.content,
            sectionType: section_type
        });
    } catch (error) {
        console.error('Section generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate section' }, 
            { status: 500 }
        );
    }
} 