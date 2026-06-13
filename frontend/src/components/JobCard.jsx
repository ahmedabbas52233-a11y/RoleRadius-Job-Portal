import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Banknote, Bookmark, BookmarkCheck, Zap, Building2 } from 'lucide-react'
import { jobsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const JOB_TYPE_LABELS = {
  full_time: 'Full-time', part_time: 'Part-time',
  contract: 'Contract', freelance: 'Freelance', internship: 'Internship',
}
const WORK_MODE_LABELS = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' }
const WORK_MODE_COLORS = {
  remote:  'badge-green',
  hybrid:  'badge-blue',
  onsite:  'badge-gray',
}

export default function JobCard({ job, onSaveToggle }) {
  const { isAuthenticated, isCandidate } = useAuth()
  const [saved, setSaved] = useState(job.is_saved || false)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) { toast.error('Sign in to save jobs'); return }
    if (!isCandidate) { toast.error('Only candidates can save jobs'); return }
    setSaving(true)
    try {
      await jobsAPI.saveJob(job.id)
      const newSaved = !saved
      setSaved(newSaved)
      toast.success(newSaved ? 'Job saved' : 'Removed from saved')
      onSaveToggle?.(job.id, newSaved)
    } catch {
      toast.error('Could not save job')
    } finally {
      setSaving(false)
    }
  }

  const salary = job.salary_display || (
    job.salary_min && job.salary_max
      ? `£${job.salary_min.toLocaleString()} – £${job.salary_max.toLocaleString()}`
      : job.salary_min
        ? `From £${job.salary_min.toLocaleString()}`
        : 'Competitive'
  )

  return (
    <article className="card p-4 sm:p-5 group">
      <div className="flex items-start justify-between gap-3">
        {/* Company logo placeholder */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
          {job.company_logo
            ? <img src={job.company_logo} alt={`${job.company_name} logo`} className="w-8 h-8 object-contain rounded-lg" />
            : <Building2 className="w-5 h-5 text-gray-300" aria-hidden="true" />}
        </div>

        <div className="flex-1 min-w-0">
          <Link to={`/jobs/${job.id}`}
            className="card-title hover:text-brand-600 transition-colors line-clamp-2 block">
            {job.title}
          </Link>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{job.company_name}</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
            saved ? 'text-brand-600 bg-brand-50' : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50'
          } disabled:opacity-50`}
          aria-label={saved ? `Unsave ${job.title}` : `Save ${job.title}`}
          aria-pressed={saved}>
          {saved
            ? <BookmarkCheck className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            : <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />}
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        <span className={`badge ${WORK_MODE_COLORS[job.work_mode] || 'badge-gray'}`}>
          {WORK_MODE_LABELS[job.work_mode] || job.work_mode}
        </span>
        <span className="badge badge-gray">
          {JOB_TYPE_LABELS[job.job_type] || job.job_type}
        </span>
        {job.category && (
          <span className="badge badge-gray">{job.category}</span>
        )}
        {job.match_score != null && (
          <span className="badge badge-green flex items-center gap-1">
            <Zap className="w-3 h-3" aria-hidden="true" />
            {Math.round(job.match_score)}% match
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {job.location}
        </span>
        <span className="flex items-center gap-1">
          <Banknote className="w-3.5 h-3.5" aria-hidden="true" /> {salary}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Skills preview — hidden on very small screens */}
      {job.skills_required?.length > 0 && (
        <div className="hidden xs:flex flex-wrap gap-1.5 mt-3">
          {job.skills_required.slice(0, 4).map(skill => (
            <span key={skill} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-xs text-gray-600">
              {skill}
            </span>
          ))}
          {job.skills_required.length > 4 && (
            <span className="px-2 py-0.5 text-xs text-gray-400">+{job.skills_required.length - 4} more</span>
          )}
        </div>
      )}

      <Link to={`/jobs/${job.id}`}
        className="mt-4 btn-secondary w-full justify-center text-sm py-2">
        View Job
      </Link>
    </article>
  )
}
