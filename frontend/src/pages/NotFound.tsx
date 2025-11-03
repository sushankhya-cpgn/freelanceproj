import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Try to send freelancers to their homepage, else default to /
      navigate("/freelancerhomepage", { replace: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  const navItems = [
    { label: "Homepage", href: "/freelancerhomepage" },
    { label: "Find Jobs", href: "/jobs" },
    { label: "Applications", href: "/applications" },
    { label: "Messages", href: "/messages" },
    { label: "Profile", href: "/freelancerprofile" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={navItems} />
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find <code>{location.pathname}</code>. Redirecting you shortly...
        </p>
        <button
          className="underline"
          onClick={() => navigate("/freelancerhomepage", { replace: true })}
        >
          Go now
        </button>
      </div>
    </div>
  );
};

export default NotFound;

