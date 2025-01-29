import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";

export function useReviews() {
    const { data: session } = useSession();
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch('/api/reviews/feed');
                if (!response.ok) throw new Error('Failed to fetch reviews');
                const data = await response.json();
                //console.log("ReviewsData:", data);

                //Before setting the reviews, let's convert the coordinates to an array coordinates
                const coordinatesString = data.map(review => review.coordinates);
                //console.log("CoordinatesString:", coordinatesString);

                const coordinatesWithoutParentheses = coordinatesString.map(coord => coord.replace('(', '').replace(')', ''));
                //console.log("CoordinatesWithoutParentheses:", coordinatesWithoutParentheses);

                const coordinatesArray = coordinatesWithoutParentheses.map(coord => coord.split(',').map(Number));
                //console.log("CoordinatesArray:", coordinatesArray);

                //Now let's add the coordinates to the reviews
                const reviewsWithCoordinates = data.map((review, index) => ({
                    ...review,
                    coordinates: coordinatesArray[index]
                }));
                //console.log("ReviewsWithCoordinates:", reviewsWithCoordinates);

                //Turns out that they should be in the format [latitude, longitude]
                const reviewsWithCorrectCoordinates = reviewsWithCoordinates.map(review => ({
                    ...review,
                    coordinates: [review.coordinates[1], review.coordinates[0]]
                }));

                setReviews(reviewsWithCorrectCoordinates);
            } catch (error) {
                console.error('Error fetching reviews:', error);
                setReviews([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, []);

    return { reviews, isLoading };
}