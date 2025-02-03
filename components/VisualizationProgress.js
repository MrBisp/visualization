import { Status } from './Status';
import PropTypes from 'prop-types';

export default function VisualizationProgress({ 
    currentSection, 
    progress, 
    isGeneratingAudio, 
    getCurrentMessage,
    SECTION_TYPES,
    visualization 
}) {
    // Don't show progress if audio is ready
    if (visualization?.audio_url) {
        return null;
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 flex-col">
                <div>
                    <h2 className="text-xl font-semibold mb-2 text-center">
                        {currentSection ? (
                            <>
                                {Object.keys(SECTION_TYPES).find(key => 
                                    SECTION_TYPES[key] === currentSection
                                )?.split('_').map(word => 
                                    word.charAt(0) + word.slice(1).toLowerCase()
                                ).join(' ')}
                            </>
                        ) : 'Preparing Your Visualization'}
                    </h2>
                    <p className="text-gray-600">
                        {getCurrentMessage()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {currentSection && (
                        <Status status={progress[currentSection]} />
                    )}
                </div>
            </div>

            <div className="text-sm text-gray-500 text-right">
                {isGeneratingAudio ? (
                    "Generating audio visualization..."
                ) : (
                    `${Object.values(progress).filter(s => s === 'completed').length} of ${Object.keys(SECTION_TYPES).length} sections completed`
                )}
            </div>
        </div>
    );
}

VisualizationProgress.propTypes = {
    currentSection: PropTypes.string,
    progress: PropTypes.object.isRequired,
    isGeneratingAudio: PropTypes.bool.isRequired,
    getCurrentMessage: PropTypes.func.isRequired,
    SECTION_TYPES: PropTypes.object.isRequired,
    visualization: PropTypes.shape({
        audio_url: PropTypes.string
    })
}; 