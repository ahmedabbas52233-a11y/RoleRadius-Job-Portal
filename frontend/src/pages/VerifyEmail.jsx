import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmail() {
  const { token } = useParams()
  const [state, setState] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setState('error'); setMessage('Missing verification token.'); return }
    authAPI.verifyEmail(token)
      .then(({ data }) => { setState('success'); setMessage(data.detail) })
      .catch((err) => {
        setState('error')
        setMessage(err.response?.data?.detail || 'Verification failed.')
      })
  }, [token])

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="card p-10 text-center max-w-md w-full">
        {state === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-4" />
            <p className="text-gray-500">Verifying your email…</p>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
          </>
        )}
        {state === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link to="/login" className="btn-secondary">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  )
}
