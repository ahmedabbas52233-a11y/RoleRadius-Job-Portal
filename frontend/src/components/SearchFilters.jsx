import { useState, useEffect } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'

const JOB_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
]

const EXPERIENCE_LEVELS = [
  { value: '', label: 'All Levels' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'lead', label: 'Lead / Principal' },
  { value: 'executive', label: 'Executive' },
]

const WORK_MODES = [
  { value: '', label: 'All Modes' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]

export default function SearchFilters({ filters, onChange }) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [showMobile, setShowMobile] = useState(false)

  useEffect(() => { setLocalFilters(filters) }, [filters])

  const update = (key, value) => {
    const updated = { ...localFilters, [key]: value }
    setLocalFilters(updated)
    onChange(updated)
  }

  const clearAll = () => {
    const cleared = { search: '', job_type: '', experience_level: '', work_mode: '', location: '', salary_min: '', salary_max: '' }
    setLocalFilters(cleared)
    onChange(cleared)
  }

  const hasActiveFilters = Object.entries(localFilters).some(([k, v]) => k !== 'search' && v)

  const FilterPanel = () => (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <label className="label">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Job title, skills, company…"
            value={localFilters.search || ''}
            onChange={(e) => update('search', e.target.value)}
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="label">Location</label>
        <input
          type="text"
          className="input"
          placeholder="City, country, or remote"
          value={localFilters.location || ''}
          onChange={(e) => update('location', e.target.value)}
        />
      </div>

      {/* Job type */}
      <div>
        <label className="label">Job Type</label>
        <div className="space-y-1.5">
          {JOB_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="job_type"
                value={value}
                checked={localFilters.job_type === value}
                onChange={() => update('job_type', value)}
                className="accent-brand-600 w-4 h-4"
              />
              <span className={`text-sm ${localFilters.job_type === value ? 'text-brand-700 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div>
        <label className="label">Experience Level</label>
        <select
          className="input"
          value={localFilters.experience_level || ''}
          onChange={(e) => update('experience_level', e.target.value)}
        >
          {EXPERIENCE_LEVELS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Work mode */}
      <div>
        <label className="label">Work Mode</label>
        <div className="flex flex-wrap gap-2">
          {WORK_MODES.filter(m => m.value).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update('work_mode', localFilters.work_mode === value ? '' : value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                localFilters.work_mode === value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Salary range */}
      <div>
        <label className="label">Salary Range (£)</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            className="input"
            placeholder="Min"
            value={localFilters.salary_min || ''}
            onChange={(e) => update('salary_min', e.target.value)}
          />
          <span className="text-gray-400 text-sm flex-shrink-0">–</span>
          <input
            type="number"
            className="input"
            placeholder="Max"
            value={localFilters.salary_max || ''}
            onChange={(e) => update('salary_max', e.target.value)}
          />
        </div>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button onClick={clearAll} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium">
          <X className="w-4 h-4" /> Clear filters
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button onClick={() => setShowMobile(!showMobile)} className="btn-secondary w-full justify-center">
          <SlidersHorizontal className="w-4 h-4" />
          Filters {hasActiveFilters && <span className="ml-1 bg-brand-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
        </button>
        {showMobile && (
          <div className="mt-3 card p-5">
            <FilterPanel />
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block card p-5 sticky top-24">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Clear all
            </button>
          )}
        </div>
        <FilterPanel />
      </div>
    </>
  )
}
