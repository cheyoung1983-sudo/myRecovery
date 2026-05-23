import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2rem] text-center space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle size={32} className="text-rose-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Something went wrong</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
              This component encountered an error and couldn't be displayed.
            </p>
          </div>
          <button 
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-[10px] font-black uppercase tracking-widest mx-auto transition-all"
          >
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
