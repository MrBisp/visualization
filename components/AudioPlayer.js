'use client';

import { useState, useRef, useEffect } from 'react';

const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function AudioPlayer({ visualizationId, audioUrl: initialAudioUrl }) {
    const [audioUrl, setAudioUrl] = useState(initialAudioUrl);
    const [isLoading, setIsLoading] = useState(true);
    const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const audioRef = useRef(null);

    const fetchAudio = async () => {
        try {
            console.log('Starting audio fetch...');
            setIsLoading(true);
            setIsMetadataLoaded(false);
            setError(null);
            const response = await fetch(`/api/visualization/${visualizationId}/audio`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch audio');
            }
            const data = await response.json();
            console.log('Audio URL fetched:', data.audio_url ? 'URL exists' : 'No URL');
            setAudioUrl(data.audio_url);
        } catch (error) {
            console.error('Error fetching audio:', error);
            setError(error.message);
            setIsLoading(false);
        }
    };

    // Single useEffect to handle both fetching and audio setup
    useEffect(() => {
        let mounted = true;
        let audio = null;

        const initAudio = async () => {
            // If we don't have an audio URL and need to fetch it
            if (!audioUrl && visualizationId && !initialAudioUrl) {
                await fetchAudio();
                return;
            }

            // If we have an audio URL, set up the audio element
            if (audioUrl && mounted) {
                console.log('Setting up audio element...');
                audio = new Audio();
                audio.preload = 'metadata';
                audioRef.current = audio;

                const handleTimeUpdate = () => {
                    if (!mounted) return;
                    setCurrentTime(audio.currentTime);
                    if (!isNaN(audio.duration)) {
                        setProgress((audio.currentTime / audio.duration) * 100);
                    }
                };

                const handleMetadataLoaded = () => {
                    if (!mounted) return;
                    console.log('Metadata loaded:', {
                        duration: audio.duration,
                        isValid: !isNaN(audio.duration)
                    });
                    
                    if (!isNaN(audio.duration) && audio.duration !== Infinity) {
                        setDuration(audio.duration);
                        setIsMetadataLoaded(true);
                        setIsLoading(false);
                        console.log('Audio ready to play');
                    } else {
                        console.log('Invalid duration after metadata load');
                        setError('Invalid audio duration');
                        setIsLoading(false);
                    }
                };

                const handleLoadStart = () => {
                    if (!mounted) return;
                    console.log('Audio loading started');
                    setIsMetadataLoaded(false);
                    setIsLoading(true);
                };

                const handleError = (e) => {
                    if (!mounted) return;
                    console.error('Audio element error:', e.target.error);
                    setError('Failed to load audio file');
                    setIsLoading(false);
                    setIsMetadataLoaded(false);
                };

                const handleEnded = () => {
                    if (!mounted) return;
                    setIsPlaying(false);
                    setCurrentTime(0);
                    setProgress(0);
                };

                // Add event listeners before setting src
                audio.addEventListener('loadstart', handleLoadStart);
                audio.addEventListener('timeupdate', handleTimeUpdate);
                audio.addEventListener('loadedmetadata', handleMetadataLoaded);
                audio.addEventListener('error', handleError);
                audio.addEventListener('ended', handleEnded);

                // Set the source after adding event listeners
                audio.src = audioUrl;
            }
        };

        initAudio();

        // Cleanup function
        return () => {
            mounted = false;
            if (audio) {
                audio.removeEventListener('loadstart', handleLoadStart);
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                audio.removeEventListener('loadedmetadata', handleMetadataLoaded);
                audio.removeEventListener('error', handleError);
                audio.removeEventListener('ended', handleEnded);
                audio.src = '';
                audioRef.current = null;
            }
        };
    }, [audioUrl, visualizationId, initialAudioUrl]);

    const togglePlay = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleSeek = (e) => {
        const time = e.target.value;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const handlePlaybackRateChange = (e) => {
        if (!audioRef.current) return;
        
        const newRate = parseFloat(e.target.value);
        audioRef.current.playbackRate = newRate;
        setPlaybackRate(newRate);
    };

    const handleProgressClick = (e) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - bounds.left;
        const width = bounds.width;
        const percentage = x / width;
        const time = percentage * audioRef.current.duration;
        audioRef.current.currentTime = time;
        setProgress(percentage * 100);
        setCurrentTime(time);
    };

    const skip = (seconds) => {
        if (!audioRef.current) return;
        
        const newTime = Math.min(Math.max(currentTime + seconds, 0), duration);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    if (isLoading || !isMetadataLoaded || !duration || isNaN(duration)) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="loading loading-spinner loading-md"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-error mb-4">
                    {error}
                </div>
                <button 
                    onClick={() => {
                        setError(null);
                        setIsLoading(true);
                        setIsMetadataLoaded(false);
                        if (visualizationId && !initialAudioUrl) {
                            fetchAudio();
                        } else if (audioUrl) {
                            // Recreate audio element with same URL
                            const audio = new Audio(audioUrl);
                            audioRef.current = audio;
                        }
                    }}
                    className="btn btn-sm btn-outline btn-error"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!audioUrl) {
        return null;
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-4 mb-4 justify-center">
                <button
                    onClick={() => skip(-10)}
                    className="btn btn-circle btn-sm"
                    aria-label="Skip backward 10 seconds"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 110 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 100-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.061.025z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">10</span>
                </button>

                <button
                    onClick={togglePlay}
                    className="btn btn-circle btn-primary"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={() => skip(10)}
                    className="btn btn-circle btn-sm"
                    aria-label="Skip forward 10 seconds"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.207 2.232a.75.75 0 00.025 1.06L16.378 7.25H6.375a5.375 5.375 0 100 10.75h2.875a.75.75 0 010 1.5H6.375a6.875 6.875 0 010-13.75h10.003l-4.146-3.957a.75.75 0 011.036-1.085l5.5 5.25a.75.75 0 010 1.085l-5.5 5.25a.75.75 0 01-1.061-.025z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">10</span>
                </button>
            </div>

            <div className="w-full">
                <div 
                    className="w-full h-2 bg-gray-200 rounded-full cursor-pointer relative"
                    onClick={handleProgressClick}
                >
                    <div 
                        className="h-full bg-primary rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <div className="flex justify-end mt-2">
                <select
                    value={playbackRate}
                    onChange={handlePlaybackRateChange}
                    className="select select-sm select-bordered"
                >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                </select>
            </div>
        </div>
    );
} 