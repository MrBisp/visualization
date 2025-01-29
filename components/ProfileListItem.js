import Link from 'next/link';
import ProfileImage from '@/components/ProfileImage';

const ProfileListItem = ({ user }) => {
    return (
        <Link href={`/dashboard/profile/${user.id}`} className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg">
            <ProfileImage
                user={user}
                size="md"
            />
            <div>
                <p className="font-medium">{user.name}</p>
            </div>
        </Link>
    );
};

export default ProfileListItem;