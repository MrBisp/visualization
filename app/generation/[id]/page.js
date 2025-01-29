'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { 
    SECTION_TYPES, 
    getVisualizationProgress,
    generateSection,
    updateVisualizationStatus,
    updateSectionStatus,
    completeVisualization 
} from '@/app/services/visualizationService';
import ButtonSignin from '@/components/ButtonSignin';
import RegisterForm from '@/components/RegisterForm';
import AudioPlayer from '@/components/AudioPlayer';

export default function GenerationPage({ params }) {
    const router = useRouter();
    const { id } = params;
    const { data: session } = useSession();

    const [isTesting, setIsTesting] = useState(true);
    
    const [visualization, setVisualization] = useState(null);
    const [currentSection, setCurrentSection] = useState(null);
    const [progress, setProgress] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const loadAndStart = async () => {
            // Load visualization data from localStorage
            const savedData = localStorage.getItem('current_visualization');
            if (!savedData) {
                setError('No visualization data found');
                return;
            }

            try {
                const data = JSON.parse(savedData);
                if (data.id !== id) {
                    setError('Visualization ID mismatch');
                    return;
                }

                // Fetch sections data
                const sections = await getVisualizationProgress(id);
                const visualizationWithSections = {
                    ...data,
                    sections
                };

                if (mounted) {
                    setVisualization(visualizationWithSections);
                    setProgress(sections.reduce((acc, section) => ({
                        ...acc,
                        [section.section_type]: section.status
                    }), {}));
                    await startGeneration();
                }
            } catch (error) {
                if (mounted) {
                    console.error('Error loading visualization:', error);
                    setError('Failed to load visualization data');
                }
            }
        };

        loadAndStart();

        // Cleanup function
        return () => {
            mounted = false;
        };
    }, [id]); // Only depend on id

    const startGeneration = async () => {
        console.log('Starting generation');
        try {
            // Get initial progress
            const sections = await getVisualizationProgress(id);
            const currentProgress = sections.reduce((acc, section) => ({
                ...acc,
                [section.section_type]: section.status
            }), {});
            
            setProgress(currentProgress);
            
            // Update visualization with latest sections
            setVisualization(prev => ({
                ...prev,
                sections
            }));

            console.log('Progress:', currentProgress);

            // Check for stale processing sections (older than 5 minutes)
            const processingStartTime = localStorage.getItem(`processing_start_${id}`);
            const hasStaleProcessing = processingStartTime && 
                (Date.now() - parseInt(processingStartTime)) > 5 * 60 * 1000;

            // If we find processing sections but no timestamp or stale timestamp,
            // assume they're stale and need to be reprocessed
            const hasProcessingSections = sections.some(section => section.status === 'processing');
            if (hasProcessingSections && (!processingStartTime || hasStaleProcessing)) {
                console.log('Found stale processing sections, will reprocess them');
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
            } else if (hasProcessingSections) {
                // If sections are still being processed in another tab/window
                console.log('Sections are being processed in another session, polling for updates');
                // Start polling for updates
                const pollInterval = setInterval(async () => {
                    const updatedSections = await getVisualizationProgress(id);
                    setProgress(updatedSections.reduce((acc, section) => ({
                        ...acc,
                        [section.section_type]: section.status
                    }), {}));
                    setVisualization(prev => ({
                        ...prev,
                        sections: updatedSections
                    }));
                    
                    // If no more processing sections, stop polling
                    if (!updatedSections.some(section => section.status === 'processing')) {
                        clearInterval(pollInterval);
                        // Restart generation to handle any remaining sections
                        startGeneration();
                    }
                }, 5000); // Poll every 5 seconds

                // Cleanup interval on component unmount
                return () => clearInterval(pollInterval);
            }
            
            // Generate each section sequentially, skipping completed ones
            for (const sectionType of Object.values(SECTION_TYPES)) {
                try {
                    // Skip if already completed
                    if (currentProgress[sectionType] === 'completed') {
                        console.log(`Section ${sectionType} already completed, skipping`);
                        continue;
                    }

                    setCurrentSection(sectionType);
                    // Set processing start time when we begin generating
                    localStorage.setItem(`processing_start_${id}`, Date.now().toString());
                    await generateSection(id, sectionType);
                    console.log('Generated section:', sectionType);
                    
                    // Update progress and visualization after each section
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

            // Clear processing timestamp when done
            localStorage.removeItem(`processing_start_${id}`);

            // Check if all sections are completed
            const allSections = await getVisualizationProgress(id);
            const allCompleted = allSections.every(section => section.status === 'completed');

            if (allCompleted) {
                try {
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
                } catch (error) {
                    console.error('Completion error:', error);
                    setError(`Failed to complete visualization: ${error.message}`);
                }
            }

        } catch (error) {
            console.error('Generation failed:', error);
            setError('Failed to generate visualization');
            await updateVisualizationStatus(id, 'failed');
            localStorage.removeItem(`processing_start_${id}`);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => router.push('/getting-started')}
                    >
                        Start Over
                    </button>
                </div>
            </div>
        );
    }

    const testContent = (
        <>
            {/* Progress Steps */}
            <div className="space-y-4">
                {Object.entries(SECTION_TYPES).map(([key, type]) => (
                    <div 
                        key={type}
                        className={`p-4 rounded-lg border ${
                            currentSection === type ? 'border-primary bg-primary/5' : 'border-gray-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">
                                {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                            </h3>
                            <Status status={progress[type]} />
                        </div>
                        {/* Add content display */}
                        {progress[type] === 'completed' && (
                            <div className="mt-4 p-4 bg-gray-50 rounded text-sm font-mono whitespace-pre-wrap">
                                {visualization?.sections?.find(s => s.section_type === type)?.content || 'No content available'}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Overall Progress */}
            <div className="mt-8">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ 
                            width: `${
                                (Object.values(progress).filter(s => s === 'completed').length / 
                                Object.keys(SECTION_TYPES).length) * 100
                            }%` 
                        }}
                    />
                </div>
            </div>

            {/* Audio Player - Show when all sections are completed */}
            {Object.values(progress).every(status => status === 'completed') && visualization?.audio_url && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Listen to Your Visualization</h2>
                    <AudioPlayer audioUrl={visualization.audio_url} />
                </div>
            )}
        </>
    );


    return (
        <div className="min-h-screen p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Generating Your Visualization...</h1>
                
                {isTesting ? testContent : null}

                {!session && (
                    <>
                        <p>
                            Generating your visualization usually takes 1-2 minutes. In the meantime, you can sign-up for a free account, to save your visualization so you always have it.
                        </p>

                        <div className="mt-8 flex flex-col items-center border p-4 rounded-lg">
                            <h3 className="text-xl font-bold mb-4">Sign up for free</h3>
                            <RegisterForm shouldRedirect={false} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const Status = ({ status }) => {
    switch (status) {
        case 'completed':
            return <span className="text-green-600">✓ Complete</span>;
        case 'processing':
            return (
                <span className="text-primary">
                    <span className="loading loading-spinner loading-sm mr-2" />
                    Processing
                </span>
            );
        case 'failed':
            return <span className="text-red-600">Failed</span>;
        default:
            return <span className="text-gray-400">Pending</span>;
    }
}; 