import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Session {
  id: number;
  sessionId: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

const SessionManager: React.FC = () => {
  const { user, sessionData, logout, logoutAll } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (window.confirm('Are you sure you want to logout from all devices? This will invalidate all your active sessions.')) {
      await logoutAll();
    }
  };

  const handleInvalidateSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to invalidate this session?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/auth/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Refresh sessions list
          fetchSessions();
        } else {
          console.error('Failed to invalidate session');
        }
      } catch (error) {
        console.error('Error invalidating session:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getBrowserInfo = (userAgent: string) => {
    // Simple browser detection
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Active Sessions</h2>
          <div className="space-x-2">
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleLogoutAll}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout All Devices
            </button>
          </div>
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">Current Session</h3>
          <p className="text-blue-600">
            Session ID: {sessionData?.sessionId}
          </p>
          <p className="text-blue-600">
            Expires: {sessionData?.expiresAt ? formatDate(sessionData.expiresAt) : 'Unknown'}
          </p>
        </div>

        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No active sessions found.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-lg border ${
                  session.isCurrent 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {getBrowserInfo(session.userAgent)}
                      </h3>
                      {session.isCurrent && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Current Session
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>IP Address:</strong> {session.ipAddress}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Created:</strong> {formatDate(session.createdAt)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Expires:</strong> {formatDate(session.expiresAt)}
                    </p>
                  </div>
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleInvalidateSession(session.sessionId)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Security Tips</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Only keep sessions active on devices you trust</li>
            <li>• Logout from public or shared computers</li>
            <li>• If you notice any suspicious activity, logout from all devices immediately</li>
            <li>• Sessions automatically expire after 30 days</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;

