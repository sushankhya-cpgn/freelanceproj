import React from "react";
import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface GuestRouteProps {
  element: ReactElement;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ element }) => {
  const { isAuthenticated, user, initializing } = useAuth();

  if (initializing) return null;

  if (isAuthenticated) {
    const redirect = user?.userType === "freelancer"
      ? "/freelancerhomepage"
      : user?.userType === "client"
      ? "/clienthomepage"
      : "/";
    return <Navigate to={redirect} replace />;
  }

  return element;
};

export default GuestRoute;
