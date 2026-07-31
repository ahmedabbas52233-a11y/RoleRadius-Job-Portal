import { useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'

const DISMISS_KEY = 'roleradius:open_to_work_nudge_dismissed_until'
const DISMISS_DAYS = 7

function isDismissed() {
  const until = localStorage.getItem(DISMISS_KEY)
  return until && new Date(until) > new Date()
}

function dismissFor(days) {
  const until = new Date()
  until.setDate(until.getDate() + days)
  localStorage.setItem(DISMISS_KEY, until.toISOString())
}

/**
 * A consent-first nudge, not a bypass: this only ever asks a candidate to
 * flip their own open_to_work toggle on -- it never lets a recruiter see
 * someone who hasn't opted in. Shown at high-intent moments (right after
 * applying, or on the dashboard) where a candidate is already engaged and
 * likely to say yes, rather than nagging on every page.
 */
export default function OpenToWorkNudge({ openToWork, variant = 'dashboard', onEnabled }) {
  const [dismissed, setDismissed] = useState(true)
  const [enabling, setEnabling] = useState(false)

  useEffect(() => {
    setDismissed(isDismissed())
  }, [])

  if (openToWork || dismissed) return null

  const enable = async () => {
    setEnabling(true)
    try {
      await authAPI.updateCandidateProfile({ open_to_work: true })
      toast.success('You\u2019re now visible to recruiters searching for talent!')
      onEnabled?.()
    } catch {
      toast.error('Could not update your visibility right now.')
    } finally {
      setEnabling(false)
    }
  }

  const dismiss = () => {
    dismissFor(DISMISS_DAYS)
    setDismissed(true)
  }

  const copy = variant === 'post-apply'
    ? 'Nice, your application is in! Want similar recruiters to find you too?'
    : 'Recruiters are searching for candidates like you right now.'

  return (
    <div className="card p-4 mb-4 animate-fade-up flex items-center justify-between gap-3 flex-wrap" style={{ background: 'var(--primary-light)', border: '1px solid rgba(99,102,241,.25)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface)' }}>
          <Eye className="w-4 h-4" style={{ color: 'var(--primary)' }} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{copy}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Turn on &quot;Open to Work&quot; so they can find your profile. You can turn it off anytime.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={enable} disabled={enabling} className="btn-primary text-sm px-3 py-1.5 disabled:opacity-60">
          {enabling ? 'Turning on…' : 'Turn On'}
        </button>
        <button onClick={dismiss} className="p-1.5 rounded-lg" style={{ color: 'var(--text-3)' }} aria-label="Dismiss">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
