import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthReady } = useAppStore();
  const location = useLocation();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#1DB954] animate-spin" />
      </div>
    );
  }

  // Allow access as long as auth is ready. 
  // Layout.tsx ensures we have at least an anonymous user.
  return <>{children}</>;
}
