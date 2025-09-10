import ThemeProvider from './components/ThemeProvider';
import ThemeSwitcher from './components/ThemeSwitcher';
import { RequireRole } from './components/RequireRole';
import './App.css';

import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import RemoteModule from './components/RemoteModule';
import './App.css';
import type { User } from './context/AppContext';

function AppContent() {
  const { state, refreshConfig } = useAppContext();
  const location = useLocation();

  useEffect(() => {
    console.log(
      '🛣️ Route:',
      location.pathname,
      'User:',
      state.user?.username || 'none'
    );
  }, [location, state.user]);

  const mfs = state.config?.microFrontends ?? [];

  const findConfig = (scope: string, moduleOverride?: string) => {
    const base = mfs.find((m) => m.scope === scope);
    if (!base) return null;
    const moduleFromRegistry =
      moduleOverride ||
      base.module ||
      (Array.isArray(base.modules) && base.modules.length > 0
        ? base.modules[0]
        : undefined);

    return {
      name: base.name,
      displayName: base.displayName,
      url: base.url,
      scope: base.scope,
      module: moduleFromRegistry || './index',
      routes: base.routes,
      roles: base.roles,
    };
  };

  type Config = ReturnType<typeof findConfig>;

  const cfgOr = (cfg: Config, Fallback: React.FC) =>
    cfg ? (
      <RemoteModule config={cfg} user={state.user ?? undefined} />
    ) : (
      <Fallback />
    );

  if (state.loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-brand">
          <h1>🏢 Enterprise SaaS</h1>
        </div>
        <div className="nav-links">
          {state.user ? (
            <>
              <span className="nav-user">
                Welcome, <strong>{state.user.username}</strong>
                <span className={`user-role ${state.user.role}`}>
                  {state.user.role}
                </span>
              </span>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
              {state.user?.role === 'admin' && (
                <>
                  <Link to="/bookings" className="nav-link">
                    Bookings
                  </Link>
                  <Link to="/reports" className="nav-link">
                    Reports
                  </Link>
                </>
              )}
              <button onClick={refreshConfig} className="nav-link">
                Refresh Modules
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link primary">
              Sign In
            </Link>
          )}
          {/* 🔥 Theme switcher added here */}
          <ThemeSwitcher />
        </div>
      </nav>

      <main className="app-main">
        <Routes>
          {/* Root redirect */}
          <Route
            path="/"
            element={
              state.user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Login */}
          <Route
            path="/login"
            element={
              state.user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                cfgOr(findConfig('authApp', './Login'), () => (
                  <div className="fallback-auth">
                    <h2>Authentication Unavailable</h2>
                    <p>The login module is currently unavailable.</p>
                  </div>
                ))
              )
            }
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              !state.user ? (
                <Navigate to="/login" replace />
              ) : (
                <div className="dashboard">
                  <h2>Dashboard</h2>
                  <div className="dashboard-content">
                    <div className="welcome-section">
                      <h3>Welcome back, {state.user.username}!</h3>
                      <p>Select a module from the navigation to get started.</p>
                    </div>
                    <div className="modules-grid">
                      <div className="module-card">
                        <h4>👤 User Profile</h4>
                        <p>Manage your profile and account settings</p>
                        <Link to="/profile" className="module-button">
                          View Profile
                        </Link>
                      </div>
                      {state.user.role === 'admin' ? (
                        <>
                          <div className="module-card">
                            <h4>📅 Booking Management</h4>
                            <p>Manage facility bookings and reservations</p>
                            <Link to="/bookings" className="module-button">
                              Manage Bookings
                            </Link>
                          </div>
                          <div className="module-card">
                            <h4>📊 Analytics & Reports</h4>
                            <p>View booking analytics and generate reports</p>
                            <Link to="/reports" className="module-button">
                              View Reports
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div className="module-card disabled">
                          <h4>🔒 Booking Management</h4>
                          <p>Admin access required</p>
                          <button className="module-button" disabled>
                            Admin Only
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            }
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              !state.user ? (
                <Navigate to="/login" replace />
              ) : (
                cfgOr(findConfig('authApp', './UserProfile'), () => (
                  <div className="fallback-profile">
                    <h2>Profile Unavailable</h2>
                    <p>The profile module is currently unavailable.</p>
                  </div>
                ))
              )
            }
          />

          {/* Bookings (admin only) */}
          <Route
            path="/bookings"
            element={
              <RequireRole user={state.user} allowed={['admin']}>
                {cfgOr(findConfig('bookingApp'), () => (
                  <div className="fallback-booking">
                    <h2>Booking Module Unavailable</h2>
                    <p>The booking module is currently unavailable.</p>
                  </div>
                ))}
              </RequireRole>
            }
          />

          {/* Reports (admin only) */}
          <Route
            path="/reports"
            element={
              <RequireRole user={state.user} allowed={['admin']}>
                {cfgOr(findConfig('reportingApp', './ReportDashboard'), () => (
                  <div className="fallback-reporting">
                    <h2>Reporting Module Unavailable</h2>
                    <p>The reporting module is currently unavailable.</p>
                  </div>
                ))}
              </RequireRole>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="not-found">
                <h2>Page Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
                <Link to="/" className="home-button">
                  Go Home
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppProvider>
          <AppContent />
        </AppProvider>
      </Router>
    </ThemeProvider>
  );
}
