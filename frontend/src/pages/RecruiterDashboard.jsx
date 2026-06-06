import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { applicationsAPI, jobsAPI } from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  Briefcase, Users, TrendingUp, PlusCircle, Eye, EyeOff,
  Trash2, Pencil, Zap, Award, Star, Clock, ChevronRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending',     label: 'Pending' },
  { value: 'reviewing',   label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview',   label: 'Interview' },
  { value: 'offered',     label: 'Offered' },
  { value: 'rejected',    label: 'Rejected' },
]

const STATUS_COLORS = {
  pending:     'badge-gray',
  reviewing:   'badge-blue',
  shortlisted: 'badge-purple',
  interview:   'badge-orange',
  offered:     'badge-green',
  rejected:    'badge-red',
  withdrawn:   'badge-gray',
}

function ApplicantCard({ app, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleStatusChange = async (newStatus) => {
    setUpdating(true)
    try {
      const { data } = await applicationsAPI.updateStatus(app.id, { status: newStatus })
      onStatusUpdate(app.id, data)
      toast.success(`Moved to ${newStatus}`)
    } catch {
      toast.error('Could not update status')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-brand-700 font-semibold text-sm">
              {app.candidate.full_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{app.candidate.full_name}</p>
            <p className="text-xs text-gray-500">{app.candidate_profile?.headline || 'No headline'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`badge ${STATUS_COLORS[app.status] || 'badge-gray'}`}>
            {app.status?.replace('_', ' ')}
          </span>
          {app.match_score != null && (
            <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
              <Zap className="w-3 h-3" aria-hidden="true" /> {app.match_score.toFixed(0)}%
            </div>
          )}
        </div>
      </div>

      {app.candidate_profile?.skills?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {app.candidate_profile.skills.slice(0, 5).map(s => (
            <span key={s} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-xs text-gray-600">{s}</span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
        </p>
        <div className="flex items-center gap-2">
          {app.cv_download_url && (
            <a href={app.cv_download_url} target="_blank" rel="noreferrer"
              className="text-xs text-brand-600 hover:underline font-medium">
              View CV
            </a>
          )}
          <button onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
            {expanded ? 'Less' : 'Actions'}
            <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs font-medium text-gray-600 mb-2">Move to:</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.filter(s => s.value && s.value !== app.status && s.value !== 'withdrawn').map(({ value, label }) => (
              <button key={value} onClick={() => handleStatusChange(value)} disabled={updating}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                {label}
              </button>
            ))}
          </div>
          {app.cover_letter && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-600 mb-1">Cover Letter:</p>
              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg line-clamp-4 whitespace-pre-line">
                {app.cover_letter}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function JobRow({ job, onToggle, onDelete }) {
  const [toggling, setToggling] = useState(false)
  const [active, setActive] = useState(job.is_active)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleToggle = async (e) => {
    e.stopPropagation()
    setToggling(true)
    try {
      const { data } = await jobsAPI.toggleActive(job.id)
      setActive(data.is_active)
      toast.success(data.is_active ? 'Job activated' : 'Job paused')
      onToggle?.(job.id, data.is_active)
    } catch {
      toast.error('Could not update job')
    } finally {
      setToggling(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await jobsAPI.delete(job.id)
      toast.success('Job deleted')
      onDelete?.(job.id)
    } catch {
      toast.error('Could not delete job')
    } finally {
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  return (
    <>
      <div className={`card p-4 transition-opacity ${!active ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link to={`/jobs/${job.id}`}
              className="font-semibold text-gray-900 hover:text-brand-600 transition-colors block truncate text-sm">
              {job.title}
            </Link>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>{job.application_count} applicants</span>
              <span>{job.views_count} views</span>
              <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link to={`/recruiter/jobs/${job.id}/edit`}
              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              title="Edit job" aria-label={`Edit ${job.title}`}>
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </Link>
            <button onClick={handleToggle} disabled={toggling}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                active
                  ? 'text-green-700 border-green-200 bg-green-50 hover:bg-green-100'
                  : 'text-gray-500 border-gray-200 bg-gray-50 hover:bg-gray-100'
              } disabled:opacity-50`}
              aria-label={active ? 'Pause job' : 'Activate job'}>
              {active
                ? <><Eye className="w-3.5 h-3.5" aria-hidden="true" /> Active</>
                : <><EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> Paused</>}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(true) }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              aria-label={`Delete ${job.title}`}>
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirm}
        title="Delete this job?"
        message={`"${job.title}" will be removed from listings. Any applications already submitted will be preserved in your records.`}
        confirmLabel="Delete Job"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
        loading={deleting}
        danger
      />
    </>
  )
}

export default function RecruiterDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats]               = useState(null)
  const [jobs, setJobs]                 = useState([])
  const [selectedJob, setSelectedJob]   = useState(null)
  const [applications, setApplications] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loadingApps, setLoadingApps]   = useState(false)
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    Promise.allSettled([
      applicationsAPI.recruiterStats(),
      jobsAPI.myJobs(),
    ]).then(([statsRes, jobsRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      if (jobsRes.status === 'fulfilled') {
        const list = jobsRes.value.data.results || []
        setJobs(list)
        if (list.length > 0) setSelectedJob(list[0])
      }
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedJob) return
    setLoadingApps(true)
    applicationsAPI.jobApplications(
      selectedJob.id,
      statusFilter ? { status: statusFilter } : {}
    )
      .then(({ data }) => setApplications(data.results || []))
      .catch(() => setApplications([]))
      .finally(() => setLoadingApps(false))
  }, [selectedJob, statusFilter])

  const handleAppStatusUpdate = (appId, updated) => {
    setApplications(prev => prev.map(a => a.id === appId ? updated : a))
  }

  const handleJobDelete = (deletedId) => {
    setJobs(prev => {
      const next = prev.filter(j => j.id !== deletedId)
      if (selectedJob?.id === deletedId) setSelectedJob(next[0] || null)
      return next
    })
  }

  const statCards = [
    { label: 'Active Jobs',        value: stats?.active_jobs ?? '—',       icon: Briefcase, color: 'text-brand-600 bg-brand-50' },
    { label: 'Total Applications', value: stats?.total_applications ?? '—', icon: Users,     color: 'text-purple-600 bg-purple-50' },
    { label: 'Shortlisted',        value: stats?.status_breakdown?.shortlisted ?? '—', icon: Star, color: 'text-amber-600 bg-amber-50' },
    { label: 'Offers Made',        value: stats?.status_breakdown?.offered ?? '—', icon: Award, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="page-container py-8">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="section-title">
            {profile?.company_name || user?.full_name} Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage your listings and review applicants</p>
        </div>
        <Link to="/recruiter/post-job" className="btn-primary">
          <PlusCircle className="w-4 h-4" aria-hidden="true" /> Post a Job
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {jobs.length === 0 && !loading ? (
        <div className="card p-16 text-center">
          <Briefcase className="w-14 h-14 text-gray-200 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No jobs posted yet</h2>
          <p className="text-gray-400 mb-6">Post your first job to start receiving applications</p>
          <Link to="/recruiter/post-job" className="btn-primary">
            <PlusCircle className="w-4 h-4" aria-hidden="true" /> Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Your Jobs</h2>
              <Link to="/recruiter/post-job"
                className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" /> New Job
              </Link>
            </div>
            <div className="space-y-2">
              {jobs.map(job => (
                <div key={job.id}
                  className={`cursor-pointer rounded-2xl transition-all ${
                    selectedJob?.id === job.id ? 'ring-2 ring-brand-500' : ''
                  }`}
                  onClick={() => setSelectedJob(job)}>
                  <JobRow
                    job={job}
                    onToggle={(id, active) =>
                      setJobs(prev => prev.map(j => j.id === id ? { ...j, is_active: active } : j))
                    }
                    onDelete={handleJobDelete}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedJob ? (
              <>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedJob.title}</h2>
                    <p className="text-xs text-gray-400">{applications.length} applicants</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.slice(0, 5).map(({ value, label }) => (
                      <button key={value} onClick={() => setStatusFilter(value)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all font-medium ${
                          statusFilter === value
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingApps ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="card p-5 animate-pulse h-24" />
                    ))}
                  </div>
                ) : applications.length === 0 ? (
                  <div className="card p-12 text-center">
                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" aria-hidden="true" />
                    <p className="text-gray-500">
                      {statusFilter ? `No ${statusFilter} applicants` : 'No applications yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map(app => (
                      <ApplicantCard key={app.id} app={app} onStatusUpdate={handleAppStatusUpdate} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="card p-12 text-center">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" aria-hidden="true" />
                <p className="text-gray-400">Select a job to view applicants</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
