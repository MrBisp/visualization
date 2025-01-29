import Image from "next/image";
import { useSession } from "next-auth/react";

export default function ProfileImage({ user, size = 'md', customStyle = {} }) {
    // Debug logging
    const debugInfo = {
        userProvided: !!user,
        userData: {
            name: user?.name,
            image: user?.image,
            hasValidImage: !!user?.image,
            imageType: user?.image?.startsWith('data:image') ? 'base64' : 'url'
        }
    };
    //console.debug('ProfileImage render:', debugInfo);

    // Handle different size classes
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-24 h-24'
    };

    const sizePixels = {
        sm: 32,
        md: 48,
        lg: 96
    };

    // Helper function to check if string is a base64 image
    const isBase64Image = (str) => {
        try {
            const isBase64 = str?.startsWith('data:image');
            //console.debug('isBase64Image check:', { str: str?.substring(0, 50) + '...', isBase64 });
            return isBase64;
        } catch (error) {
            //console.error('Error checking base64 image:', error);
            return false;
        }
    };

    // If no user or no image/name, show default avatar
    if (!user || (!user.image && !user.name)) {
        console.debug('Rendering default avatar - no user data:', { user });
        return (
            <div className={`${sizeClasses[size]} bg-gray-100 rounded-full flex items-center justify-center`}>
                <span className="text-gray-600 text-lg">?</span>
            </div>
        );
    }

    // If user has an image, show it
    if (user.image) {

        try {
            return (
                <div className={sizeClasses[size]}>
                    <Image
                        src={user.image}
                        alt={user.name || 'Profile picture'}
                        width={sizePixels[size]}
                        height={sizePixels[size]}
                        className={`${sizeClasses[size]} rounded-full object-cover`}
                        unoptimized={isBase64Image(user.image)}
                        style={customStyle}
                        onError={(e) => {
                            console.error('Image load error:', {
                                src: user.image?.substring(0, 50) + '...',
                                error: e
                            });
                            // Fallback to initials on error
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                                <div class="${sizeClasses[size]} bg-gray-100 rounded-full flex items-center justify-center">
                                    <span class="text-gray-600 text-lg">
                                        ${user.name?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                </div>
                            `;
                        }}
                    />
                </div>
            );
        } catch (error) {
            console.error('Error rendering image component:', error);
            // Fallback to initials on error
            return (
                <div className={`${sizeClasses[size]} bg-gray-100 rounded-full flex items-center justify-center`}>
                    <span className="text-gray-600 text-lg">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                </div>
            );
        }
    }

    // If no image but has name, show initials
    console.debug('Rendering initials:', { name: user.name });
    return (
        <div className={`${sizeClasses[size]} bg-gray-100 rounded-full flex items-center justify-center`}>
            <span className="text-gray-600 text-lg">
                {user.name?.charAt(0)?.toUpperCase()}
            </span>
        </div>
    );
}