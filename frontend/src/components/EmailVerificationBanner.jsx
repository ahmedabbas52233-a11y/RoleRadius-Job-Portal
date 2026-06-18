import { useState } from 'react'
import { Mail, X, ArrowRight } from 'lucide-react'
import { authAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function EmailVerificationBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending]     = useState(false)
  if (!user || user.is_email_verified || dismissed) return null

  const resend = async () => {
    setSending(true)
    try   { await authAPI.resendVerification(); toast.success('Verification email sent!') }
    catch { toast.error('Could not send. Try again.') }
    finally { setSending(false) }
  }

  return (
    <div role="alert" aria-live="polite" style={{background:'linear-gradient(135deg,#fffbeb,#fef3c7)',borderBottom:'1px solid #fde68a'}}>
      <div className="page-container py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 text-sm font-medium" style={{color:'#92400e'}}>
          <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true"/>
          <span>
            Please verify your email to unlock AI matching and job alerts.{' '}
            <button onClick={resend} disabled={sending} className="underline underline-offset-2 font-bold flex-shrink-0 hover:opacity-80 inline-flex items-center gap-1" style={{color:'#78350f'}}>
              {sending ? 'Sending…' : <><span>Resend email</span><ArrowRight className="w-3 h-3"/></>}
            </button>
          </span>
        </div>
        <button onClick={() => setDismissed(true)} className="flex-shrink-0 p-1 rounded-lg hover:bg-amber-200 transition-colors" aria-label="Dismiss notification" style={{color:'#92400e'}}>
          <X className="w-4 h-4"/>
        </button>
      </div>
    </div>
  )
}
