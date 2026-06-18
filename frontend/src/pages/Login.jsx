import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Zap, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')
  const [form, setForm]     = useState({ email:'', password:'' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handle = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back! 👋`)
      navigate(next || (user.role==='recruiter' ? '/recruiter/dashboard' : '/dashboard'))
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12"
      style={{background:'linear-gradient(135deg,var(--surface-2) 0%,var(--surface-3) 100%)'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-4 shadow-btn">
            <Zap className="w-7 h-7 text-white" aria-hidden="true"/>
          </div>
          <h1 className="font-extrabold text-2xl mb-1" style={{color:'var(--text-1)',letterSpacing:'-.02em'}}>Welcome back</h1>
          <p className="text-sm" style={{color:'var(--text-2)'}}>Sign in to your RoleRadius account</p>
        </div>
        <div className="card p-7 shadow-card-md">
          {error && (
            <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-5" role="alert"
              style={{background:'#fef2f2',color:'#991b1b',border:'1px solid #fecaca'}}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true"/>{error}
            </div>
          )}
          <form onSubmit={handle} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="label">Email address</label>
              <input id="email" type="email" required autoComplete="email" placeholder="you@example.com"
                value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="input" />
            </div>
            <div className="mb-6">
              <div className="flex justify-between items-baseline mb-1.5">
                <label htmlFor="pw" className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold" style={{color:'var(--primary)'}}>Forgot?</Link>
              </div>
              <div className="relative">
                <input id="pw" type={showPw?'text':'password'} required autoComplete="current-password" placeholder="••••••••"
                  value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} className="input pr-11" />
                <button type="button" onClick={()=>setShowPw(!showPw)} aria-label={showPw?'Hide password':'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'var(--text-3)'}}>
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in…</span>
                : <span className="flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4"/></span>}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t text-center" style={{borderColor:'var(--border)'}}>
            <p className="text-xs mb-3" style={{color:'var(--text-3)'}}>Demo credentials</p>
            <div className="flex flex-col gap-1.5">
              {[['priya.sharma@email.com','Candidate (best AI demo)'],['hr@techcorp.com','Recruiter']].map(([email,role])=>(
                <button key={email} type="button" onClick={()=>setForm({email,password:'demo1234'})}
                  className="text-xs px-3 py-2 rounded-lg transition-all text-left"
                  style={{background:'var(--surface-2)',color:'var(--text-2)',border:'1px solid var(--border)'}}>
                  <span className="font-semibold">{email}</span> <span style={{color:'var(--text-3)'}}>/ demo1234 — {role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-center text-sm mt-6" style={{color:'var(--text-2)'}}>
          No account? <Link to="/register" className="font-bold" style={{color:'var(--primary)'}}>Create one free →</Link>
        </p>
      </div>
    </div>
  )
}
