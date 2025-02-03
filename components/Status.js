import React from 'react';
import AnimatedCircles from './AnimatedCircles';

export function Status({ currentStatus }) {
    return (
        <div className="flex items-center gap-2">
            <AnimatedCircles />
            <span className="text-sm text-gray-600">{currentStatus}</span>
        </div>
    );
} 