import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Briefcase, Eye, EyeOff, AlertCircle, Users, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]       = useState({ email: '', password: '', full_name: '', role: 'candidate' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const user = await register(form)
      toast.success(`Welcome to RoleRadius, ${user.full_name}!`)
      navigate(user.role === 'recruiter' ? '/recruiter/dashboard' : '/dashboard')
    } catch (err) {
      const data = err.response?.data || {}
      setErrors(data)
    } finally {
      setLoading(false)
    }
  }

  const field = (key) => ({ value: form[key], onChange: e => setForm(f => ({ ...f, [key]: e.target.value })) })

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Join RoleRadius for free</p>
        </div>

        <div className="card p-6 sm:p-8">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-gray-50 rounded-xl">
            {[
              { value: 'candidate', label: 'Job Seeker', icon: Users },
              { value: 'recruiter', label: 'Recruiter', icon: Building2 },
            ].map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => setForm(f => ({ ...f, role: value }))}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  form.role === value ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-pressed={form.role === value}>
                <Icon className="w-4 h-4" aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          {(errors.non_field_errors || errors.detail) && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4" role="alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.non_field_errors?.[0] || errors.detail}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label htmlFor="full_name" className="label">Full name</label>
              <input id="full_name" type="text" required autoComplete="name"
                placeholder="Ahmad Abbas Hussain" {...field('full_name')}
                className={`input ${errors.full_name ? 'input-error' : ''}`} />
              {errors.full_name && <p className="error-msg">{errors.full_name[0]}</p>}
            </div>
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input id="email" type="email" required autoComplete="email"
                placeholder="you@example.com" {...field('email')}
                className={`input ${errors.email ? 'input-error' : ''}`} />
              {errors.email && <p className="error-msg">{errors.email[0]}</p>}
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input id="password" type={showPw ? 'text' : 'password'} required
                  autoComplete="new-password" placeholder="Min 8 characters" {...field('password')}
                  className={`input pr-11 ${errors.password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-msg">{errors.password[0]}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading
                ? <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                : 'Create Free Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
