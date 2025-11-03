import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/api/axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  onVerificationSuccess: (payload: any) => void;
  onBack: () => void;
  type: 'email' | 'password' | 'login';
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  onVerificationSuccess,
  onBack,
  type
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = type === 'email'
        ? '/auth/verify-email'
        : type === 'password'
          ? '/auth/reset-password'
          : '/auth/login/otp/verify';
      const { data } = await axiosInstance.post(endpoint, {
        email,
        otp: otpString,
        ...(type === 'password' && { password: 'temp' }) // Placeholder: will be handled on next screen
      });

      setSuccess(data.message);
      if (type === 'email') {
        onVerificationSuccess(data.user);
      } else if (type === 'login') {
        // Pass through full payload including token and session
        onVerificationSuccess(data);
      } else {
        // For password reset, redirect to new password form
        setTimeout(() => {
          onVerificationSuccess({ email, otp: otpString });
        }, 1000);
      }
    } catch (error: any) {
      const apiError = error?.response?.data?.error || error?.response?.data?.message;
      setError(apiError || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');

    try {
      const endpoint = type === 'email'
        ? '/auth/resend-verification'
        : type === 'password'
          ? '/auth/forgot-password'
          : '/auth/login/otp/request';
      const { data } = await axiosInstance.post(endpoint, { email });

      setSuccess(data.message);
      setCountdown(60); // 60 seconds cooldown
    } catch (error: any) {
      const apiError = error?.response?.data?.error || error?.response?.data?.message;
      setError(apiError || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">
              {type === 'email' ? 'Verify Your Email' : 'Reset Password'}
            </CardTitle>
            <CardDescription>
              {type === 'email' 
                ? 'We sent a 6-digit code to your email address'
                : 'Enter the OTP sent to your email to reset your password'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="mb-6">
              <p className="text-sm text-gray-600 text-center">
                Code sent to <span className="font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold border-2 focus:border-blue-500 focus:ring-0"
                    disabled={loading}
                  />
                ))}
              </div>

              {error && (
                <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md border border-green-300 bg-green-50 p-3 text-green-700 text-sm">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={resendLoading || countdown > 0}
                  className="w-full"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    'Resend Code'
                  )}
                </Button>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OTPVerification;
