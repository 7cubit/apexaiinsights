import React, { useState, useEffect } from 'react';

interface GA4Status {
  connected: boolean;
  status: string;
  connected_at?: string;
  connected_by?: number;
  scope?: string;
  token_valid?: boolean;
}

const GoogleAnalyticsConnect: React.FC = () => {
  const [status, setStatus] = useState<GA4Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check URL params for success/error messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ga_connected') === '1') {
      setError(null);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('ga_error')) {
      setError(params.get('ga_error'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Fetch current status
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/wp-json/apex/v1/auth/google/status', {
        headers: {
          'X-WP-Nonce': (window as any).apexConfig?.nonce || '',
        },
      });
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch GA4 status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      const response = await fetch('/wp-json/apex/v1/auth/google', {
        headers: {
          'X-WP-Nonce': (window as any).apexConfig?.nonce || '',
        },
      });
      const data = await response.json();

      if (data.redirect_url) {
        // Redirect to Google consent screen
        window.location.href = data.redirect_url;
      } else if (data.error) {
        setError(data.error);
        setConnecting(false);
      }
    } catch (err) {
      setError('Failed to initiate connection');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Analytics?')) {
      return;
    }

    try {
      await fetch('/wp-json/apex/v1/auth/google/disconnect', {
        method: 'POST',
        headers: {
          'X-WP-Nonce': (window as any).apexConfig?.nonce || '',
        },
      });
      setStatus({ connected: false, status: 'not_connected' });
    } catch (err) {
      setError('Failed to disconnect');
    }
  };

  if (loading) {
    return (
      <div className="ga-connect-card loading">
        <div className="spinner" />
        <span>Checking connection...</span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .ga-connect-card {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255,255,255,0.1);
          max-width: 400px;
        }
        .ga-connect-card.loading {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.7);
        }
        .ga-connect-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .ga-icon {
          width: 48px;
          height: 48px;
          background: #fff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ga-icon svg {
          width: 32px;
          height: 32px;
        }
        .ga-title {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
        }
        .ga-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
        }
        .ga-connect-btn {
          width: 100%;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
        }
        .ga-connect-btn.primary {
          background: linear-gradient(135deg, #4285f4, #34a853);
          color: #fff;
        }
        .ga-connect-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(66,133,244,0.4);
        }
        .ga-connect-btn.disconnect {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          margin-top: 12px;
        }
        .ga-connect-btn.disconnect:hover {
          background: rgba(220,53,69,0.2);
          color: #dc3545;
        }
        .ga-connect-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .ga-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: rgba(40,167,69,0.15);
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .ga-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #28a745;
        }
        .ga-status-text {
          color: #28a745;
          font-weight: 500;
          font-size: 14px;
        }
        .ga-meta {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          margin-top: 8px;
        }
        .ga-error {
          background: rgba(220,53,69,0.15);
          border: 1px solid rgba(220,53,69,0.3);
          color: #dc3545;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 13px;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #4285f4;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="ga-connect-card">
        <div className="ga-connect-header">
          <div className="ga-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M22.84 10.36h-10.5v3.76h6.03c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.09-1.93 3.29-4.77 3.29-8.14 0-.57-.05-1.12-.14-1.65l-.04-.05z" fill="#4285F4"/>
              <path d="M12.34 22c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.05-3.71 1.05-2.86 0-5.29-1.93-6.16-4.53H2.5v2.84C4.35 19.81 8.05 22 12.34 22z" fill="#34A853"/>
              <path d="M6.18 13.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V6.07H2.5C1.79 7.48 1.38 9.08 1.38 10.78s.41 3.3 1.12 4.71l3.68-2.4z" fill="#FBBC05"/>
              <path d="M12.34 4.18c1.61 0 3.06.56 4.2 1.64l3.15-3.15C17.8.99 15.31 0 12.34 0 8.05 0 4.35 2.19 2.5 5.85l3.68 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/>
            </svg>
          </div>
          <div>
            <div className="ga-title">Google Analytics</div>
            <div className="ga-subtitle">Import your GA4 data</div>
          </div>
        </div>

        {error && (
          <div className="ga-error">
            {error}
          </div>
        )}

        {status?.connected ? (
          <>
            <div className="ga-status">
              <div className="ga-status-dot" />
              <span className="ga-status-text">Connected</span>
            </div>
            {status.connected_at && (
              <div className="ga-meta">
                Connected: {new Date(status.connected_at).toLocaleDateString()}
              </div>
            )}
            <button 
              className="ga-connect-btn disconnect"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </>
        ) : (
          <button 
            className="ga-connect-btn primary"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <div className="spinner" />
                Connecting...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                Connect with Google
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
};

export default GoogleAnalyticsConnect;
