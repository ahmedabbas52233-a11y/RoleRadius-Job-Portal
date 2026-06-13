import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 text-center">
      <div>
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-gray-300" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-6">This page doesn't exist.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  )
}
