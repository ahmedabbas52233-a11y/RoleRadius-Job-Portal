import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '../services/api'
import { Briefcase, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const password = watch('new_password')

  const onSubmit = async (data) => {
    try {
      await authAPI.confirmPasswordReset({ token, ...data })
      setDone(true)
      toast.success('Password reset successfully!')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Reset failed. The link may have expired.'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="text-gray-500 mt-1">Choose a strong password for your account</p>
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="font-semibold text-gray-900">Password reset!</p>
              <p className="text-sm text-gray-500 mt-2">Redirecting you to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'}
                    className={`input pr-11 ${errors.new_password ? 'border-red-300' : ''}`}
                    placeholder="Min. 8 characters"
                    {...register('new_password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'At least 8 characters' }
                    })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.new_password && <p className="form-error">{errors.new_password.message}</p>}
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" className={`input ${errors.confirm_password ? 'border-red-300' : ''}`}
                  placeholder="••••••••"
                  {...register('confirm_password', {
                    required: 'Please confirm',
                    validate: v => v === password || 'Passwords do not match'
                  })} />
                {errors.confirm_password && <p className="form-error">{errors.confirm_password.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3">
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting…
                  </span>
                ) : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
