import Image from "next/image";

const ProfileImage = ({ user, size = 40 }) => {
    if (!user) return null;

    return (
        <div className="avatar">
            <div className={`w-${size} rounded-full ring ring-primary ring-offset-base-100 ring-offset-2`}>
                <Image
                    src={user.image || '/images/default-avatar.png'}
                    alt={user.name || 'User'}
                    width={size}
                    height={size}
                    className="rounded-full"
                />
            </div>
        </div>
    );
};

export default ProfileImage;