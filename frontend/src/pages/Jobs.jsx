import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { jobsAPI } from '../services/api'
import JobCard from '../components/JobCard'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'
import useDebounce from '../hooks/useDebounce'

const FILTERS = {
  job_type: [
    { value: '', label: 'All Types' },
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' },
  ],
  work_mode: [
    { value: '', label: 'All Modes' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'onsite', label: 'On-site' },
  ],
  experience_level: [
    { value: '', label: 'All Levels' },
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead / Principal' },
    { value: 'executive', label: 'Executive' },
  ],
}

function FilterChip({ options, value, onChange, label }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={label}
      className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer">
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const [search,    setSearch]    = useState(searchParams.get('search') || '')
  const [jobType,   setJobType]   = useState(searchParams.get('job_type') || '')
  const [workMode,  setWorkMode]  = useState(searchParams.get('work_mode') || '')
  const [expLevel,  setExpLevel]  = useState(searchParams.get('experience_level') || '')
  const [category,  setCategory]  = useState(searchParams.get('category') || '')

  const debouncedSearch = useDebounce(search, 400)

  const PAGE_SIZE = 9
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fetchJobs = useCallback(() => {
    setLoading(true)
    const params = { page, page_size: PAGE_SIZE }
    if (debouncedSearch) params.search = debouncedSearch
    if (jobType)   params.job_type = jobType
    if (workMode)  params.work_mode = workMode
    if (expLevel)  params.experience_level = expLevel
    if (category)  params.category = category

    jobsAPI.list(params)
      .then(({ data }) => { setJobs(data.results || []); setTotal(data.count || 0) })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [page, debouncedSearch, jobType, workMode, expLevel, category])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  // Reset to page 1 on filter/search change
  useEffect(() => { setPage(1) }, [debouncedSearch, jobType, workMode, expLevel, category])

  const clearFilters = () => {
    setSearch(''); setJobType(''); setWorkMode(''); setExpLevel(''); setCategory('')
    setPage(1)
  }
  const hasActiveFilters = debouncedSearch || jobType || workMode || expLevel || category

  return (
    <div className="page-container py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Find Your Next Role</h1>
        <p className="text-gray-500 text-sm mt-1">
          {total > 0 ? `${total} jobs across all industries` : 'Searching...'}
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs, skills, companies..."
            aria-label="Search jobs"
            className="input pl-10"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary px-4 flex items-center gap-2 ${showFilters ? 'ring-2 ring-brand-500' : ''}`}
          aria-expanded={showFilters}
          aria-controls="filter-panel">
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-brand-600" aria-label="Filters active" />
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div id="filter-panel" className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
          <FilterChip options={FILTERS.job_type}          value={jobType}  onChange={setJobType}  label="Job type filter" />
          <FilterChip options={FILTERS.work_mode}         value={workMode} onChange={setWorkMode} label="Work mode filter" />
          <FilterChip options={FILTERS.experience_level}  value={expLevel} onChange={setExpLevel} label="Experience level filter" />
          {category && (
            <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium">
              {category}
              <button onClick={() => setCategory('')} aria-label="Remove category filter">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading jobs">
          {Array(PAGE_SIZE).fill(0).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-56" aria-hidden="true" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No jobs found</h2>
          <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="btn-secondary px-3 py-2 disabled:opacity-40" aria-label="Previous page">
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p
                  if (totalPages <= 7) p = i + 1
                  else if (page <= 4) p = i + 1
                  else if (page >= totalPages - 3) p = totalPages - 6 + i
                  else p = page - 3 + i
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                        page === p ? 'bg-brand-600 text-white' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      aria-label={`Page ${p}`}
                      aria-current={page === p ? 'page' : undefined}>
                      {p}
                    </button>
                  )
                })}
              </div>

              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                className="btn-secondary px-3 py-2 disabled:opacity-40" aria-label="Next page">
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          )}

          <p className="text-center text-xs text-gray-400 mt-3">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} jobs
          </p>
        </>
      )}
    </div>
  )
}
