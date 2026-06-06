import { useState } from 'react'
import { Mail, X } from 'lucide-react'
import { authAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

/**
 * Shows a dismissible banner when the logged-in user hasn't verified their email.
 * Placed in App.jsx just below the Navbar.
 */
export default function EmailVerificationBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)

  if (!user || user.is_email_verified || dismissed) return null

  const handleResend = async () => {
    setSending(true)
    try {
      await authAPI.resendVerification()
      toast.success('Verification email sent — check your inbox!')
    } catch {
      toast.error('Could not send email. Try again later.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="bg-amber-50 border-b border-amber-200"
      role="alert"
      aria-live="polite"
    >
      <div className="page-container py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 text-sm text-amber-800">
          <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>
            Please verify your email address to unlock all features.{' '}
            <button
              onClick={handleResend}
              disabled={sending}
              className="font-semibold underline underline-offset-2 hover:text-amber-900 disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Resend verification email'}
            </button>
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800 flex-shrink-0"
          aria-label="Dismiss this notification"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
