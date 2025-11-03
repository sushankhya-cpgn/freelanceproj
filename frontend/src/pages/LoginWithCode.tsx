import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import OTPVerification from '@/components/OTPVerification';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/api/axios';

const LoginWithCode: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axiosInstance.post('/auth/login/otp/request', { email });
      setSuccess(data.message || 'Login code sent');
      setStep('otp');
    } catch (err: any) {
      const apiError = err?.response?.data?.error || err?.response?.data?.message;
      setError(apiError || 'Failed to send login code');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = (payload: any) => {
    // payload contains { message, token, sessionId, expiresAt, user }
    if (payload?.user && payload?.token) {
      const sessionData = { sessionId: payload.sessionId, expiresAt: payload.expiresAt };
      login(payload.user, payload.token, sessionData);
      const user = payload.user;
      if (user.userType === 'freelancer') navigate('/freelancerhomepage');
      else if (user.userType === 'client') navigate('/clienthomepage');
      else if (user.userType === 'agency') navigate('/agencyhomepage');
      else navigate('/');
    }
  };

  const handleBack = () => {
    if (step === 'otp') setStep('email');
    else navigate('/login');
  };

  if (step === 'otp') {
    return (
      <OTPVerification
        email={email}
        onVerificationSuccess={handleOTPSuccess}
        onBack={handleBack}
        type="login"
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Login with Email Code</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a one-time code to sign in
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={loading}
                  required
                />
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

              <Button type="submit" className="w-full" disabled={loading || !email}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  'Send Login Code'
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Password Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginWithCode;
