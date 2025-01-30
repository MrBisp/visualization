'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { toast } from 'react-hot-toast';
import AudioPlayer from '@/components/AudioPlayer';
import { SECTION_TYPES } from '@/app/services/visualizationService';

export default function VisualizationPage({ params }) {
    const router = useRouter();
    const { id } = params;
    const [visualization, setVisualization] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [showScript, setShowScript] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

    useEffect(() => {
        const fetchVisualization = async () => {
            try {
                const response = await fetch(`/api/visualization/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch visualization');
                }
                const data = await response.json();
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
            const response = await fetch('/api/generation/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: visualization.id }),
            });

            if (!response.ok) throw new Error('Failed to generate audio');

            const data = await response.json();
            
            // Update visualization with new audio URL
            setVisualization(prev => ({
                ...prev,
                audio_url: data.visualization.visualization_audio?.[0]?.audio_url
            }));

            toast.success('Audio generated successfully');
        } catch (error) {
            console.error('Error generating audio:', error);
            toast.error('Failed to generate audio');
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
        <div className="min-h-screen p-8 bg-gray-50">
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
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Audio Visualization</h2>
                        {visualization.audio_url && (
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
                    {visualization.audio_url ? (
                        <AudioPlayer 
                            visualizationId={visualization.id}
                            audioUrl={visualization.audio_url}
                        />
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="space-y-4">
                                <p className="text-gray-600">
                                    No audio visualization available yet. Would you like to generate one?
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                                    <p className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Audio generation typically takes 1-2 minutes to complete.
                                    </p>
                                </div>
                                <button
                                    onClick={generateAudio}
                                    disabled={isGeneratingAudio}
                                    className="btn btn-primary w-full sm:w-auto"
                                >
                                    {isGeneratingAudio ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm mr-2"></span>
                                            Generating Audio... (1-2 minutes)
                                        </>
                                    ) : (
                                        'Generate Audio'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {visualization.description && (
                    <p className="text-gray-600 mb-8">{visualization.description}</p>
                )}

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Visualization Script</h2>
                        <button 
                            onClick={() => setShowScript(!showScript)}
                            className="btn btn-ghost btn-sm"
                        >
                            {showScript ? 'Hide Script' : 'Show Script'}
                        </button>
                    </div>
                    
                    {showScript && (
                        <div className="space-y-8">
                            {visualization.sections?.map((section) => (
                                <div 
                                    key={section.section_type}
                                    className="bg-white rounded-lg shadow-sm p-6"
                                >
                                    <h3 className="text-lg font-medium mb-4">
                                        {section.section_type.split('_').map(word => 
                                            word.charAt(0).toUpperCase() + word.slice(1)
                                        ).join(' ')}
                                    </h3>
                                    <p className="text-gray-600 whitespace-pre-wrap">
                                        {section.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 