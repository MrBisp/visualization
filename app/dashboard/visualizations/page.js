'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AudioPlayer from '@/components/AudioPlayer';

function VisualizationCard({ visualization }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this visualization?')) return;
        
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/visualization/${visualization.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete visualization');
            
            toast.success('Visualization deleted successfully');
            // Refresh the page to update the list
            window.location.reload();
        } catch (error) {
            toast.error('Failed to delete visualization');
            console.error('Delete error:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-gray-100 text-gray-600';
            case 'processing':
                return 'bg-blue-100 text-blue-600';
            case 'completed':
                return 'bg-green-100 text-green-600';
            case 'failed':
                return 'bg-red-100 text-red-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusMessage = (status, hasAudio) => {
        switch (status) {
            case 'pending':
                return 'Waiting to start';
            case 'processing':
                return 'Generating...';
            case 'completed':
                return hasAudio ? 'Completed' : 'Audio pending';
            case 'failed':
                return 'Failed';
            default:
                return status;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4" style={{ backgroundColor: "rgba(247, 228, 210, 0.5)" }}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        {visualization.title || 'Untitled Visualization'}
                    </h3>
                    <p className="text-sm text-gray-500">
                        Created {new Date(visualization.created_at).toLocaleDateString()}
                    </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${visualization.status === 'completed' && !visualization.has_audio ? 'bg-yellow-100 text-yellow-600' : getStatusBadgeClass(visualization.status)}`}>
                    {getStatusMessage(visualization.status, visualization.has_audio)}
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {visualization.status === 'completed' ? (
                    <>
                        <Link 
                            href={`/dashboard/visualizations/${visualization.id}`}
                            className="btn btn-primary btn-sm"
                        >
                            View Visualization
                        </Link>
                    </>
                ) : visualization.status === 'failed' ? (
                    <Link 
                        href={`/getting-started?retry=${visualization.id}`}
                        className="btn btn-error btn-sm"
                    >
                        Retry Generation
                    </Link>
                ) : visualization.status === 'processing' ? (
                    <Link 
                        href={`/generation/${visualization.id}`}
                        className="btn btn-info btn-sm"
                    >
                        View Progress
                    </Link>
                ) : (
                    <Link 
                        href={`/generation/${visualization.id}`}
                        className="btn btn-warning btn-sm"
                    >
                        Start Generation
                    </Link>
                )}
                
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="btn btn-ghost btn-sm text-error"
                >
                    {isDeleting ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        'Delete'
                    )}
                </button>
            </div>
        </div>
    );
}

export default function VisualizationsPage() {
    const { data: session } = useSession();
    const [visualizations, setVisualizations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVisualizations = async () => {
            try {
                const response = await fetch('/api/visualization/list');
                if (!response.ok) throw new Error('Failed to fetch visualizations');
                
                const data = await response.json();
                setVisualizations(data);
            } catch (error) {
                console.error('Fetch error:', error);
                setError('Failed to load visualizations');
            } finally {
                setIsLoading(false);
            }
        };

        fetchVisualizations();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-error mb-4">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="btn btn-primary"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <h1 className="text-2xl font-bold text-gray-900">My Visualizations</h1>
                <Link 
                    href="/getting-started" 
                    className="btn btn-primary w-full sm:w-auto"
                >
                    Create New Visualization
                </Link>
            </div>

            {visualizations.length === 0 ? (
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No visualizations yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Create your first visualization to get started
                    </p>
                    <Link 
                        href="/getting-started" 
                        className="btn btn-primary"
                    >
                        Create Your First Visualization
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visualizations.map((visualization) => (
                        <VisualizationCard 
                            key={visualization.id} 
                            visualization={visualization} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
} 