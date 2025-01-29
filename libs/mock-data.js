// libs/mock-data.js

const generateRandomEmoji = () => {
    const emojis = ['😠', '🤯', '😃', '🤑', '🤠', '😍', '🤩', '🤗', '👍', '👎'];
    return emojis[Math.floor(Math.random() * emojis.length)];
};

const generateRandomPosition = () => {
    const center = [55.6761, 12.5683]; // Copenhagen coordinates
    const radius = 0.03;
    return [
        center[0] + (Math.random() - 0.5) * 2 * radius,
        center[1] + (Math.random() - 0.5) * 2 * radius,
    ];
};

const generateRandomType = () => {
    const types = ['restaurant', 'bar', 'cafe', 'pub', 'food truck'];
    return types[Math.floor(Math.random() * types.length)];
};

const generateRandomProfileImage = () => {
    const images = ['/pb/cornelie.jpg', '/pb/frederik.jpg', '/pb/niels.jpg', '/pb/tejs.jpg', '/pb/magnus.jpg'];
    return images[Math.floor(Math.random() * images.length)];
};

const generateRandomUser = (index) => ({
    id: index,
    name: `User ${index + 1}`,
    image: generateRandomProfileImage(),
});

const generateRandomRestaurants = (count) => {
    return Array.from({ length: count }, (_, index) => ({
        id: index,
        name: `Restaurant ${index + 1}`,
        coordinates: generateRandomPosition(),
        primary_emoji: generateRandomEmoji(),
        location_type: generateRandomType(),
        review_text: 'This is a sample review text.',
        user: generateRandomUser(index),
    }));
};

const randomRestaurants = generateRandomRestaurants(200);

export { randomRestaurants };
