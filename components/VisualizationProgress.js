import { Status } from './Status';

export default function VisualizationProgress({ 
    currentSection, 
    progress, 
    isGeneratingAudio, 
    getCurrentMessage,
    SECTION_TYPES 
}) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold mb-2">
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