import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4" role="alert">
          <div className="card p-10 text-center max-w-md w-full">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-6">
              An unexpected error occurred. Refreshing the page usually fixes this.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full justify-center">
              <RefreshCw className="w-4 h-4" aria-hidden="true" /> Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
