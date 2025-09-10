import React from 'react';
import './Auth.css';
interface LoginProps {
    onLogin?: (user: any) => void;
    onError?: (error: string) => void;
}
declare const Login: React.FC<LoginProps>;
export default Login;
