import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard = ({ children, requireAuth = true }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Save the attempted location
        navigate('/auth', { 
          state: { from: location.pathname },
          replace: true 
        });
      } else if (!requireAuth && user && location.pathname === '/auth') {
        // If user is logged in and trying to access auth page, redirect to dashboard
        const from = location.state?.from || '/';
        navigate(from, { replace: true });
      }
    }
  }, [user, loading, navigate, location, requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect to auth page
  }

  if (!requireAuth && user && location.pathname === '/auth') {
    return null; // Will redirect to dashboard
  }

  return <>{children}</>;
};