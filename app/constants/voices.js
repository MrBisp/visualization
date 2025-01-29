export const VOICE_MAPPINGS = {
    // OpenAI voice ID -> Our display info
    'onyx': {
        id: 'james',
        label: 'James',
        gender: 'male',
        description: 'Deep and calming male voice with a gentle pace',
        sampleAudio: '/audio/onyx.mp3'
    },
    'shimmer': {
        id: 'emma',
        label: 'Emma',
        gender: 'female',
        description: 'Warm and encouraging female voice with a natural tone',
        sampleAudio: '/audio/shimmer.mp3'
    },
    'coral': {
        id: 'sophia',
        label: 'Sophia',
        gender: 'female',
        description: 'Soft and soothing female voice with a meditative quality',
        sampleAudio: '/audio/coral.mp3'
    },
    'ash': {
        id: 'michael',
        label: 'Michael',
        gender: 'male',
        description: 'Clear and confident male voice with a professional tone',
        sampleAudio: '/audio/ash.mp3'
    }
};

export const getOpenAIVoiceId = (ourVoiceId) => {
    return Object.entries(VOICE_MAPPINGS).find(([_, value]) => value.id === ourVoiceId)?.[0];
};

export const getVoicesList = () => Object.values(VOICE_MAPPINGS); 