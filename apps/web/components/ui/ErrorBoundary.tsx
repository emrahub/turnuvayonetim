'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Here you could also log to an error reporting service
    // errorReportingService.log(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-poker-green to-poker-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-black/40 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-poker-red/20 rounded-full">
                <AlertTriangle className="w-8 h-8 text-poker-red" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
              Bir Hata Oluştu
            </h2>

            <p className="text-gray-300 mb-6">
              Turnuva yönetim sisteminde beklenmeyen bir hata meydana geldi.
              Lütfen sayfayı yenileyin veya tekrar deneyin.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-gray-400 cursor-pointer mb-2">
                  Teknik Detaylar (Geliştirici Modu)
                </summary>
                <div className="bg-black/60 p-4 rounded text-xs font-mono text-red-300 max-h-40 overflow-auto">
                  <div className="mb-2 text-red-400 font-bold">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  <div className="text-gray-400">
                    {this.state.error.stack}
                  </div>
                  {this.state.errorInfo && (
                    <div className="mt-2 text-gray-400">
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-poker-green hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sayfayı Yenile
              </button>

              <button
                onClick={this.handleRetry}
                className="flex-1 px-4 py-2 bg-poker-gold hover:bg-yellow-600 text-black rounded-lg transition-colors duration-200"
              >
                Tekrar Dene
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Sorun devam ederse lütfen sistem yöneticisi ile iletişime geçin.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    // Could trigger error boundary or show toast notification
  };
}