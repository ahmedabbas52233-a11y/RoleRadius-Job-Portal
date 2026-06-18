import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-center" style={{background:'var(--surface-2)'}}>
      <div>
        <div className="w-20 h-20 rounded-3xl bg-hero-gradient flex items-center justify-center mx-auto mb-6 shadow-btn">
          <Zap className="w-10 h-10 text-white" aria-hidden="true"/>
        </div>
        <p className="text-7xl font-extrabold mb-2 gradient-text">404</p>
        <h1 className="text-xl font-bold mb-2" style={{color:'var(--text-1)'}}>Page not found</h1>
        <p className="text-sm mb-8" style={{color:'var(--text-2)'}}>This page doesn't exist or was moved.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-primary">Go Home</Link>
          <Link to="/jobs" className="btn-secondary">Browse Jobs</Link>
        </div>
      </div>
    </div>
  )
}
