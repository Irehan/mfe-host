// packages\host\src\components\ModuleFederationErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { eventBus } from '../utils/eventBus';

interface Props {
  children: ReactNode;
  moduleName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ModuleFederationErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`❌ Module Federation Error in ${this.props.moduleName}:`, error);
    console.error('Error Info:', errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Emit error event - componentStack can be null, which is now allowed in our types
    eventBus.emit('module:error', {
      payload: {
        module: this.props.moduleName,
        error: error.message,
        stack: error.stack || undefined,
        componentStack: errorInfo.componentStack || undefined
      }
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for certain types of errors
    if (this.shouldRetry(error) && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  private shouldRetry(error: Error): boolean {
    // Retry for network-related errors or script loading errors
    const retryableErrors = [
      'Loading script failed',
      'ChunkLoadError',
      'Script error',
      'NetworkError',
      'Failed to fetch'
    ];

    return retryableErrors.some(errorType => 
      error.message.includes(errorType) || error.name.includes(errorType)
    );
  }

  private scheduleRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff, max 10s
    
    console.log(`🔄 Scheduling retry for ${this.props.moduleName} in ${delay}ms`);
    
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }, delay);
  };

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  private handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      module: this.props.moduleName,
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('📋 Error Report:', errorReport);
    
    // In a real application, you would send this to your error tracking service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    // errorTrackingService.captureException(errorReport);
    
    alert('Error report copied to console. Please check the browser console for details.');
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div style={{
          padding: '20px',
          border: '2px dashed #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          margin: '10px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ color: '#d63031', margin: '0 0 8px 0' }}>
              ⚠️ Module Loading Error
            </h3>
            <p style={{ color: '#636e72', margin: '0', fontSize: '14px' }}>
              Failed to load module: <strong>{this.props.moduleName}</strong>
            </p>
          </div>

          {this.state.error && (
            <div style={{
              backgroundColor: '#fee',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <strong style={{ color: '#d63031' }}>Error:</strong>
              <pre style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                color: '#636e72',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.error.message}
              </pre>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={this.handleManualRetry}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0984e3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0770c9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0984e3'}
            >
              🔄 Retry ({this.state.retryCount}/{this.maxRetries})
            </button>
            
            <button
              onClick={this.handleReportError}
              style={{
                padding: '8px 16px',
                backgroundColor: '#636e72',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2d3436'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#636e72'}
            >
              📋 Report Error
            </button>
          </div>

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#636e72' }}>
            <p style={{ margin: '0' }}>
              Make sure the remote application is running and accessible.
            </p>
            {this.state.retryCount < this.maxRetries && (
              <p style={{ margin: '4px 0 0 0' }}>
                Auto-retry will be attempted...
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModuleFederationErrorBoundary;