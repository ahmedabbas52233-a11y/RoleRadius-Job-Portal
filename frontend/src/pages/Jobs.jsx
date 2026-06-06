import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { jobsAPI } from '../services/api'
import JobCard from '../components/JobCard'
import SearchFilters from '../components/SearchFilters'
import { Loader2, SearchX } from 'lucide-react'
import { useDebounce } from '../hooks/useDebounce'

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const initialFilters = {
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    job_type: searchParams.get('job_type') || '',
    experience_level: searchParams.get('experience_level') || '',
    work_mode: searchParams.get('work_mode') || '',
    salary_min: searchParams.get('salary_min') || '',
    salary_max: searchParams.get('salary_max') || '',
  }

  const [filters, setFilters] = useState(initialFilters)
  const debouncedFilters = useDebounce(filters, 400)

  const fetchJobs = useCallback(async (currentFilters, currentPage = 1, append = false) => {
    setLoading(true)
    try {
      const params = { page: currentPage }
      Object.entries(currentFilters).forEach(([k, v]) => { if (v) params[k] = v })
      const { data } = await jobsAPI.list(params)
      const results = data.results || []
      setJobs(append ? prev => [...prev, ...results] : results)
      setCount(data.count || 0)
      setHasMore(!!data.next)
    } catch {
      setJobs(append ? prev => prev : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    fetchJobs(debouncedFilters, 1, false)
    // Sync URL params
    const params = {}
    Object.entries(debouncedFilters).forEach(([k, v]) => { if (v) params[k] = v })
    setSearchParams(params, { replace: true })
  }, [debouncedFilters, fetchJobs])

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    fetchJobs(debouncedFilters, next, true)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="section-title">Browse Jobs</h1>
        <p className="text-gray-500 mt-1">
          {loading ? 'Searching…' : `${count.toLocaleString()} opportunities found`}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className="w-64 flex-shrink-0">
          <SearchFilters filters={filters} onChange={handleFilterChange} />
        </aside>

        {/* Job list */}
        <div className="flex-1 min-w-0">
          {loading && jobs.length === 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="card p-12 text-center">
              <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No jobs match your filters</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or clearing filters</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                {jobs.map((job) => <JobCard key={job.id} job={job} />)}
              </div>

              {loading && (
                <div className="flex justify-center mt-8">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
              )}

              {hasMore && !loading && (
                <div className="flex justify-center mt-8">
                  <button onClick={handleLoadMore} className="btn-secondary">
                    Load more jobs
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
