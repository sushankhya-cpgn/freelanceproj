import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const sessionId = searchParams.get('sessionId');
        const expiresAt = searchParams.get('expiresAt');
  // const provider = searchParams.get('provider');
        const error = searchParams.get('error');

        if (error) {
          setError('OAuth authentication failed. Please try again.');
          setLoading(false);
          return;
        }

        if (!token || !sessionId || !expiresAt) {
          setError('Invalid OAuth response. Please try again.');
          setLoading(false);
          return;
        }

        // Get user data from backend using the configured API base URL
        // Use axios instance to ensure we hit the correct server (http://localhost:3000/api in dev)
        const response = await axiosInstance.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { user } = response.data;

        // Create session data object
        const sessionData = {
          sessionId,
          expiresAt
        };

  // Login the user and persist token/session
  login(user, token, sessionData);

        // Redirect based on user type
        if (user.userType === 'freelancer') {
          navigate('/freelancerhomepage');
        } else if (user.userType === 'client') {
          navigate('/clienthomepage');
        } else {
          navigate('/');
        }

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Authentication failed. Please try again.');
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, login, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Completing authentication...</h2>
          <p className="text-gray-600 mt-2">Please wait while we set up your account.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Authentication Failed</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;