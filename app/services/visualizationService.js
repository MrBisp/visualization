import { createClient } from '@supabase/supabase-js';

// Create Supabase client with anon key for client-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const SECTION_TYPES = {
  INTRODUCTION: 'introduction',
  SCENE_SETUP: 'scene_setup',
  EMOTIONAL_PRIMING: 'emotional_priming',
  ACTION_EXECUTION: 'action_execution',
  REFLECTION: 'reflection'
};

export async function initializeVisualization({ text, voiceId, userId = null }) {
  try {
    let title = 'Visualization 1';

    // Only get visualization count if there's a user ID
    if (userId) {
      const { count: visualizationCount, error: countError } = await supabase
        .from('visualizations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;
      title = `Visualization ${(visualizationCount || 0) + 1}`;
    }

    const { data: visualization, error } = await supabase
      .from('visualizations')
      .insert({
        description: text,
        selected_voice: voiceId,
        status: 'pending',
        user_id: userId,
        title: title
      })
      .select()
      .single();

    if (error) throw error;

    // Initialize all sections
    const sections = [
      { section_type: SECTION_TYPES.INTRODUCTION, sequence_order: 1 },
      { section_type: SECTION_TYPES.SCENE_SETUP, sequence_order: 2 },
      { section_type: SECTION_TYPES.EMOTIONAL_PRIMING, sequence_order: 3 },
      { section_type: SECTION_TYPES.ACTION_EXECUTION, sequence_order: 4 },
      { section_type: SECTION_TYPES.REFLECTION, sequence_order: 5 }
    ].map(section => ({
      ...section,
      visualization_id: visualization.id
    }));
    
    const { error: sectionsError } = await supabase
      .from('visualization_sections')
      .insert(sections);

    if (sectionsError) throw sectionsError;

    return visualization;
  } catch (error) {
    console.error('Error initializing visualization:', error);
    throw error;
  }
}

export async function updateVisualizationStatus(id, status) {
  const { error } = await supabase
    .from('visualizations')
    .update({ status })
    .eq('id', id);
  
  if (error) throw error;
}

export async function generateSection(visualizationId, sectionType, retryCount = 0) {
  const MAX_RETRIES = 2;
  
  try {
    console.log(`Starting generation for section ${sectionType} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    // 1. Get visualization data and check current status
    const { data: visualization, error: vizError } = await supabase
      .from('visualizations')
      .select('*')
      .eq('id', visualizationId)
      .single();

    if (vizError) {
      console.error('Failed to fetch visualization:', vizError);
      throw vizError;
    }

    if (!visualization) {
      throw new Error('Visualization not found');
    }

    // Check if section is already completed
    const { data: existingSection } = await supabase
      .from('visualization_sections')
      .select('status, content')
      .match({ visualization_id: visualizationId, section_type: sectionType })
      .single();

    if (existingSection?.status === 'completed' && existingSection?.content) {
      console.log(`Section ${sectionType} is already completed, skipping generation`);
      return existingSection.content;
    }

    // 2. Update section status to processing
    const { error: updateError } = await supabase
      .from('visualization_sections')
      .update({ status: 'processing' })
      .match({ visualization_id: visualizationId, section_type: sectionType });

    if (updateError) {
      console.error('Failed to update section status to processing:', updateError);
      throw updateError;
    }

    // 3. Generate content based on section type
    const content = await generateSectionContent(visualization, sectionType);

    // Validate content
    if (!validateContent(content)) {
      throw new Error('Generated content failed validation');
    }

    // 4. Update section with generated content
    const { error: saveError } = await supabase
      .from('visualization_sections')
      .update({ 
        content,
        status: 'completed'
      })
      .match({ visualization_id: visualizationId, section_type: sectionType });

    if (saveError) {
      console.error('Failed to save generated content:', saveError);
      throw saveError;
    }

    console.log(`Successfully generated and saved content for section ${sectionType}`);
    return content;
  } catch (error) {
    console.error(`Error generating section ${sectionType} (attempt ${retryCount + 1}):`, error);

    // If we haven't exceeded max retries, try again
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying section ${sectionType} (attempt ${retryCount + 2})`);
      return generateSection(visualizationId, sectionType, retryCount + 1);
    }

    // Mark section as failed if we've exhausted retries
    try {
      await supabase
        .from('visualization_sections')
        .update({ status: 'failed' })
        .match({ visualization_id: visualizationId, section_type: sectionType });
    } catch (updateError) {
      console.error('Failed to update section status to failed:', updateError);
    }

    throw error;
  }
}

async function generateSectionContent(visualization, sectionType) {
  const systemPrompts = {
    [SECTION_TYPES.INTRODUCTION]: `You are an expert meditation and visualization guide. Create a 1-2 minute introduction that:
        - Helps the listener relax and prepare for visualization
        - Uses calming, professional language
        - Includes breathing cues
        - Sets the right mindset for the upcoming visualization
        - IN the next sections, the user will listen to a scene setup, emotional priming, action execution and reflection. So you should write about relaxing so they can prepare for the next sections.`,

    [SECTION_TYPES.SCENE_SETUP]: `You are an expert visualization guide. Create a 2-3 minute scene setup that:
        - Paints a vivid picture of the environment. Start outside the building, then go inside and describe what they see (but not anything about meeting anyone yet)
        - Includes rich sensory details (sight, sound, touch, smell)
        - Helps the listener feel present in the scene
        - Uses present tense and immersive language
        - The user has already listened to a 2 minute introduction to the visualization, so they are already in a relaxed state and ready to visualize
        - Afterwards, the user will listen to the actual performance part. So you should write about entering the building, the room, the stage, etc. But do not write anything about the performance itself, as that will be written in the next section.`,

    [SECTION_TYPES.EMOTIONAL_PRIMING]: `You are an expert in psychological preparation. Create a 3-minute emotional preparation that:
        - Builds confidence and positive emotions
        - Addresses potential anxieties
        - Creates a strong emotional foundation
        - Uses empowering language
        - Write about how they are received by receptionist / audience / teacher / professor / etc. or something, but not the actual performance yet.
        - The user has already listened to a 5 minute scene setup, so they are already in the scene and ready to visualize`,

    [SECTION_TYPES.ACTION_EXECUTION]: `You are an expert performance coach. Create a 6-8 minute visualization sequence that:
        - Guides through the actual performance/event
        - Includes detailed success imagery
        - Maintains first-person perspective
        - Emphasizes mastery and control
        - You may write that they feel some nervousness, but they are able to turn it into excitement or something similarly positive
        - Notice the user already listened to a 3 minute emotional preparation, so they are already in a positive state and ready to visualize`,

    [SECTION_TYPES.REFLECTION]: `You are an expert in positive psychology. Create a 2-3 minute closing reflection that:
        - Reinforces the successful visualization
        - Bridges to real-world application
        - Ends with confidence
        - Provides a sense of completion
        - The user has already listened to a 6 minute action execution, so they are already in the action and ready to reflect on how it went`
  };

  try {
    console.log(`Generating content for section ${sectionType}`);
    console.log('Using description:', visualization.description);

    // Get the previous section's content if this isn't the first section
    let previousContent = '';
    if (sectionType !== SECTION_TYPES.INTRODUCTION) {
      const sectionOrder = Object.values(SECTION_TYPES).indexOf(sectionType);
      const previousSectionType = Object.values(SECTION_TYPES)[sectionOrder - 1];
      
      const { data: previousSection } = await supabase
        .from('visualization_sections')
        .select('content')
        .match({ visualization_id: visualization.id, section_type: previousSectionType })
        .single();

      if (previousSection?.content) {
        // Get the last 50 words
        const words = previousSection.content.split(/\s+/);
        const lastFiftyWords = words.slice(-50).join(' ');
        previousContent = `\nContinue from the previous section which ended with:\n"${lastFiftyWords}"\n`;
      }
    }

    let userPrompt = `
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
          Based on this scenario: "${visualization.description}.`
    if (previousContent) {
      userPrompt += 'Here is the last part of the previous section: ' + previousContent;
    }

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt: systemPrompts[sectionType],
        userPrompt: userPrompt
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API response not ok:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to generate section content: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate the content
    if (!data.content) {
      console.error('No content received from AI');
      throw new Error('No content received from AI');
    }

    console.log(`Received content for section ${sectionType}, length: ${data.content.length} characters`);

    // Format the content - store directly as formatted text
    const formattedContent = data.content
      .replace(/\n\n+/g, '\n\n')  // Normalize line breaks
      .trim();

    // Final validation
    if (!validateContent(formattedContent)) {
      throw new Error('Formatted content failed validation');
    }

    return formattedContent;
  } catch (error) {
    console.error(`Error in generateSectionContent for ${sectionType}:`, error);
    throw error;
  }
}

// Content validation helper
function validateContent(content) {
  if (!content || typeof content !== 'string') {
    console.error('Content validation failed: content is empty or not a string');
    return false;
  }

  if (content.length < 50) {
    console.error('Content validation failed: content is too short');
    return false;
  }

  // Check for any problematic characters or patterns
  const problematicPatterns = [
    /^Here's/i,
    /^As requested/i,
    /^I'll create/i,
    /^Here you go/i,
    /```/,
    /<[^>]+>/  // HTML tags
  ];

  for (const pattern of problematicPatterns) {
    if (pattern.test(content)) {
      console.error(`Content validation failed: found problematic pattern ${pattern}`);
      return false;
    }
  }

  return true;
}

// Helper function to estimate duration based on word count
function calculateEstimatedDuration(text) {
  const WORDS_PER_MINUTE = 130; // Average speaking pace
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / WORDS_PER_MINUTE * 60); // Duration in seconds
}

export async function getVisualizationProgress(visualizationId) {
  const { data, error } = await supabase
    .from('visualization_sections')
    .select('*')
    .eq('visualization_id', visualizationId)
    .order('sequence_order');

  if (error) throw error;
  return data;
}

export async function updateSectionStatus(visualizationId, sectionType, status) {
  const { error } = await supabase
    .from('visualization_sections')
    .update({ status })
    .match({ visualization_id: visualizationId, section_type: sectionType });

  if (error) throw error;
}

// Helper function to get audio URL through server API
async function getAudioUrl(visualizationId) {
  try {
    const response = await fetch(`/api/visualization/audio?id=${visualizationId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch audio URL');
    }
    const data = await response.json();
    return data.audio_url;
  } catch (error) {
    console.error('Error fetching audio URL:', error);
    throw error;
  }
}

export async function completeVisualization(id) {
    console.log('Completing visualization:', id);
    try {
        // Get all sections in order
        const { data: sections, error: sectionsError } = await supabase
            .from('visualization_sections')
            .select('*')
            .eq('visualization_id', id)
            .order('sequence_order');

        if (sectionsError) throw sectionsError;

        // Get the visualization for voice selection
        const { data: visualization, error: vizError } = await supabase
            .from('visualizations')
            .select('*')
            .eq('id', id)
            .single();

        if (vizError) throw vizError;

        // Combine all section content
        const combinedText = sections
            .map(section => section.content)
            .join('\n\n');

        // Generate audio using OpenAI
        const response = await fetch('/api/generation/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: id,
                text: combinedText,
                voice: visualization.selected_voice
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate audio');
        }

        const data = await response.json();
        
        // Get the audio URL through the server API
        const audioUrl = await getAudioUrl(id);

        // Update visualization status
        const { error: updateError } = await supabase
            .from('visualizations')
            .update({ 
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) throw updateError;

        return { success: true, audio_url: audioUrl };
    } catch (error) {
        console.error('Error completing visualization:', error);
        throw error;
    }
}

// For temporary (non-logged-in) visualizations
export async function completeTempVisualization(id, text, voice) {
    try {
        // Generate audio using OpenAI
        const response = await fetch('/api/generation/complete-temp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id,
                text,
                voice
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate audio');
        }

        const data = await response.json();
        return { success: true, audio_url: data.audio_url };
    } catch (error) {
        console.error('Error completing temporary visualization:', error);
        throw error;
    }
} 