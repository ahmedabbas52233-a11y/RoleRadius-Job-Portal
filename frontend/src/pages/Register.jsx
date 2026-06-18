import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Zap, Eye, EyeOff, AlertCircle, Users, Building2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email:'', password:'', full_name:'', role:'candidate' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handle = async e => {
    e.preventDefault(); setErrors({}); setLoading(true)
    try {
      const user = await register(form)
      toast.success(`Welcome to RoleRadius, ${user.full_name.split(' ')[0]}! 🎉`)
      navigate(user.role==='recruiter' ? '/recruiter/dashboard' : '/dashboard')
    } catch(err) { setErrors(err.response?.data || {}) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12"
      style={{background:'linear-gradient(135deg,var(--surface-2),var(--surface-3))'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-4 shadow-btn">
            <Zap className="w-7 h-7 text-white" aria-hidden="true"/>
          </div>
          <h1 className="font-extrabold text-2xl mb-1" style={{color:'var(--text-1)',letterSpacing:'-.02em'}}>Create account</h1>
          <p className="text-sm" style={{color:'var(--text-2)'}}>Join RoleRadius — it's completely free</p>
        </div>
        <div className="card p-7 shadow-card-md">
          <div className="grid grid-cols-2 gap-2 mb-5 p-1 rounded-xl" style={{background:'var(--surface-2)'}}>
            {[{v:'candidate',Icon:Users,label:'Job Seeker'},{v:'recruiter',Icon:Building2,label:'Recruiter'}].map(({v,Icon,label})=>(
              <button key={v} type="button" onClick={()=>setForm(f=>({...f,role:v}))} aria-pressed={form.role===v}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={form.role===v ? {background:'white',color:'var(--primary)',boxShadow:'0 1px 4px rgba(0,0,0,.08)'} : {color:'var(--text-2)'}}>
                <Icon className="w-4 h-4" aria-hidden="true"/> {label}
              </button>
            ))}
          </div>
          {(errors.non_field_errors || errors.detail) && (
            <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4" role="alert"
              style={{background:'#fef2f2',color:'#991b1b',border:'1px solid #fecaca'}}>
              <AlertCircle className="w-4 h-4 flex-shrink-0"/>{errors.non_field_errors?.[0]||errors.detail}
            </div>
          )}
          <form onSubmit={handle} noValidate className="flex flex-col gap-4">
            {[
              {id:'name', type:'text',  key:'full_name', label:'Full name',       placeholder:'Ahmad Abbas Hussain', autocomplete:'name'},
              {id:'email',type:'email', key:'email',     label:'Email address',   placeholder:'you@example.com', autocomplete:'email'},
              {id:'pw',   type:showPw?'text':'password', key:'password', label:'Password', placeholder:'Min 8 characters', autocomplete:'new-password'},
            ].map(({id,type,key,label,placeholder,autocomplete})=>(
              <div key={id}>
                <label htmlFor={id} className="label">{label}</label>
                <div className="relative">
                  <input id={id} type={type} required autoComplete={autocomplete} placeholder={placeholder}
                    value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                    className={`input${errors[key]?' input-error':''}${key==='password'?' pr-11':''}`} />
                  {key==='password' && (
                    <button type="button" onClick={()=>setShowPw(!showPw)} aria-label={showPw?'Hide password':'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'var(--text-3)'}}>
                      {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  )}
                </div>
                {errors[key] && <p className="error-msg">{errors[key][0]}</p>}
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-1">
              {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating…</span>
                : <span className="flex items-center gap-2">Create Free Account <ArrowRight className="w-4 h-4"/></span>}
            </button>
          </form>
        </div>
        <p className="text-center text-sm mt-6" style={{color:'var(--text-2)'}}>
          Already have an account? <Link to="/login" className="font-bold" style={{color:'var(--primary)'}}>Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
