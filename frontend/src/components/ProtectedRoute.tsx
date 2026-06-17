import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useStore } from "../store/useStore";
import { getCurrentSession, getCurrentUserEmail } from "../utils/cognito";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, user, setToken, setUser } = useStore();
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      // In development mode, allow access without authentication
      if (import.meta.env.DEV) {
        setChecking(false);
        return;
      }

      // In production, check for valid session
      if (!token) {
        try {
          const session = await getCurrentSession();
          if (session) {
            setToken(session.idToken);
            // Get actual user email from Cognito
            const email = await getCurrentUserEmail();
            if (email) {
              setUser({
                id: email,
                email: email,
                plan: "explorer",
              });
            }
          }
        } catch (error) {
          console.error("Error checking session:", error);
        }
      } else if (!user) {
        // If we have a token but no user (e.g., after refresh), restore user info
        try {
          const email = await getCurrentUserEmail();
          if (email) {
            setUser({
              id: email,
              email: email,
              plan: "explorer",
            });
          }
        } catch (error) {
          console.error("Error getting user info:", error);
        }
      }
      setChecking(false);
    }

    checkAuth();
  }, [token, user, setToken, setUser]);

  // Show loading while checking authentication
  if (checking) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "var(--bg)" }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    );
  }

  // In production, redirect to sign in if not authenticated
  if (!import.meta.env.DEV && !token) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
