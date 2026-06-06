import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { Briefcase, Eye, EyeOff, User, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const { register: authRegister } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [role, setRole] = useState(searchParams.get('role') || 'candidate')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    try {
      const user = await authRegister({ ...data, role })
      toast.success(`Account created! Welcome, ${user.full_name.split(' ')[0]}!`)
      navigate(role === 'recruiter' ? '/recruiter/dashboard' : '/dashboard', { replace: true })
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        const msg = Object.entries(errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join('\n')
        toast.error(msg)
      } else {
        toast.error('Registration failed. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Start finding your perfect role today</p>
        </div>

        {/* Role selector */}
        <div className="flex gap-3 mb-6">
          {[
            { value: 'candidate', label: 'Job Seeker', icon: User, desc: 'Find & apply for jobs' },
            { value: 'recruiter', label: 'Recruiter', icon: Building2, desc: 'Post jobs & hire talent' },
          ].map(({ value, label, icon: Icon, desc }) => (
            <button key={value} type="button" onClick={() => setRole(value)}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${
                role === value
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
              <Icon className={`w-5 h-5 mb-1.5 ${role === value ? 'text-brand-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-semibold ${role === value ? 'text-brand-700' : 'text-gray-700'}`}>{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label className="label" htmlFor="full_name">Full Name</label>
              <input id="full_name" type="text" className={`input ${errors.full_name ? 'border-red-300' : ''}`}
                placeholder="Jane Smith"
                {...register('full_name', { required: 'Full name is required', minLength: { value: 2, message: 'Too short' } })}
              />
              {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
            </div>

            {role === 'recruiter' && (
              <div>
                <label className="label" htmlFor="company_name">Company Name</label>
                <input id="company_name" type="text" className={`input ${errors.company_name ? 'border-red-300' : ''}`}
                  placeholder="Acme Corp"
                  {...register('company_name', { required: role === 'recruiter' ? 'Company name is required' : false })}
                />
                {errors.company_name && <p className="form-error">{errors.company_name.message}</p>}
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input id="email" type="email" className={`input ${errors.email ? 'border-red-300' : ''}`}
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
                })}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'}
                  className={`input pr-11 ${errors.password ? 'border-red-300' : ''}`}
                  placeholder="Min. 8 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters' }
                  })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="confirm_password">Confirm Password</label>
              <input id="confirm_password" type="password"
                className={`input ${errors.confirm_password ? 'border-red-300' : ''}`}
                placeholder="••••••••"
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: (v) => v === password || 'Passwords do not match'
                })}
              />
              {errors.confirm_password && <p className="form-error">{errors.confirm_password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>

            <p className="text-xs text-center text-gray-400">
              By creating an account you agree to our{' '}
              <a href="#" className="text-brand-600 hover:underline">Terms</a> and{' '}
              <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>.
            </p>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
