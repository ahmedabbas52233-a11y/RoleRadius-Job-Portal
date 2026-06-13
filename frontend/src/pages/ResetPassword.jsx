import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate  = useNavigate()
  const [pw, setPw]           = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [state, setState]     = useState('idle')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.confirmPasswordReset({ token, new_password: pw })
      setState('success')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setState('error')
      toast.error(err.response?.data?.detail || 'Reset failed. Link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="card p-6 sm:p-8 text-center">
          {state === 'success' ? (
            <>
              <CheckCircle className="w-12 h-12 text-brand-600 mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-2">Password reset!</h2>
              <p className="text-sm text-gray-500">Redirecting you to sign in…</p>
            </>
          ) : state === 'error' ? (
            <>
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-2">Link expired</h2>
              <p className="text-sm text-gray-500 mb-4">Request a new reset link.</p>
              <Link to="/forgot-password" className="btn-primary w-full justify-center">Request New Link</Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-1 text-left">Choose new password</h1>
              <p className="text-sm text-gray-500 mb-6 text-left">Must be at least 8 characters.</p>
              <form onSubmit={handleSubmit} noValidate>
                <div className="relative mb-4">
                  <input type={showPw ? 'text' : 'password'} value={pw}
                    onChange={e => setPw(e.target.value)} required minLength={8}
                    className="input pr-11" placeholder="New password" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPw ? 'Hide' : 'Show'}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? 'Saving…' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
