'use client'
import { useState, useEffect } from 'react';
import { getVoicesList, getOpenAIVoiceId } from '../constants/voices';
import { useRouter } from 'next/navigation';
import { initializeVisualization, generateSection, SECTION_TYPES } from '../services/visualizationService';
import { updateVisualizationStatus } from '../services/visualizationService';
import { useSession } from 'next-auth/react';

const GettingStarted = () => {
    const router = useRouter();
    const [visualizationText, setVisualizationText] = useState('');
    const [step, setStep] = useState(1);
    const [selectedVoice, setSelectedVoice] = useState('emma');
    const [generationStep, setGenerationStep] = useState(0);
    const [generationId, setGenerationId] = useState(null);
    const [environmentText, setEnvironmentText] = useState('');
    const { data: session, update: updateSession } = useSession();

    const preSelects = [
        {
            title: "Job Interview",
            description: "I want to visualize myself feeling calm, confident, and articulate during my job interview.\n" +
                         "I am dressed professionally in a well-fitted suit, feeling composed and prepared.\n" +
                         "I will be speaking with the HR manager and a senior team member.\n" +
                         "We will be discussing my qualifications for the role of {FILL IN ROLE}.\n" +
                         "I know I might feel nervous, so I want to visualize myself responding smoothly, making strong eye contact, and feeling completely in control."
        },
        {
            title: "Exam",
            description: "I want to visualize myself feeling calm, focused, and confident during my exam.\n" +
                         "I am sitting upright, taking deep breaths, and feeling fully prepared.\n" +
                         "The questions come easily to me, and I recall information effortlessly.\n" +
                         "I know I might feel anxious, so I want to visualize myself staying relaxed, writing smoothly, and managing my time well."
        },
        {
            title: "Public Speaking",
            description: "I want to visualize myself feeling calm, charismatic, and engaging during my public speaking event.\n" +
                         "I am wearing a stylish, professional outfit that makes me feel confident.\n" +
                         "The audience is engaged, nodding along as I speak clearly and passionately.\n" +
                         "I know I might feel nervous, so I want to visualize myself speaking naturally, making eye contact, and feeling fully in my element."
        },
        {
            title: "Athletic Performance",
            description: "I want to visualize myself feeling strong, composed, and in peak condition during my athletic performance.\n" +
                         "I am dressed in my competition gear, standing tall with a focused expression.\n" +
                         "I move with precision and power, my body responding effortlessly.\n" +
                         "I know I might feel pressure, so I want to visualize myself staying confident, executing my performance flawlessly, and feeling the thrill of success."
        },
        {
            title: "Presentation",
            description: "I want to visualize myself feeling calm, persuasive, and well-prepared during my presentation.\n" +
                         "I am dressed in business casual, with a confident posture and a composed smile.\n" +
                         "The audience listens intently, nodding as I make my key points.\n" +
                         "I know I might feel pressure, so I want to visualize myself delivering my message smoothly, responding to questions with ease, and receiving positive feedback."
        },
        {
            title: "Social Situation",
            description: "I want to visualize myself feeling at ease, charismatic, and confident in a social gathering.\n" +
                         "I am dressed in a smart-casual outfit, holding a drink, making effortless small talk.\n" +
                         "People are interested in what I have to say, and I enjoy connecting with new people.\n" +
                         "I know I might feel shy or anxious, so I want to visualize myself feeling comfortable, smiling naturally, and making engaging conversation."
        },
        {
            title: "Meeting",
            description: "I want to visualize myself feeling confident, respected, and articulate during an important meeting.\n" +
                         "I am dressed in business attire, sitting upright, speaking clearly and persuasively.\n" +
                         "I contribute valuable insights, listen actively, and engage in a productive discussion.\n" +
                         "I know I might feel uncertain, so I want to visualize myself being assertive, handling questions smoothly, and leaving a strong impression."
        }
    ];
    

    const handlePreSelectClick = (description) => {
        setVisualizationText(description);
    };

    const handleEnvironmentSelect = (description) => {
        setEnvironmentText(description);
    };

    const voices = getVoicesList();

    const [isPlaying, setIsPlaying] = useState(null);
    const audioRef = useState(null);

    const playAudioSample = (sampleAudio, voiceId) => {
        if (isPlaying === voiceId) {
            audioRef.current?.pause();
            audioRef.current = null;
            setIsPlaying(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            const audio = new Audio(sampleAudio);
            audio.onended = () => {
                setIsPlaying(null);
                audioRef.current = null;
            };
            audio.play();
            audioRef.current = audio;
            setIsPlaying(voiceId);
        }
    };

    // Modify the useEffect for loading from localStorage
    useEffect(() => {
        const savedData = localStorage.getItem('current_visualization');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                setVisualizationText(data.text || '');
                setSelectedVoice(data.voice || 'emma');
            } catch (error) {
                console.error('Error parsing saved data:', error);
            }
        }
    }, []); // Only run once on mount

    const handleGeneration = async () => {
        try {
            setGenerationStep(1);
            
            // Initialize visualization in DB
            const visualization = await initializeVisualization({ 
                text: visualizationText,
                voiceId: getOpenAIVoiceId(selectedVoice)
            });

            console.log('Visualization created:', visualization.id);
            
            // Update session to ensure we have the latest data
            await updateSession();
            
            // Wait a moment for the session to update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get the latest session data
            const currentSession = await fetch('/api/auth/session').then(res => res.json());
            console.log('Current session after update:', currentSession);
            console.log('User ID in session:', currentSession?.user?.id);

            // Save to localStorage before redirect
            localStorage.setItem('current_visualization', JSON.stringify({
                id: visualization.id,
                text: visualizationText,
                voice: selectedVoice,
                created_at: new Date().toISOString()
            }));

            // If user is logged in, associate the visualization with their account
            if (currentSession?.user?.id) {
                console.log('Attempting to associate visualization with user ID:', currentSession.user.id);
                try {
                    const response = await fetch('/api/visualization/associate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            visualizationId: visualization.id
                        })
                    });

                    const responseData = await response.json();
                    console.log('Association response:', responseData);

                    if (!response.ok) {
                        console.error('Association failed with status:', response.status);
                        console.error('Error details:', responseData);
                    } else {
                        console.log('Successfully associated visualization');
                    }
                } catch (error) {
                    console.error('Failed to associate visualization:', error);
                    // Continue with redirect even if association fails
                }
            } else {
                console.log('No user ID in session, skipping association. Session:', currentSession);
            }
            
            // Redirect to generation page
            router.push(`/generation/${visualization.id}`);
            
        } catch (error) {
            console.error('Failed to initialize visualization:', error);
            setGenerationStep(0);
        }
    };

    const renderGenerationButton = () => {
        switch (true) {
            case generationStep === 1:
                return (
                    <button className="btn btn-primary btn-wide" disabled>
                        <span className="loading loading-spinner"></span>
                        Initializing Visualization...
                    </button>
                );
            case generationStep > 1 && generationStep < 3:
                return (
                    <button className="btn btn-primary btn-wide" disabled>
                        <span className="loading loading-spinner"></span>
                        Generating Section {generationStep - 1} of {Object.keys(SECTION_TYPES).length}
                    </button>
                );
            default:
                return (
                    <button 
                        className="btn btn-primary btn-wide"
                        onClick={handleGeneration}
                    >
                        Generate Visualization
                    </button>
                );
        }
    };

    const renderStep1 = () => (
        <>
            <div className="flex items-center gap-2 self-start mb-2">
                <span className="badge badge-primary py-4 px-4">Step 1/3</span>
                <span className="text-lg">Describe Your Visualization</span>
            </div>

            <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight mb-2">
                What Do You Want to Visualize?
            </h1>
            <p className="text-lg mb-4">
                Research shows that the more details you include in your visualization, the more effective it is.
            </p>
            
            <div className="w-full max-w-2xl">
                <textarea 
                    className="textarea textarea-bordered w-full"
                    placeholder="Describe what you want to visualize..."
                    value={visualizationText}
                    onChange={(e) => setVisualizationText(e.target.value)}
                    style={{ fontSize: '1.1rem', minHeight: '20rem' }}
                />
            </div>

            <div className="text-center">
                <p className="text-lg mb-4">
                    Or choose from our suggestions:
                </p>
                <div className="flex flex-col gap-4">
                    {preSelects.map((preSelect) => (
                        <button 
                            className="btn btn-outline btn-wide mb-0" 
                            key={preSelect.title}
                            onClick={() => handlePreSelectClick(preSelect.description)}
                        >
                            {preSelect.title}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-24" />
        </>
    );

    const renderStep2 = () => (
        <>
            <div className="flex items-center gap-2 self-start mb-2">
                <span className="badge badge-primary py-4 px-4">Step 2/3</span>
                <span className="text-lg">Describe Your Environment</span>
            </div>

            <button 
                className="btn btn-ghost btn-sm self-start mb-2"
                onClick={() => setStep(1)}
            >
                ← Back
            </button>

            <h2 className="font-bold text-3xl mb-4">Where Will You Practice This Visualization?</h2>
            <p className="text-lg mb-4 max-w-2xl">
                The environment where you practice your visualization can greatly impact its effectiveness. 
                Describe where you'll be when listening to this visualization.
            </p>
            
            <div className="w-full max-w-2xl mb-8">
                <textarea 
                    className="textarea textarea-bordered w-full"
                    placeholder="Describe your environment..."
                    value={environmentText}
                    onChange={(e) => setEnvironmentText(e.target.value)}
                    style={{ fontSize: '1.1rem', minHeight: '10rem' }}
                />
            </div>

            <div className="h-24" />
        </>
    );

    const renderStep3 = () => (
        <>
            <div className="flex items-center gap-2 self-start mb-2">
                <span className="badge badge-primary py-4 px-4">Step 3/3</span>
                <span className="text-lg">Choose Voice & Generate</span>
            </div>

            <button 
                className="btn btn-ghost btn-sm self-start mb-2"
                onClick={() => setStep(2)}
            >
                ← Back
            </button>

            <h2 className="font-bold text-3xl mb-4">Choose Your Preferred Voice</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 w-full max-w-2xl">
                {voices.map((voice) => (
                    <div
                        key={voice.id}
                        className={`border rounded-lg p-4 cursor-pointer hover:border-secondary transition-colors ${
                            selectedVoice === voice.id ? 'border-secondary bg-secondary/5' : 'border-base-300'
                        }`}
                        onClick={() => setSelectedVoice(voice.id)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{voice.label}</h3>
                            <button
                                className="btn btn-sm btn-circle"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    playAudioSample(voice.sampleAudio, voice.id);
                                }}
                            >
                                {isPlaying === voice.id ? '⏹' : '▶'}
                            </button>
                        </div>
                        <p className="text-sm text-base-content/80">{voice.description}</p>
                    </div>
                ))}
            </div>

            <div className="w-full max-w-2xl">
                <label className="label">
                    <span className="label-text text-lg font-semibold">Your Visualization:</span>
                </label>
                <textarea 
                    className="textarea textarea-bordered w-full"
                    value={visualizationText}
                    onChange={(e) => setVisualizationText(e.target.value)}
                    style={{ fontSize: '1.1rem', minHeight: '20rem' }}
                />
            </div>

            <div className="h-24" />
        </>
    );

    const renderBottomSection = () => (
        <div className="fixed bottom-0 left-0 right-0 border-t" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                <div className="flex-1 flex justify-end">
                    {step === 1 ? (
                        <button 
                            className="btn btn-primary btn-wide"
                            onClick={() => setStep(2)}
                            disabled={!visualizationText.trim()}
                        >
                            Next
                        </button>
                    ) : step === 2 ? (
                        <button 
                            className="btn btn-primary btn-wide"
                            onClick={() => {
                                // Only append environment text if it's not empty
                                if (environmentText.trim()) {
                                    setVisualizationText(visualizationText + "\n\nEnvironment for practice:\n" + environmentText);
                                }
                                setStep(3);
                            }}
                        >
                            Next
                        </button>
                    ) : (
                        renderGenerationButton()
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="max-w-7xl mx-auto bg-base-100 flex flex-col lg:flex-col items-center justify-center gap-4 lg:gap-6 px-8 pt-1 pb-8 lg:py-12">   
                {step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}
            </div>
            {renderBottomSection()}
        </>
    );
};

export default GettingStarted;
