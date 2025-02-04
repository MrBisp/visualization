'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { toast } from 'react-hot-toast';
import AudioPlayer from '@/components/AudioPlayer';
import { completeTempVisualization } from '@/app/services/visualizationService';
import { getOpenAIVoiceId } from '@/app/constants/voices';
import Link from 'next/link';

export default function VisualizationPage({ params }) {
    const router = useRouter();
    const { id } = params;
    const [visualization, setVisualization] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        const fetchVisualization = async () => {
            try {
                console.log('Fetching visualization:', id);
                const response = await fetch(`/api/visualization/${id}`);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Server error:', errorData);
                    throw new Error(errorData.error || 'Failed to fetch visualization');
                }
                
                const data = await response.json();
                console.log('Visualization data:', data);
                setVisualization(data);
                setNewTitle(data.title || '');
            } catch (error) {
                console.error('Error fetching visualization:', error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVisualization();
    }, [id]);

    const handleRename = async () => {
        if (!newTitle.trim()) {
            toast.error('Title cannot be empty');
            return;
        }

        try {
            const response = await fetch(`/api/visualization/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: newTitle.trim() }),
            });

            if (!response.ok) throw new Error('Failed to update title');

            setVisualization(prev => ({ ...prev, title: newTitle.trim() }));
            setIsEditing(false);
            toast.success('Title updated successfully');
        } catch (error) {
            console.error('Error updating title:', error);
            toast.error('Failed to update title');
        }
    };

    const generateAudio = async () => {
        if (!visualization || isGeneratingAudio) return;
        
        setIsGeneratingAudio(true);
        try {
            // For temporary visualizations
            if (visualization.id.startsWith('temp-')) {
                const response = await completeTempVisualization({
                    text: visualization.description,
                    voice: getOpenAIVoiceId(visualization.selected_voice) || 'alloy'
                });

                if (!response.ok) throw new Error('Failed to generate audio');

                const data = await response.json();
                setVisualization(prev => ({
                    ...prev,
                    audio_url: data.audio_url,
                    audio_type: 'temp'
                }));
            } else {
                // Pre-flight check to verify user credits
                const creditCheckResponse = await fetch('/api/user/check-credits');
                if (!creditCheckResponse.ok) {
                    const errorData = await creditCheckResponse.json();
                    if (creditCheckResponse.status === 403) {
                        toast.error("You don't have enough credits. Please upgrade your plan.");
                        router.push('/#pricing');
                        return;
                    }
                    throw new Error(errorData.error || 'Failed to verify credits');
                }

                // For logged-in users
                const response = await fetch('/api/generation/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        id: visualization.id,
                        text: visualization.description,
                        voice: getOpenAIVoiceId(visualization.selected_voice) || 'alloy'  // Convert to OpenAI voice ID
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    if (response.status === 403 && data.error === "Insufficient credits") {
                        toast.error("You don't have enough credits. Please upgrade your plan.");
                        router.push('/#pricing');
                        return;
                    }
                    throw new Error(data.error || 'Failed to generate audio');
                }

                const data = await response.json();
                
                // Refresh the visualization data to get the latest audio information
                const refreshResponse = await fetch(`/api/visualization/${visualization.id}`);
                if (!refreshResponse.ok) throw new Error('Failed to refresh visualization data');
                
                const refreshedData = await refreshResponse.json();
                // Ensure we set both audio_url and audio_type after successful generation
                setVisualization(prev => ({
                    ...refreshedData,
                    audio_url: refreshedData.audio_url,
                    audio_type: 'full'  // Explicitly set to full after successful generation
                }));

                // Update session with new credit count
                const { update } = await import("next-auth/react");
                await update({
                    credits: (session?.user?.credits || 1) - 1
                });
            }
        } catch (error) {
            console.error('Audio generation error:', error);
            toast.error(error.message || 'Failed to generate audio');
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => router.push('/dashboard/visualizations')}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!visualization) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Visualization Not Found</h1>
                    <button 
                        className="btn btn-primary"
                        onClick={() => router.push('/dashboard/visualizations')}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-3xl mx-auto">
                {/* Mobile Back Button */}
                <button 
                    onClick={() => router.push('/dashboard/visualizations')}
                    className="md:hidden mb-6 btn btn-ghost btn-sm gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z" clipRule="evenodd" />
                    </svg>
                    Back to Dashboard
                </button>

                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="input input-bordered"
                                    placeholder="Enter visualization title"
                                />
                                <button 
                                    onClick={handleRename}
                                    className="btn btn-primary btn-sm"
                                >
                                    Save
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsEditing(false);
                                        setNewTitle(visualization.title || '');
                                    }}
                                    className="btn btn-ghost btn-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold">
                                    {visualization.title || 'Untitled Visualization'}
                                </h1>
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="btn btn-ghost btn-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                    {/* Desktop Back Button */}
                    <button 
                        onClick={() => router.push('/dashboard/visualizations')}
                        className="hidden md:flex btn btn-outline"
                    >
                        Back to Dashboard
                    </button>
                </div>

                <div className="mb-8">
                    {visualization.audio_type === 'temp' && session?.user && (
                        <div className="alert alert-warning mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <h3 className="font-bold">Preview Version</h3>
                                <p className="text-sm">This is a temporary preview of your visualization. Generate the full version to:</p>
                                <ul className="list-disc list-inside text-sm mt-2">
                                    <li>Get the full version</li>
                                    <li>Save it permanently</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Audio Visualization</h2>
                        <div className="flex gap-2">
                            {visualization.audio_type === 'temp' ? (
                                <button 
                                    className="btn btn-primary"
                                    onClick={generateAudio}
                                    disabled={isGeneratingAudio}
                                >
                                    {isGeneratingAudio ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Generating Full Version...
                                        </>
                                    ) : (
                                        'Generate Full Version'
                                    )}
                                </button>
                            ) : !visualization.audio_url && (
                                <>
                                    <div className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-yellow-500">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.732 6.232a2.5 2.5 0 013.536 0 .75.75 0 101.06-1.06A4 4 0 006.5 8v.165c0 .364.034.728.1 1.085h-.35a.75.75 0 000 1.5h.737a5.25 5.25 0 01-.367 3.072l-.055.123a.75.75 0 00.848 1.037l1.272-.283a3.493 3.493 0 011.604.021 4.992 4.992 0 002.422 0l.97-.242a.75.75 0 00-.363-1.456l-.971.243a3.491 3.491 0 01-1.694 0 4.992 4.992 0 00-2.258-.038c.19-.811.227-1.651.111-2.477h.292a.75.75 0 000-1.5H8.824c-.059-.313-.09-.630-.09-.949v-.165z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm font-medium">{session?.user?.credits || 0} credits</span>
                                    </div>
                                    <button
                                        onClick={generateAudio}
                                        className="btn btn-primary"
                                        disabled={isGeneratingAudio || (session?.user?.credits || 0) < 1}
                                    >
                                        {isGeneratingAudio ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Generating Audio...
                                            </>
                                        ) : (
                                            'Generate Audio'
                                        )}
                                    </button>
                                </>
                            )}
                            {visualization.audio_url && !isGeneratingAudio && visualization.audio_type === 'full' && (
                                <button
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = visualization.audio_url;
                                        link.download = `${visualization.title || 'visualization'}.mp3`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    className="btn btn-outline btn-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Download Audio
                                </button>
                            )}
                        </div>
                    </div>

                    {visualization.audio_url ? (
                        <div>
                            <AudioPlayer 
                                visualizationId={visualization.id}
                                audioUrl={visualization.audio_url}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-600 mb-4">No audio generated yet</p>
                            {(session?.user?.credits || 0) < 1 ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-yellow-600">You need credits to generate audio</p>
                                    <Link href="/#pricing" className="btn btn-primary">
                                        Get Credits
                                    </Link>
                                </div>
                            ) : (
                                <button
                                    onClick={generateAudio}
                                    className="btn btn-primary"
                                    disabled={isGeneratingAudio}
                                >
                                    {isGeneratingAudio ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Generating Audio...
                                        </>
                                    ) : (
                                        'Generate Audio'
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {visualization.description && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Your Scenario</h2>
                        <div className="bg-base-200 rounded-lg p-4">
                            <p className="text-gray-600">{visualization.description}</p>
                        </div>
                    </div>
                )}

                {visualization.sections && visualization.sections.length > 0 && (
                    <div className="prose max-w-none">
                        <h2 className="text-xl font-semibold mb-4">Visualization Script</h2>
                        <div className="space-y-6">
                            {visualization.sections
                                .sort((a, b) => a.sequence_order - b.sequence_order)
                                .map((section, index) => (
                                <div key={section.id || index} className="bg-base-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold mb-2">
                                        {section.section_type.split('_').map(word => 
                                            word.charAt(0).toUpperCase() + word.slice(1)
                                        ).join(' ')}
                                    </h3>
                                    <div className="whitespace-pre-wrap">
                                        {section.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 