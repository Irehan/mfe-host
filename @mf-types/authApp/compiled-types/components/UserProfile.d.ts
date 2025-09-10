import React from 'react';
import './Auth.css';
interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
}
interface UserProfileProps {
    user?: User | null;
    onLogout?: () => void;
    onEditProfile?: () => void;
}
declare const UserProfile: React.FC<UserProfileProps>;
export default UserProfile;
