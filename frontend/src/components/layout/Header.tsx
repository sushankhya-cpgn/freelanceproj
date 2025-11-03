// import React from "react";

// const Header: React.FC = () => {
//     return (
//         <header className="border-b sticky top-0 bg-background/70 backdrop-blur-md z-50">
//             <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
//                 <h1 className="text-xl font-semibold text-primary">FreeLancePro</h1>
//                 <nav className="hidden md:flex gap-6 text-sm">
//                     <a href="#findwork" className="hover:text-primary">Find Work</a>
//                     <a href="#categories" className="hover:text-primary">Categories</a>
//                     <a href="#topfreelancers" className="hover:text-primary">Top Freelancers</a>
//                     <a href="#about" className="hover:text-primary">Messages</a>
//                 </nav>
//             </div>
//         </header>
//     );
// };

// export default Header;

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { NovuInbox } from "../novu-inbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axiosInstance from "@/api/axios";
// import MessageNotification from "@/components/notifications/MessageNotification";
// import NotificationDropdown from "@/components/notifications/NotificationDropdown";

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  navItems: NavItem[];
  showLogout?: boolean;
}

const Header: React.FC<HeaderProps> = ({ navItems, showLogout }) => {
  const { user, logout, logoutAll } = useAuth();
  const navigate = useNavigate();
  const [connects, setConnects] = useState<number | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchMe = async () => {
      if (!user) return;
      // Use value from user if present
      const maybeConnects = (user as any).connectBalance;
      if (typeof maybeConnects === "number") {
        setConnects(maybeConnects);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axiosInstance.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cb = res.data?.user?.connectBalance;
        if (typeof cb === "number") setConnects(cb);
      } catch {
        // ignore
      }
    };
    fetchMe();
  }, [user]);
  
  return (
    <header className="border-b sticky top-0 bg-background/70 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto flex items-center py-4 px-6">
        <button
          type="button"
          className="text-left"
          onClick={() => {
            if (!user) {
              navigate("/");
              return;
            }
            const role = (user as any).userType;
            if (role === "client") navigate("/clienthomepage");
            else if (role === "freelancer") navigate("/freelancerhomepage");
            else if (role === "agency") navigate("/agencyhomepage");
            else navigate("/");
          }}
        >
          <img
            src="/images/logo.png"
            alt="WorkLabs Logo"
            width={130}
            height={40}
            className="cursor-pointer"
          />
        </button>

        {/* Centered nav */}
        <nav className="hidden md:flex gap-6 text-sm items-center mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`transition-colors font-medium ${
                  isActive 
                    ? "text-primary border-b-2 border-primary pb-1" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right-side user controls */}
        {user && (
          <div className="ml-auto flex items-center gap-2">
            <NovuInbox />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus:outline-none">
                  {(() => {
                    const apiBase = axiosInstance.defaults.baseURL || "";
                    const serverOrigin = apiBase.replace(/\/?api\/?$/, "");
                    const img = (user as any).profileImage as string | undefined;
                    let avatarSrc: string | undefined = undefined;
                    if (typeof img === 'string') {
                      if (/^https?:\/\//i.test(img)) {
                        avatarSrc = img; // absolute URL
                      } else if (img.startsWith('/')) {
                        avatarSrc = `${serverOrigin}${img}`; // leading slash path
                      } else {
                        avatarSrc = `${serverOrigin}/${img}`; // bare relative path
                      }
                    }
                    return (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarSrc || "/placeholder.svg"} />
                        <AvatarFallback>
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })()}
                  <span className="hidden md:inline text-sm font-medium">
                    {user.firstName || user.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const apiBase = axiosInstance.defaults.baseURL || "";
                      const serverOrigin = apiBase.replace(/\/?api\/?$/, "");
                      const img = (user as any).profileImage as string | undefined;
                      let avatarSrc: string | undefined = undefined;
                      if (typeof img === 'string') {
                        if (/^https?:\/\//i.test(img)) {
                          avatarSrc = img;
                        } else if (img.startsWith('/')) {
                          avatarSrc = `${serverOrigin}${img}`;
                        } else {
                          avatarSrc = `${serverOrigin}/${img}`;
                        }
                      }
                      return (
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={avatarSrc || "/placeholder.svg"} />
                          <AvatarFallback>
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })()}
                    <div className="truncate">
                      <div className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to={(user as any)?.userType === 'freelancer' ? "/freelancerhomepage" : (user as any)?.userType === 'agency' ? "/agencyhomepage" : "/clienthomepage"}
                    className="w-full"
                  >
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to={(user as any)?.userType === 'freelancer' ? "/freelancerprofile" : (user as any)?.userType === 'agency' ? "/agency/profile" : "/clientprofile"}
                    className="w-full"
                  >
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  Connects: {connects != null ? connects : "—"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {showLogout && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="w-full">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/security" className="w-full">Security</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => { 
                        try { 
                          await logout(); 
                          navigate('/');
                        } catch (e) { 
                          console.error(e); 
                        } 
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      Logout
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        const ok = window.confirm('Logout from all devices? This will invalidate all active sessions.');
                        if (!ok) return;
                        try { 
                          await logoutAll(); 
                          navigate('/');
                        } catch (e) { 
                          console.error(e); 
                        }
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      Logout All Devices
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
