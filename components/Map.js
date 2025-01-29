"use client";

import React, { memo, useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from 'next/dynamic';
import { useReviews } from "@/hooks/useReviews";
import { useSession } from "next-auth/react";
import ProfileImage from '@/components/ProfileImage';
import ReactDOMServer from 'react-dom/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ProfileListItem from "./ProfileListItem";
import Link from "next/link";
import EmojiRain from './EmojiRain';
import { randomRestaurants } from "@/libs/mock-data";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';

// Utility functions moved outside the component
const isValidLatLng = (position) => {
    if (!position || position.length !== 2) return false;
    const [lat, lng] = position.map(Number);
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
    );
};

const getInitialPosition = () => {
    if (typeof window !== 'undefined') {
        const savedPosition = sessionStorage.getItem('userPosition');
        if (savedPosition) {
            const parsed = JSON.parse(savedPosition);
            if (isValidLatLng(parsed)) {
                return parsed;
            }
        }
    }
    // Default to Copenhagen coordinates
    return [55.6761, 12.5683];
};

const createCustomIcon = (emoji = '📍', user = null) => {
    if (typeof window === 'undefined') return null;
    try {
        const markerHtml = `
      <div class="marker-container">
        <div class="profile-image">
          ${user ? `<div class="w-full h-full">${ReactDOMServer.renderToString(<ProfileImage user={user} size="sm" />)}</div>` : ''}
        </div>
        <div class="emoji-overlay">${emoji || '📍'}</div>
      </div>
    `;
        return new L.DivIcon({
            html: markerHtml,
            iconSize: new L.Point(40, 40),
            className: 'custom-marker-wrapper',
        });
    } catch (error) {
        console.error('Error creating custom icon:', error);
        return null;
    }
};

const createCurrentPositionIcon = (() => {
    if (typeof window === 'undefined') return null;
    return new L.DivIcon({
        html: `
      <div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg relative">
        <div class="absolute inset-0 bg-blue-500 rounded-full opacity-50 animate-ping"></div>
      </div>
    `,
        iconSize: new L.Point(24, 24),
        className: 'location-marker',
    });
})();

// Memoized ReviewPopup component
const ReviewPopup = React.memo(({ review, status, handleEmojiClick }) => {
    if (status !== 'authenticated') {
        return <div>{review.name}</div>;
    }
    return (
        <div className="p-0 min-w-[200px] bg-white">
            <div className="flex items-center space-x-4 mb-2">
                <ProfileListItem user={review.user} size="sm" />
                <div>
                    <h3 className="text-lg font-semibold">{review.name}</h3>
                    <p className="text-gray-600 text-sm">{review.location_type}</p>
                </div>
            </div>
            <span
                className="text-xl emoji-clickable cursor-pointer"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEmojiClick(review.primary_emoji);
                }}
            >
                {review.primary_emoji}
            </span>
            <p className="text-sm text-gray-800 mt-0">{review.review_text}</p>
            <Link href={`/dashboard/profile/reviews/${review.id}`} className="text-blue-600 hover:text-blue-700 mt-1 inline-block">View Review</Link>
        </div>
    );
});
ReviewPopup.displayName = 'ReviewPopup';

// Memoized ReviewMarker component
const ReviewMarker = React.memo(({ review, status, handleEmojiClick }) => {
    const icon = useMemo(
        () => createCustomIcon(review.primary_emoji || review.emoji, review.user),
        [review.primary_emoji, review.emoji, review.user]
    );

    if (!isValidLatLng(review.coordinates)) {
        console.warn('Invalid coordinates for review:', { review });
        return null;
    }

    return (
        <Marker position={review.coordinates} icon={icon}>
            <Popup>
                <div className="animated-popup">
                    <ReviewPopup review={review} status={status} handleEmojiClick={handleEmojiClick} />
                </div>
            </Popup>
        </Marker>
    );
});
ReviewMarker.displayName = 'ReviewMarker';

const MapEvents = ({ whenCreated, onMoveEnd, useRandom, defaultZoom, positionRef }) => {
    const map = useMap();
    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (whenCreated) {
            whenCreated(map);
        }
    }, [map, whenCreated]);

    useEffect(() => {
        // Only run geolocation once when the map is first mounted
        if (!isInitializedRef.current && "geolocation" in navigator) {
            isInitializedRef.current = true;

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newPosition = [position.coords.latitude, position.coords.longitude];
                    if (isValidLatLng(newPosition)) {
                        positionRef.current = newPosition;
                        sessionStorage.setItem('userPosition', JSON.stringify(newPosition));
                        // Add safety check before setting view
                        if (map && map.setView && map._loaded) {
                            map.setView(newPosition, defaultZoom);
                        }
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                }
            );
        }
    }, [map, defaultZoom, positionRef]);

    useEffect(() => {
        const handleResize = () => {
            map.invalidateSize();
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [map]);

    useMapEvents({
        moveend: () => {
            if (onMoveEnd) {
                onMoveEnd();
            }
        },
    });

    return null;
};

const Map = memo(({ onLocationSelect = null, onMoveEnd = null, showCenterMarker = false, whenCreated = null, defaultZoom = 15, useRandom = false }) => {
    const positionRef = useRef(getInitialPosition());
    const { data: session, status } = useSession();
    const { reviews: friendReviews, isLoading } = useReviews();

    const [activeEmoji, setActiveEmoji] = useState(null);

    const reviews = useMemo(() => {
        if (useRandom || status !== 'authenticated') {
            return randomRestaurants;
        }
        return friendReviews;
    }, [status, friendReviews, useRandom]);

    const showLoading = status === 'authenticated' && isLoading;

    const handleEmojiClick = useCallback((emoji) => {
        setActiveEmoji(emoji);
    }, []);

    if (typeof window === 'undefined') {
        return <div>Loading map...</div>;
    }

    return (
        <div className="h-full w-full relative">
            {showLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1000]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            )}
            <MapContainer
                center={positionRef.current}
                zoom={defaultZoom}
                style={{ height: "100%", width: "100%" }}
                whenCreated={whenCreated}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {reviews.map((review) => (
                    <ReviewMarker
                        key={review.id}
                        review={review}
                        status={status}
                        handleEmojiClick={handleEmojiClick}
                    />
                ))}

                {status === 'authenticated' && !showCenterMarker && isValidLatLng(positionRef.current) && (
                    <Marker position={positionRef.current} icon={createCurrentPositionIcon}>
                        <Popup>You are here</Popup>
                    </Marker>
                )}

                <MapEvents
                    whenCreated={whenCreated}
                    onMoveEnd={onMoveEnd}
                    useRandom={useRandom}
                    defaultZoom={defaultZoom}
                    positionRef={positionRef}
                />
            </MapContainer>
            {activeEmoji && (
                <EmojiRain emoji={activeEmoji} onComplete={() => {
                    console.log('Emoji rain completed');
                    setActiveEmoji(null);
                }} />
            )}
        </div>
    );
});

Map.displayName = 'Map';

export default Map;
