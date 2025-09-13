import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  moduleName?: string;
}

function ErrorFallback({ error, resetErrorBoundary, moduleName }: ErrorFallbackProps) {
  return (
    <div className="error-boundary">
      <div className="error-content">
        <h2>⚠️ Module Unavailable</h2>
        <p>
          {moduleName 
            ? `The ${moduleName} module is currently unavailable.`
            : 'This module is currently unavailable.'
          }
        </p>
        <details className="error-details">
          <summary>Error Details</summary>
          <pre>{error.message}</pre>
        </details>
        <div className="error-actions">
          <button onClick={resetErrorBoundary} className="retry-button">
            Try Again
          </button>
          <button onClick={() => window.location.reload()} className="refresh-button">
            Refresh Page
          </button>
        </div>
      </div>
      
    </div>
  );
}

interface ModuleErrorBoundaryProps {
  children: React.ReactNode;
  moduleName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function ModuleErrorBoundary({ children, moduleName, onError }: ModuleErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`Error in module ${moduleName || 'unknown'}:`, error, errorInfo);
    if (onError) {
      onError(error, errorInfo);
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={(props) => (
        <ErrorFallback {...props} moduleName={moduleName} />
      )}
      onError={handleError}
      resetKeys={[moduleName]}
    >
      {children}
    </ReactErrorBoundary>
  );
}