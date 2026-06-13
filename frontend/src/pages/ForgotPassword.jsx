import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.requestPasswordReset(email)
      setSent(true)
    } catch {
      toast.error('Could not send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/login" className="btn-ghost mb-6 -ml-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <div className="card p-6 sm:p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-brand-600 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500">If that email exists, we've sent a reset link. Check your inbox (and spam folder).</p>
            </div>
          ) : (
            <>
              <Mail className="w-10 h-10 text-brand-600 mb-4" aria-hidden="true" />
              <h1 className="text-xl font-bold text-gray-900 mb-1">Reset password</h1>
              <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleSubmit} noValidate>
                <label htmlFor="reset-email" className="label">Email address</label>
                <input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required className="input mb-4" placeholder="you@example.com" autoComplete="email" />
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
