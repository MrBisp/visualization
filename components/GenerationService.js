import { 
    getVisualizationProgress,
    generateSection,
    updateVisualizationStatus,
    updateSectionStatus,
    completeVisualization 
} from '@/app/services/visualizationService';
import { toast } from 'react-hot-toast';
import { getOpenAIVoiceId } from '@/app/constants/voices';

export async function handleGeneration({
    id,
    isDebugMode,
    noAudio,
    SECTION_TYPES,
    setCurrentSection,
    setProgress,
    setVisualization,
    setIsGeneratingAudio,
    setError
}) {
    // Store the generationKey at the top level of the function
    const generationKey = `generation_in_progress_${id}`;
    
    try {
        // Check if generation is already in progress
        if (localStorage.getItem(generationKey)) {
            console.log('Generation already in progress, skipping');
            return;
        }

        // Get the current visualization state to preserve audio URL
        const savedData = localStorage.getItem('current_visualization');
        const currentVisualization = savedData ? JSON.parse(savedData) : null;
        const existingAudioUrl = currentVisualization?.audio_url;
        
        // Set generation in progress flag
        localStorage.setItem(generationKey, 'true');

        if (isDebugMode) {
            await handleDebugMode({
                SECTION_TYPES,
                setCurrentSection,
                setProgress,
                setVisualization,
                setIsGeneratingAudio
            });
            localStorage.removeItem(generationKey);
            return;
        }

        // Check if this is a temporary visualization
        const isTemporary = id.startsWith('temp-');
        
        if (isTemporary) {
            // For temporary visualizations, we'll generate content with a length limit
            if (!savedData) {
                throw new Error('No visualization data found');
            }

            // Parse the saved data if it's a string
            const visualizationData = typeof savedData === 'string' ? JSON.parse(savedData) : savedData;

            // Initialize sections if not already present
            if (!visualizationData.sections) {
                visualizationData.sections = Object.values(SECTION_TYPES).map((type, index) => ({
                    id: `temp-section-${index}`,
                    section_type: type,
                    status: 'pending',
                    sequence_order: index,
                    content: ''
                }));
            }

            // Set initial state
            setVisualization(visualizationData);
            setProgress(visualizationData.sections.reduce((acc, section) => ({
                ...acc,
                [section.section_type]: section.status
            }), {}));
            
            // Generate each section
            for (const section of visualizationData.sections) {
                setCurrentSection(section.section_type);
                setProgress(prev => ({
                    ...prev,
                    [section.section_type]: 'processing'
                }));

                try {
                    // Generate content using the API
                    const response = await fetch('/api/generation/section', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            text: visualizationData.text,
                            section_type: section.section_type,
                            isPreview: true
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to generate section content');
                    }

                    const data = await response.json();
                    section.content = data.content;
                    section.status = 'completed';

                    setProgress(prev => ({
                        ...prev,
                        [section.section_type]: 'completed'
                    }));

                    setVisualization(prev => ({
                        ...prev,
                        sections: prev.sections.map(s => 
                            s.section_type === section.section_type ? section : s
                        )
                    }));
                } catch (error) {
                    console.error(`Error generating section ${section.section_type}:`, error);
                    section.status = 'failed';
                    setProgress(prev => ({
                        ...prev,
                        [section.section_type]: 'failed'
                    }));
                }
            }

            // Store the updated sections in localStorage
            localStorage.setItem('current_visualization', JSON.stringify(visualizationData));

            // Clear processing timestamp
            localStorage.removeItem(`processing_start_${id}`);
            
            // For temporary visualizations, generate audio but with expiration notice
            if (!noAudio) {
                setIsGeneratingAudio(true);
                try {
                    // Check if audio was already generated
                    const audioGeneratedKey = `audio_generated_${id}`;
                    if (localStorage.getItem(audioGeneratedKey)) {
                        console.log('Audio already generated, skipping');
                        setIsGeneratingAudio(false);
                        return;
                    }

                    // Combine all sections and limit to 1500 characters
                    const fullText = visualizationData.sections
                        .sort((a, b) => a.sequence_order - b.sequence_order)
                        .map(section => section.content)
                        .join('\n\n');
                    
                    const limitedText = fullText.length > 1500 
                        ? fullText.substring(0, 1500) + '[...] This is the end of the preview. If you want to listen to the whole visualization, please sign up.'
                        : fullText;

                    // Complete the visualization using the service
                    const audioResponse = await fetch('/api/generation/complete-temp', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            text: limitedText,
                            voice: getOpenAIVoiceId(visualizationData.voice),
                            id: visualizationData.id
                        }),
                    });

                    if (!audioResponse.ok) {
                        throw new Error('Failed to generate audio');
                    }

                    const audioData = await audioResponse.json();
                    
                    // Update visualization with audio URL
                    visualizationData.audio_url = audioData.audio_url;
                    visualizationData.audio_expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
                    
                    // Update state and localStorage
                    setVisualization(visualizationData);
                    localStorage.setItem('current_visualization', JSON.stringify(visualizationData));
                    
                    // Mark audio as generated
                    localStorage.setItem(audioGeneratedKey, 'true');

                    // Show expiration notice
                    toast(
                        <div>
                            Your audio will be available for 1 hour. 
                            <br />
                            <span className="font-semibold">Sign in to save it permanently!</span>
                        </div>, 
                        {
                            duration: 6000,
                            icon: '⏳'
                        }
                    );
                } catch (error) {
                    console.error('Audio generation error:', error);
                    toast("Failed to generate audio. Please try again or sign in for the full experience.", {
                        icon: '❌'
                    });
                } finally {
                    setIsGeneratingAudio(false);
                }
            }
        } else {
            // Get initial progress
            const sections = await getVisualizationProgress(id);
            const currentProgress = sections.reduce((acc, section) => ({
                ...acc,
                [section.section_type]: section.status
            }), {});
            
            setProgress(currentProgress);
            setVisualization(prev => ({ ...prev, sections }));

            // Handle stale processing sections
            await handleStaleProcessing({ id, sections, setProgress });

            // Generate each section sequentially
            await generateSections({
                id,
                SECTION_TYPES,
                currentProgress,
                setCurrentSection,
                setProgress,
                setVisualization
            });

            // Clear processing timestamp
            localStorage.removeItem(`processing_start_${id}`);

            // Handle audio generation
            await handleAudioGeneration({
                id,
                noAudio,
                setIsGeneratingAudio,
                setVisualization
            });
        }

        // When updating visualization state, preserve the audio URL if it exists
        const updateVisualizationState = (updater) => {
            setVisualization(prev => {
                const updated = typeof updater === 'function' ? updater(prev) : updater;
                return {
                    ...updated,
                    audio_url: updated.audio_url || existingAudioUrl
                };
            });
        };

        // Replace all setVisualization calls with updateVisualizationState
        if (isTemporary) {
            // For temporary visualizations...
            const parsedData = typeof savedData === 'string' ? JSON.parse(savedData) : savedData;
            updateVisualizationState(parsedData);
            // Rest of temporary visualization logic...
        } else {
            // For logged-in users...
            const sections = await getVisualizationProgress(id);
            updateVisualizationState(prev => ({ ...prev, sections }));
            // Rest of logged-in user logic...
        }

    } catch (error) {
        console.error('Generation failed:', error);
        setError('Failed to generate visualization');
        if (!isDebugMode && !id.startsWith('temp-')) {
            await updateVisualizationStatus(id, 'failed');
            localStorage.removeItem(`processing_start_${id}`);
        }
    } finally {
        localStorage.removeItem(generationKey);
    }
}

async function handleDebugMode({
    SECTION_TYPES,
    setCurrentSection,
    setProgress,
    setVisualization,
    setIsGeneratingAudio
}) {
    // Debug mode: simulate generation with 5-second delays
    for (const sectionType of Object.values(SECTION_TYPES)) {
        setCurrentSection(sectionType);
        
        // Update progress to processing
        setProgress(prev => ({
            ...prev,
            [sectionType]: 'processing'
        }));

        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Update progress to completed
        setProgress(prev => ({
            ...prev,
            [sectionType]: 'completed'
        }));

        // Update visualization with mock content
        setVisualization(prev => ({
            ...prev,
            sections: prev.sections.map(section => 
                section.section_type === sectionType
                    ? { ...section, status: 'completed', content: `Debug content for ${sectionType}. This is a simulated visualization section that would normally contain the AI-generated content.` }
                    : section
            )
        }));
    }

    // Simulate audio generation
    setIsGeneratingAudio(true);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Set mock audio URL
    setVisualization(prev => ({
        ...prev,
        audio_url: 'data:audio/mp3;base64,MOCK_AUDIO_DATA'
    }));
    setIsGeneratingAudio(false);
}

async function handleStaleProcessing({ id, sections, setProgress }) {
    const processingStartTime = localStorage.getItem(`processing_start_${id}`);
    const hasStaleProcessing = processingStartTime && 
        (Date.now() - parseInt(processingStartTime)) > 1 * 60 * 1000;

    const hasProcessingSections = sections.some(section => section.status === 'processing');
    if (hasProcessingSections && (!processingStartTime || hasStaleProcessing)) {
        // Reset processing sections to pending
        for (const section of sections) {
            if (section.status === 'processing') {
                await updateSectionStatus(id, section.section_type, 'pending');
            }
        }
        
        // Refresh progress after reset
        const updatedSections = await getVisualizationProgress(id);
        setProgress(updatedSections.reduce((acc, section) => ({
            ...acc,
            [section.section_type]: section.status
        }), {}));
    }
}

async function generateSections({
    id,
    SECTION_TYPES,
    currentProgress,
    setCurrentSection,
    setProgress,
    setVisualization
}) {
    for (const sectionType of Object.values(SECTION_TYPES)) {
        try {
            // Skip if already completed
            if (currentProgress[sectionType] === 'completed') {
                console.log(`Section ${sectionType} already completed, skipping`);
                continue;
            }

            setCurrentSection(sectionType);
            const sectionStartTime = Date.now();
            
            // Set processing start time
            localStorage.setItem(`processing_start_${id}`, sectionStartTime.toString());
            await generateSection(id, sectionType);
            
            // Update progress and visualization
            const updatedSections = await getVisualizationProgress(id);
            setProgress(updatedSections.reduce((acc, section) => ({
                ...acc,
                [section.section_type]: section.status
            }), {}));
            setVisualization(prev => ({
                ...prev,
                sections: updatedSections
            }));
        } catch (sectionError) {
            console.error(`Failed to generate section ${sectionType}:`, sectionError);
            setProgress(prev => ({
                ...prev,
                [sectionType]: 'failed'
            }));
        }
    }
}

async function handleAudioGeneration({
    id,
    noAudio,
    setIsGeneratingAudio,
    setVisualization
}) {
    const allSections = await getVisualizationProgress(id);
    const allCompleted = allSections.every(section => section.status === 'completed');

    if (allCompleted && !noAudio) {
        try {
            // Check if audio was already generated
            const audioGeneratedKey = `audio_generated_${id}`;
            if (localStorage.getItem(audioGeneratedKey)) {
                console.log('Audio already generated, skipping');
                return;
            }

            setIsGeneratingAudio(true);
            
            // Complete the visualization using the service
            const completedVisualization = await completeVisualization(id);

            // Get the audio URL from the API
            const audioResponse = await fetch(`/api/visualization/${id}/audio`);
            const audioData = await audioResponse.json();

            // Update the visualization state with audio data
            setVisualization(prev => ({
                ...prev,
                ...completedVisualization,
                audio_url: audioData.audio_url
            }));

            // Mark audio as generated
            localStorage.setItem(audioGeneratedKey, 'true');

            // Clear localStorage since we're done
            localStorage.removeItem('current_visualization');
            setIsGeneratingAudio(false);
        } catch (error) {
            console.error('Audio generation error:', error);
            throw error;
        }
    } else if (allCompleted && noAudio) {
        localStorage.removeItem('current_visualization');
    }
} 