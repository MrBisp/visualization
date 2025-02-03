import { useEffect, useState } from "react";

let globalEmojiCount = 0;

const EmojiRain = ({ emoji, onComplete }) => {
    const [emojis, setEmojis] = useState([]);

    useEffect(() => {
        globalEmojiCount += 1;

        const emojiCount = 20 * globalEmojiCount;
        const newEmojis = Array.from({ length: emojiCount }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * (emojiCount / 40), // Random delay
            rotation: Math.random() * 360,
        }));

        console.log("Generating", emojiCount, "emojis");

        setEmojis(newEmojis);

        const animationTime = 2500; // Base animation time in ms
        const maxDelay = (emojiCount / 40) * 1000; // Max delay in ms
        const totalAnimationTime = animationTime + maxDelay;

        const timer = setTimeout(() => {
            console.log("Clearing emojis after totalAnimationTime");
            if (onComplete) {
                requestAnimationFrame(() => {
                    setEmojis([]);
                    onComplete();
                });
            }
        }, totalAnimationTime);

        return () => {
            clearTimeout(timer);
        };
    }, [emoji, onComplete]);

    if (emojis.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] emoji-rain-container">
            {emojis.map((particle) => (
                <div
                    key={`${particle.id}-${Date.now()}`} // Unique key per render
                    className="absolute animate-emoji-fall"
                    style={{
                        left: `${particle.left}%`,
                        animationDelay: `${particle.delay}s`,
                        '--animation-delay': `${particle.delay}s`,
                        transform: `rotate(${particle.rotation}deg)`,
                        fontSize: '1.5rem',
                    }}
                >
                    {emoji}
                </div>
            ))}
        </div >
    );
};

EmojiRain.displayName = "EmojiRain";

export default EmojiRain;
