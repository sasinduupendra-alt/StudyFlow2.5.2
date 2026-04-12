import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  fullScreen?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.fullScreen !== false) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      let errorMessage = "Something went wrong. Please try again later.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.operationType && parsed.authInfo) {
            isFirestoreError = true;
            errorMessage = `Database Error: ${parsed.error}. Operation: ${parsed.operationType} on ${parsed.path || 'unknown path'}`;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className={cn(
          "flex items-center justify-center p-6 text-white",
          this.props.fullScreen !== false ? "min-h-screen bg-black" : "h-full w-full bg-transparent"
        )}>
          <div className="max-w-md w-full bg-transparent border border-white/20 rounded-none p-8 text-center space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="w-16 h-16 bg-transparent border border-red-500/30 rounded-none flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-mono uppercase tracking-widest text-white">System Failure</h2>
            <p className="text-zinc-400 leading-relaxed text-xs font-mono uppercase tracking-widest">
              {errorMessage}
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-transparent border border-white/20 text-white font-mono uppercase tracking-widest rounded-none flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white transition-all"
            >
              <RefreshCcw className="w-5 h-5" />
              {this.props.fullScreen !== false ? "Reinitialize System" : "Retry Operation"}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

