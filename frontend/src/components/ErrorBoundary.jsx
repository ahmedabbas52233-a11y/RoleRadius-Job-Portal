import { Component } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // In production, send to error monitoring (e.g. Sentry)
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500 mb-2">
            An unexpected error occurred. The problem has been noted.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-xs bg-gray-100 rounded-xl p-4 mb-6 overflow-auto text-red-700 max-h-40">
              {this.state.error.toString()}
            </pre>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={this.handleReset} className="btn-primary">
              <RefreshCw className="w-4 h-4" aria-hidden="true" /> Reload App
            </button>
            <Link to="/" className="btn-secondary" onClick={() => this.setState({ hasError: false, error: null })}>
              <Home className="w-4 h-4" aria-hidden="true" /> Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }
}
