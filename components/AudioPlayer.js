'use client';

import { useState, useRef, useEffect } from 'react';

const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AudioPlayer = ({ audioUrl }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            if (audio.duration && !isNaN(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            audio.currentTime = 0;
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        // Set initial duration if already loaded
        if (audio.duration && !isNaN(audio.duration)) {
            setDuration(audio.duration);
        }

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        if (!audioRef.current) return;
        
        const newTime = parseFloat(e.target.value);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
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

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-4">
            <audio 
                ref={audioRef}
                src={audioUrl}
                preload="metadata"
            />
            
            <div className="flex items-center justify-between mb-4 space-x-2">
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
                        <path fillRule="evenodd" d="M12.207 2.232a.75.75 0 00.025 1.06L16.378 7.25H6.375a5.375 5.375 0 100 10.75h2.875a.75.75 0 010-1.5H6.375a3.875 3.875 0 110-7.75h10.003l-4.146 3.957a.75.75 0 001.036 1.085l5.5-5.25a.75.75 0 000-1.085l-5.5-5.25a.75.75 0 00-1.061.025z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">10</span>
                </button>

                <button
                    onClick={handlePlaybackRateChange}
                    className="btn btn-sm"
                    aria-label="Change playback speed"
                >
                    {playbackRate}x
                </button>
            </div>

            <div className="mb-2">
                <div 
                    className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
                    onClick={handleProgressClick}
                >
                    <div 
                        className="h-full bg-primary rounded-full transition-all duration-150"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="flex justify-between text-sm text-gray-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
};

export default AudioPlayer; 