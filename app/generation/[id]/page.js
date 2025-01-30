'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { SECTION_TYPES } from '@/app/services/visualizationService';
import { handleGeneration } from '@/components/GenerationService';
import VisualizationProgress from '@/components/VisualizationProgress';
import AudioSection from '@/components/AudioSection';
import ButtonSignin from '@/components/ButtonSignin';
import RegisterForm from '@/components/RegisterForm';

export default function GenerationPage({ params }) {
    const router = useRouter();
    const { id } = params;
    const { data: session, update: updateSession } = useSession();
    const isDebugMode = id === 'debug';

    const [isTesting, setIsTesting] = useState(false);
    const [noAudio, setNoAudio] = useState(false);
    
    const [visualization, setVisualization] = useState(null);
    const [currentSection, setCurrentSection] = useState(null);
    const [progress, setProgress] = useState({});
    const [error, setError] = useState(null);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

    // Section descriptions for the user
    const sectionDescriptions = {
        [SECTION_TYPES.INTRODUCTION]: {
            pending: "Preparing to create your introduction...",
            processing: [
                "Crafting a calming opening sequence...",
                "Adding gentle breathing cues...",
                "Fine-tuning the relaxation guidance...",
                "Polishing the mindset preparation..."
            ]
        },
        [SECTION_TYPES.SCENE_SETUP]: {
            pending: "Getting ready to build your scene...",
            processing: [
                "Designing the perfect environment...",
                "Adding rich sensory details...",
                "Painting the visual atmosphere...",
                "Incorporating ambient sounds and textures..."
            ]
        },
        [SECTION_TYPES.EMOTIONAL_PRIMING]: {
            pending: "Preparing your emotional foundation...",
            processing: [
                "Creating confidence-building elements...",
                "Weaving in positive affirmations...",
                "Adding empowering moments...",
                "Strengthening your emotional readiness..."
            ]
        },
        [SECTION_TYPES.ACTION_EXECUTION]: {
            pending: "Setting up your performance sequence...",
            processing: [
                "Choreographing your key actions...",
                "Adding performance details...",
                "Incorporating success moments...",
                "Fine-tuning the execution flow..."
            ]
        },
        [SECTION_TYPES.REFLECTION]: {
            pending: "Preparing your reflection segment...",
            processing: [
                "Creating meaningful closing thoughts...",
                "Adding success reinforcement...",
                "Weaving in future applications...",
                "Polishing the final experience..."
            ]
        }
    };

    useEffect(() => {
        let mounted = true;

        const loadAndStart = async () => {
            if (isDebugMode) {
                // In debug mode, create mock data
                const mockVisualization = {
                    id: 'debug',
                    text: 'Debug visualization',
                    selected_voice: 'alloy',
                    sections: Object.values(SECTION_TYPES).map((type, index) => ({
                        section_type: type,
                        status: 'pending',
                        sequence_order: index,
                        content: `Mock content for ${type}`
                    }))
                };

                if (mounted) {
                    setVisualization(mockVisualization);
                    setProgress(mockVisualization.sections.reduce((acc, section) => ({
                        ...acc,
                        [section.section_type]: section.status
                    }), {}));
                    await startGeneration();
                }
                return;
            }

            // Regular loading logic for non-debug mode
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

                if (mounted) {
                    setVisualization(data);
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

        return () => {
            mounted = false;
        };
    }, [id, isDebugMode]);

    // Update loading message every 3 seconds
    useEffect(() => {
        if (!currentSection || !progress[currentSection] === 'processing') return;

        const interval = setInterval(() => {
            setLoadingMessageIndex(prev => 
                (prev + 1) % sectionDescriptions[currentSection].processing.length
            );
        }, 3000);

        return () => clearInterval(interval);
    }, [currentSection, progress]);

    const getCurrentMessage = () => {
        if (!currentSection) return 'Getting everything ready... This process typically takes 3-4 minutes in total.';
        
        if (isGeneratingAudio) {
            return "Converting your visualization into audio... (about 1 minute remaining)";
        }
        
        const status = progress[currentSection];
        if (status === 'processing') {
            return sectionDescriptions[currentSection].processing[loadingMessageIndex];
        } else if (status === 'pending') {
            return sectionDescriptions[currentSection].pending;
        } else if (status === 'completed') {
            const allSectionsCompleted = Object.values(progress).every(s => s === 'completed');
            if (allSectionsCompleted && !visualization?.audio_url) {
                return "All sections completed, preparing audio generation...";
            }
            return `${currentSection.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')} completed!`;
        }
        return 'Processing...';
    };

    const startGeneration = async () => {
        await handleGeneration({
            id,
            isDebugMode,
            noAudio,
            SECTION_TYPES,
            setCurrentSection,
            setProgress,
            setVisualization,
            setIsGeneratingAudio,
            setError
        });
    };

    // Handle successful registration
    const handleRegistrationSuccess = async () => {
        try {
            // Update the session first
            await updateSession();
            
            // Wait a bit to ensure session is updated
            await new Promise(resolve => setTimeout(resolve, 500));

            // Make API call to associate visualization with user
            const response = await fetch('/api/visualization/associate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    visualizationId: id
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to associate visualization with user');
            }

            // Refresh the router to update the UI
            router.refresh();
        } catch (error) {
            console.error('Error associating visualization:', error);
            throw error;
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

    return (
        <div className="min-h-screen p-8" style={{ backgroundColor: "transparent" }}>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center">Generating Your Visualization</h1>
                
                <VisualizationProgress 
                    currentSection={currentSection}
                    progress={progress}
                    isGeneratingAudio={isGeneratingAudio}
                    getCurrentMessage={getCurrentMessage}
                    SECTION_TYPES={SECTION_TYPES}
                />

                <AudioSection 
                    visualization={visualization}
                    progress={progress}
                />

                {visualization?.audio_url && (
                    <div className="mt-8 flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = visualization.audio_url;
                                link.download = 'visualization.mp3';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="btn btn-primary"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Download Audio
                        </button>
                        <button 
                            onClick={() => router.push('/dashboard')}
                            className="btn btn-outline"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {!session && (
                    <div className="mt-8 border p-6 rounded-lg" style={{ backgroundColor: "rgba(247, 228, 210, 0.1)" }}>
                        <p className="text-gray-600 mb-4">
                            Your visualization is being generated and will take about 3-4 minutes to complete. Sign up now to:
                            <ul className="list-disc ml-6 mt-2">
                                <li>Save this visualization to your account automatically</li>
                                <li>Access your visualization anytime</li>
                            </ul>
                        </p>

                        <div className="flex flex-col items-center">
                            <h3 className="text-xl font-bold mb-4">Sign up for free</h3>
                            <RegisterForm 
                                shouldRedirect={false} 
                                onSuccess={handleRegistrationSuccess}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 