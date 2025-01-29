'use client';

import React, { memo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCallback } from 'react';

const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div>Loading map...</div>
});

const MapInput = memo(({ onLocationSelect, userImage = '/default-avatar.png', emoji = '😋' }) => {
    const mapRef = useRef(null);

    const handleMapMove = useCallback(() => {
        if (mapRef.current) {
            const center = mapRef.current.getCenter();
            onLocationSelect({
                lat: center.lat,
                lng: center.lng
            });
        }
    }, [onLocationSelect]);

    const handleMapCreated = useCallback((map) => {
        mapRef.current = map;
        // Initial center position
        const center = map.getCenter();
        onLocationSelect([center.lat, center.lng]);
    }, [onLocationSelect]);

    // Add console.log to debug
    //console.log("MapInput coordinates being sent:",
    //mapRef.current ? mapRef.current.getCenter() : 'No map ref');

    return (
        <div className="h-[300px] rounded-lg overflow-hidden border border-gray-300 relative">
            <Map
                whenCreated={handleMapCreated}
                onMoveEnd={handleMapMove}
                defaultZoom={19}
            />
            {/* Center Marker */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: 1000 }}>
                <div className="marker-container">
                    <div className="profile-image" style={{ backgroundImage: `url('${userImage}')` }}></div>
                    <div className="emoji-overlay">{emoji}</div>
                </div>
            </div>
        </div>
    );
});

MapInput.displayName = 'MapInput';

export default MapInput;