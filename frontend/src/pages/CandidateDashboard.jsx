import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { applicationsAPI, matchingAPI, jobsAPI } from '../services/api'
import JobCard from '../components/JobCard'
import {
  Briefcase, CheckCircle, Clock, XCircle, Star, Bookmark,
  Zap, User, UploadCloud, ChevronRight, TrendingUp, Award
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const STATUS_META = {
  pending:     { label: 'Pending',      color: 'bg-gray-100 text-gray-600',    icon: Clock },
  reviewing:   { label: 'Reviewing',    color: 'bg-blue-100 text-blue-700',    icon: Clock },
  shortlisted: { label: 'Shortlisted',  color: 'bg-purple-100 text-purple-700', icon: Star },
  interview:   { label: 'Interview',    color: 'bg-amber-100 text-amber-700',  icon: TrendingUp },
  offered:     { label: 'Offered!',     color: 'bg-green-100 text-green-700',  icon: Award },
  rejected:    { label: 'Rejected',     color: 'bg-red-100 text-red-700',      icon: XCircle },
  withdrawn:   { label: 'Withdrawn',    color: 'bg-gray-100 text-gray-500',    icon: XCircle },
}

const PIPELINE_STEPS = ['pending', 'reviewing', 'shortlisted', 'interview', 'offered']

function ApplicationRow({ app }) {
  const meta = STATUS_META[app.status] || STATUS_META.pending
  const Icon = meta.icon
  const step = PIPELINE_STEPS.indexOf(app.status)

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link to={`/jobs/${app.job.id}`}
            className="font-semibold text-gray-900 hover:text-brand-600 transition-colors block truncate">
            {app.job.title}
          </Link>
          <p className="text-sm text-gray-500 mt-0.5">{app.job.company_name}</p>
          <p className="text-xs text-gray-400 mt-1">
            Applied {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
          </p>
        </div>
        <span className={`badge ${meta.color} flex items-center gap-1 flex-shrink-0`}>
          <Icon className="w-3 h-3" /> {meta.label}
        </span>
      </div>

      {/* Pipeline stepper (only for non-terminal statuses) */}
      {step >= 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-0">
            {PIPELINE_STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                  i <= step ? 'bg-brand-500' : 'bg-gray-200'
                }`} />
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 transition-colors ${
                    i < step ? 'bg-brand-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {PIPELINE_STEPS.map((s, i) => (
              <p key={s} className={`text-[10px] leading-tight ${
                i <= step ? 'text-brand-600 font-medium' : 'text-gray-400'
              } ${i === 0 ? 'text-left' : i === PIPELINE_STEPS.length - 1 ? 'text-right' : 'text-center'}`}
                style={{ width: `${100 / PIPELINE_STEPS.length}%` }}>
                {STATUS_META[s]?.label}
              </p>
            ))}
          </div>
        </div>
      )}

      {app.match_score != null && (
        <div className="mt-3 flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
            <Zap className="w-3 h-3" /> {app.match_score.toFixed(0)}% match
          </div>
        </div>
      )}
    </div>
  )
}

export default function CandidateDashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const [stats, setStats] = useState(null)
  const [applications, setApplications] = useState([])
  const [matchedJobs, setMatchedJobs] = useState([])
  const [savedJobs, setSavedJobs] = useState([])
  const [activeTab, setActiveTab] = useState('applications')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, appsRes, matchRes, savedRes] = await Promise.allSettled([
          applicationsAPI.candidateStats(),
          applicationsAPI.myApplications(),
          matchingAPI.matchedJobs({ top: 6 }),
          jobsAPI.savedJobs(),
        ])
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
        if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data.results || [])
        if (matchRes.status === 'fulfilled') setMatchedJobs(matchRes.value.data.results || [])
        if (savedRes.status === 'fulfilled') setSavedJobs(savedRes.value.data.results || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredApps = statusFilter
    ? applications.filter(a => a.status === statusFilter)
    : applications

  const profileComplete = profile && profile.skills?.length > 0 && profile.headline

  const statCards = [
    { label: 'Total Applied', value: stats?.total_applications ?? '—', icon: Briefcase, color: 'text-brand-600 bg-brand-50' },
    { label: 'Shortlisted',   value: stats?.status_breakdown?.shortlisted ?? '—', icon: Star, color: 'text-purple-600 bg-purple-50' },
    { label: 'Interviews',    value: stats?.status_breakdown?.interview ?? '—', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
    { label: 'Offers',        value: stats?.status_breakdown?.offered ?? '—', icon: Award, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="section-title">Good to see you, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 mt-1">Track your applications and discover matched jobs</p>
        </div>
        <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
      </div>

      {/* Profile completeness banner */}
      {!profileComplete && (
        <div className="card p-4 mb-6 bg-amber-50 border-amber-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-900 text-sm">Complete your profile to unlock AI matching</p>
              <p className="text-xs text-amber-700 mt-0.5">Add your skills, headline, and upload your CV</p>
            </div>
          </div>
          <Link to="/profile" className="btn-secondary text-sm flex-shrink-0 border-amber-200 text-amber-800 hover:bg-amber-100">
            Complete Profile <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100 overflow-x-auto">
        {[
          { id: 'applications', label: `Applications (${applications.length})` },
          { id: 'matched', label: `AI Matches (${matchedJobs.length})` },
          { id: 'saved', label: `Saved (${savedJobs.length})` },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Applications tab */}
      {activeTab === 'applications' && (
        <div>
          {/* Status filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['', 'pending', 'reviewing', 'shortlisted', 'interview', 'offered', 'rejected'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-all font-medium ${
                  statusFilter === s
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}>
                {s ? STATUS_META[s]?.label : 'All'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse h-24" />
              ))}
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="card p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {statusFilter ? `No ${STATUS_META[statusFilter]?.label} applications` : "You haven't applied to any jobs yet"}
              </p>
              <Link to="/jobs" className="btn-primary mt-4 inline-flex">Find Jobs</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map((app) => <ApplicationRow key={app.id} app={app} />)}
            </div>
          )}
        </div>
      )}

      {/* Matched jobs tab */}
      {activeTab === 'matched' && (
        <div>
          {!profileComplete && (
            <div className="card p-6 mb-4 text-center bg-gray-50">
              <Zap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Complete your profile to see AI-matched jobs</p>
              <Link to="/profile" className="btn-primary mt-3 inline-flex text-sm">Update Profile</Link>
            </div>
          )}
          {matchedJobs.length === 0 && profileComplete && (
            <div className="card p-12 text-center">
              <Zap className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No matches yet. Add more skills to your profile!</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchedJobs.map((job) => <JobCard key={job.id} job={job} showScore />)}
          </div>
        </div>
      )}

      {/* Saved jobs tab */}
      {activeTab === 'saved' && (
        <div>
          {savedJobs.length === 0 ? (
            <div className="card p-12 text-center">
              <Bookmark className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No saved jobs yet</p>
              <p className="text-sm text-gray-400 mt-1">Bookmark jobs to review them later</p>
              <Link to="/jobs" className="btn-primary mt-4 inline-flex">Browse Jobs</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedJobs.map(({ job }) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
