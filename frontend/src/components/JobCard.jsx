import { Link } from 'react-router-dom'
import { MapPin, Clock, Banknote, Bookmark, BookmarkCheck, Building2, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { jobsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const JOB_TYPE_COLORS = {
  full_time: 'badge-blue',
  part_time: 'badge-purple',
  contract: 'badge-orange',
  freelance: 'badge-orange',
  internship: 'badge-green',
}

const WORK_MODE_COLORS = {
  remote: 'badge-green',
  hybrid: 'badge-blue',
  onsite: 'badge-gray',
}

export default function JobCard({ job, onSaveToggle, showScore = false }) {
  const { isAuthenticated, isCandidate } = useAuth()
  const [saved, setSaved] = useState(job.is_saved)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isAuthenticated || !isCandidate) { return }
    setSaving(true)
    try {
      const { data } = await jobsAPI.saveJob(job.id)
      setSaved(data.saved)
      toast.success(data.saved ? 'Job saved!' : 'Removed from saved')
      onSaveToggle?.(job.id, data.saved)
    } catch {
      toast.error('Could not save job')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Link to={`/jobs/${job.id}`}
      className="card hover:shadow-md hover:border-brand-100 transition-all duration-200 block animate-fade-in group">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Company logo / icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
            {job.company_logo ? (
              <img src={job.company_logo} alt={job.company_name} className="w-full h-full object-contain p-1" />
            ) : (
              <Building2 className="w-6 h-6 text-gray-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors leading-tight">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{job.company_name}</p>
              </div>
              {isCandidate && (
                <button onClick={handleSave} disabled={saving}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-600 transition-colors"
                  aria-label={saved ? 'Unsave job' : 'Save job'}>
                  {saved
                    ? <BookmarkCheck className="w-5 h-5 text-brand-600" />
                    : <Bookmark className="w-5 h-5" />
                  }
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Match score badge */}
        {showScore && job.match_score != null && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" />
              {job.match_score.toFixed(0)}% match
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`badge ${JOB_TYPE_COLORS[job.job_type] || 'badge-gray'}`}>
            {job.job_type?.replace('_', ' ')}
          </span>
          <span className={`badge ${WORK_MODE_COLORS[job.work_mode] || 'badge-gray'}`}>
            {job.work_mode}
          </span>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          {(job.salary_min || job.salary_max) && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Banknote className="w-4 h-4 flex-shrink-0" />
              <span>{job.salary_display}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Skills */}
        {job.skills_required?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills_required.slice(0, 4).map((skill) => (
              <span key={skill} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600">
                {skill}
              </span>
            ))}
            {job.skills_required.length > 4 && (
              <span className="px-2 py-0.5 text-xs text-gray-400">
                +{job.skills_required.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Applied indicator */}
      {job.has_applied && (
        <div className="px-5 py-2.5 bg-green-50 border-t border-green-100 rounded-b-2xl">
          <p className="text-xs font-medium text-green-700">✓ Applied</p>
        </div>
      )}
    </Link>
  )
}
