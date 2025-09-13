import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { User } from '../types/types';

interface Props {
  user: User | null;
  allowed: Array<'user' | 'admin'>;
  children: React.ReactNode;
}

export function RequireRole({ user, allowed, children }: Props) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowed.includes(user.role)) {
    return <div>⛔ Access denied</div>;
  }

  return <>{children}</>;
}
