import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Chrome, 
  Apple, 
  Facebook,
  Loader2 
} from 'lucide-react';

interface OAuthButtonsProps {
  onGoogleLogin: () => void;
  onFacebookLogin: () => void;
  onAppleLogin: () => void;
  loading?: boolean;
  disabled?: boolean;
  googleEnabled?: boolean;
  facebookEnabled?: boolean;
  appleEnabled?: boolean;
}

const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  onGoogleLogin,
  onFacebookLogin,
  onAppleLogin,
  loading = false,
  disabled = false,
  googleEnabled = true,
  facebookEnabled = true,
  appleEnabled = true
}) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {googleEnabled && (
          <Button
            variant="outline"
            onClick={onGoogleLogin}
            disabled={disabled || loading}
            className="w-full h-12 text-sm font-medium transition-all hover:bg-gray-50 hover:border-gray-300"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>
        )}

        {facebookEnabled && (
          <Button
            variant="outline"
            onClick={onFacebookLogin}
            disabled={disabled || loading}
            className="w-full h-12 text-sm font-medium transition-all hover:bg-gray-50 hover:border-gray-300"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Facebook className="mr-2 h-4 w-4" />
            )}
            Continue with Facebook
          </Button>
        )}

        {appleEnabled && (
          <Button
            variant="outline"
            onClick={onAppleLogin}
            disabled={disabled || loading}
            className="w-full h-12 text-sm font-medium transition-all hover:bg-gray-50 hover:border-gray-300"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Apple className="mr-2 h-4 w-4" />
            )}
            Continue with Apple
          </Button>
        )}
      </div>
    </div>
  );
};

export default OAuthButtons;
