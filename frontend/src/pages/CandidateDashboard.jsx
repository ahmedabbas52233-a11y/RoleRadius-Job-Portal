import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { applicationsAPI, matchingAPI } from '../services/api'
import JobCard from '../components/JobCard'
import { Briefcase, FileText, Zap, Star, Clock, CheckCircle, XCircle, BookmarkCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const STATUS_COLORS = {
  pending:     'badge-gray',
  reviewing:   'badge-blue',
  shortlisted: 'badge-purple',
  interview:   'badge-orange',
  offered:     'badge-green',
  rejected:    'badge-red',
  withdrawn:   'badge-gray',
}
const STATUS_ICONS = {
  pending: Clock, reviewing: FileText, shortlisted: Star,
  interview: Briefcase, offered: CheckCircle, rejected: XCircle, withdrawn: XCircle,
}

const TABS = ['Applications', 'AI Matches', 'Saved Jobs']

export default function CandidateDashboard() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('Applications')
  const [apps, setApps]       = useState([])
  const [matches, setMatches] = useState([])
  const [saved, setSaved]     = useState([])
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      applicationsAPI.myApplications(),
      applicationsAPI.candidateStats(),
      matchingAPI.matchedJobs({ top: 6 }),
    ]).then(([appsRes, statsRes, matchRes]) => {
      if (appsRes.status === 'fulfilled') setApps(appsRes.value.data.results || [])
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      if (matchRes.status === 'fulfilled') setMatches(matchRes.value.data.results || [])
    }).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Applied',     value: stats?.total_applications ?? '—', icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
    { label: 'Reviewing',   value: stats?.status_breakdown?.reviewing ?? '—', icon: FileText, color: 'text-purple-600 bg-purple-50' },
    { label: 'Shortlisted', value: stats?.status_breakdown?.shortlisted ?? '—', icon: Star, color: 'text-amber-600 bg-amber-50' },
    { label: 'Offers',      value: stats?.status_breakdown?.offered ?? '—', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="page-container py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="page-title">Welcome back, {user?.full_name?.split(' ')[0]}! 👋</h1>
        {!user?.is_email_verified && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-medium border border-amber-200">
            ⚠️ Verify your email to unlock all features
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-2`}>
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-full sm:w-auto" role="tablist">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            role="tab" aria-selected={tab === t}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Applications' && (
        loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => <div key={i} className="card p-5 animate-pulse h-24" aria-hidden="true" />)}
          </div>
        ) : apps.length === 0 ? (
          <div className="card p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" aria-hidden="true" />
            <p className="text-gray-500 mb-4">No applications yet</p>
            <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map(app => {
              const StatusIcon = STATUS_ICONS[app.status] || Clock
              return (
                <div key={app.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{app.job?.title}</p>
                      <p className="text-sm text-gray-500">{app.job?.company_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`badge ${STATUS_COLORS[app.status] || 'badge-gray'} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" aria-hidden="true" />
                        {app.status?.replace('_', ' ')}
                      </span>
                      {app.match_score != null && (
                        <span className="text-xs text-brand-600 font-medium flex items-center gap-1">
                          <Zap className="w-3 h-3" aria-hidden="true" /> {Math.round(app.match_score)}% match
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Applied {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                  </p>
                </div>
              )
            })}
          </div>
        )
      )}

      {tab === 'AI Matches' && (
        matches.length === 0 ? (
          <div className="card p-12 text-center">
            <Zap className="w-12 h-12 text-gray-200 mx-auto mb-3" aria-hidden="true" />
            <p className="text-gray-500 mb-2">No matches yet</p>
            <p className="text-sm text-gray-400 mb-4">Upload your CV and fill in your skills profile to get AI-powered job matches.</p>
            <Link to="/profile" className="btn-primary">Complete Profile</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )
      )}

      {tab === 'Saved Jobs' && (
        <div className="card p-12 text-center">
          <BookmarkCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-500 mb-4">Bookmark jobs as you browse</p>
          <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
        </div>
      )}
    </div>
  )
}
