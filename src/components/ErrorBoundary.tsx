import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Rhythm Medicity Uncaught Runtime Error:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F4EC] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5DEC9] shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#C4A760] flex items-center justify-center mx-auto border border-amber-200 shadow-inner">
              <AlertTriangle className="w-8 h-8 text-[#C4A760]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#004C3D]">
                Something went wrong
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                An unexpected error occurred while loading this page. Our technical team has been notified.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Go to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
