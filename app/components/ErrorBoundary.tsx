"use client";
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Tab error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <p className="text-red-600 font-black text-lg">Something went wrong loading this tab.</p>
          <p className="text-slate-500 text-sm font-mono">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-sm hover:bg-black"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
