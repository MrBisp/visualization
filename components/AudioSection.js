import AudioPlayer from './AudioPlayer';

export default function AudioSection({ visualization, progress }) {
    const allCompleted = Object.values(progress).every(status => status === 'completed');
    
    if (!allCompleted || !visualization?.audio_url) {
        return null;
    }

    // For temporary visualizations, we already have the signed URL
    const isTemp = visualization.id?.startsWith('temp-');

    return (
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Your Visualization is Ready!</h2>
            <p className="text-gray-600 mb-4">
                Listen to your personalized visualization. You can adjust the playback speed and skip forward/backward as needed.
                {isTemp && (
                    <span className="block mt-2 text-yellow-600">
                        Note: This is a temporary visualization. The audio will be available for 1 hour. Sign up to save it permanently!
                    </span>
                )}
            </p>
            <AudioPlayer 
                visualizationId={visualization.id}
                audioUrl={visualization.audio_url}
            />
        </div>
    );
} 