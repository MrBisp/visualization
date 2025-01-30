import { 
    getVisualizationProgress,
    generateSection,
    updateVisualizationStatus,
    updateSectionStatus,
    completeVisualization 
} from '@/app/services/visualizationService';

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
    try {
        if (isDebugMode) {
            await handleDebugMode({
                SECTION_TYPES,
                setCurrentSection,
                setProgress,
                setVisualization,
                setIsGeneratingAudio
            });
            return;
        }

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

    } catch (error) {
        console.error('Generation failed:', error);
        setError('Failed to generate visualization');
        if (!isDebugMode) {
            await updateVisualizationStatus(id, 'failed');
            localStorage.removeItem(`processing_start_${id}`);
        }
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
            setIsGeneratingAudio(true);
            
            // Complete the visualization using the service
            const completedVisualization = await completeVisualization(id);

            // Update the visualization state with audio data
            setVisualization(prev => ({
                ...prev,
                ...completedVisualization,
                audio_url: completedVisualization.visualization_audio?.[0]?.audio_url
            }));

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