import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, Shield } from 'lucide-react';

interface LogoutButtonProps {
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
  const { user, logout, logoutAll } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutAll = async () => {
    if (window.confirm('Are you sure you want to logout from all devices? This will invalidate all your active sessions.')) {
      setIsLoggingOut(true);
      try {
        await logoutAll();
      } catch (error) {
        console.error('Logout all error:', error);
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <User className="h-4 w-4 mr-2" />
          {user.firstName || user.email}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Shield className="h-4 w-4 mr-2" />
          Security
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleLogoutAll}
          disabled={isLoggingOut}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout All Devices
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LogoutButton;

