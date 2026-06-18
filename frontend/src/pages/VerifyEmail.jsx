import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { CheckCircle, XCircle, Loader2, Zap } from 'lucide-react'

export default function VerifyEmail() {
  const { token } = useParams()
  const [state, setState]     = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(()=>{
    if (!token) { setState('error'); setMessage('Missing verification token.'); return }
    authAPI.verifyEmail(token)
      .then(({data})=>{ setState('success'); setMessage(data.detail) })
      .catch(err=>{ setState('error'); setMessage(err.response?.data?.detail||'Verification failed.') })
  },[token])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" style={{background:'var(--surface-2)'}}>
      <div className="card p-10 text-center max-w-md w-full shadow-card-md">
        <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-5 shadow-btn">
          <Zap className="w-7 h-7 text-white" aria-hidden="true"/>
        </div>
        {state==='loading' && <>
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{color:'var(--primary)'}} aria-hidden="true"/>
          <p style={{color:'var(--text-2)'}}>Verifying your email…</p>
        </>}
        {state==='success' && <>
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" aria-hidden="true"/>
          <h1 className="font-extrabold text-xl mb-2" style={{color:'var(--text-1)'}}>Email Verified! 🎉</h1>
          <p className="text-sm mb-6" style={{color:'var(--text-2)'}}>{message}</p>
          <Link to="/dashboard" className="btn-primary w-full justify-center">Go to Dashboard</Link>
        </>}
        {state==='error' && <>
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-400" aria-hidden="true"/>
          <h1 className="font-extrabold text-xl mb-2" style={{color:'var(--text-1)'}}>Verification Failed</h1>
          <p className="text-sm mb-6" style={{color:'var(--text-2)'}}>{message}</p>
          <Link to="/login" className="btn-secondary w-full justify-center">Back to Sign In</Link>
        </>}
      </div>
    </div>
  )
}
