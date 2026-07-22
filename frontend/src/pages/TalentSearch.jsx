import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import useDebounce from '../hooks/useDebounce'
import { Search, MapPin, Briefcase, Users, Linkedin, Github, Loader2 } from 'lucide-react'

function CandidateCard({ candidate }) {
  return (
    <Link to={`/recruiter/candidates/${candidate.user_id}`} className="card p-4 block hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
          {candidate.full_name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>{candidate.full_name}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{candidate.headline || 'No headline'}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap" style={{ color: 'var(--text-3)' }}>
            {candidate.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" />{candidate.location}</span>}
            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" aria-hidden="true" />{candidate.experience_years || 0} yrs</span>
            {candidate.linkedin && <Linkedin className="w-3 h-3" aria-hidden="true" />}
            {candidate.github && <Github className="w-3 h-3" aria-hidden="true" />}
          </div>
        </div>
      </div>
      {candidate.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {candidate.skills.slice(0, 6).map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{s}</span>
          ))}
        </div>
      )}
      {candidate.bio && <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-3)' }}>{candidate.bio}</p>}
    </Link>
  )
}

export default function TalentSearch() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState('')
  const [results, setResults] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const debouncedQuery = useDebounce(query, 400)
  const debouncedLocation = useDebounce(location, 400)
  const debouncedSkills = useDebounce(skills, 400)

  // Bump this whenever a new request starts so a slow, stale response that
  // resolves after a newer one can't clobber the newer results.
  const requestId = useRef(0)

  const buildParams = useCallback((pageNum) => {
    const params = { page: pageNum }
    if (debouncedQuery) params.search = debouncedQuery
    if (debouncedLocation) params.location = debouncedLocation
    if (debouncedSkills) params.skills = debouncedSkills
    return params
  }, [debouncedQuery, debouncedLocation, debouncedSkills])

  // Fresh search whenever any filter changes — replaces results, resets to page 1.
  useEffect(() => {
    const thisRequest = ++requestId.current
    setLoading(true)
    setError('')
    authAPI.searchCandidates(buildParams(1))
      .then(({ data }) => {
        if (thisRequest !== requestId.current) return
        setResults(data.results || [])
        setTotalCount(data.count || 0)
        setHasMore(Boolean(data.next))
        setPage(1)
      })
      .catch(() => { if (thisRequest === requestId.current) setError('Could not load candidates.') })
      .finally(() => { if (thisRequest === requestId.current) setLoading(false) })
  }, [buildParams])

  const loadMore = () => {
    const nextPage = page + 1
    const thisRequest = ++requestId.current
    setLoadingMore(true)
    authAPI.searchCandidates(buildParams(nextPage))
      .then(({ data }) => {
        if (thisRequest !== requestId.current) return
        setResults((prev) => [...prev, ...(data.results || [])])
        setHasMore(Boolean(data.next))
        setPage(nextPage)
      })
      .catch(() => { if (thisRequest === requestId.current) setError('Could not load more candidates.') })
      .finally(() => { if (thisRequest === requestId.current) setLoadingMore(false) })
  }

  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#4c1d95)', padding: '32px 0 56px' }}>
        <div className="page-container">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
              <Users className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'rgba(165,180,252,.8)' }}>Sourcing</p>
              <h1 className="font-extrabold text-white" style={{ fontSize: 'clamp(1.25rem,3vw,1.75rem)', letterSpacing: '-.02em' }}>Find Talent</h1>
            </div>
          </div>
          <p className="text-sm mt-2 max-w-xl" style={{ color: 'rgba(255,255,255,.7)' }}>
            Search every candidate who has opted in to being discovered — not just the ones who applied to your jobs.
          </p>
        </div>
      </div>

      <div className="page-container" style={{ marginTop: '-32px', paddingBottom: '40px' }}>
        <div className="card p-4 mb-5">
          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} aria-hidden="true" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="input pl-9" placeholder="Search headline / bio…" aria-label="Search candidates" />
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} aria-hidden="true" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="input pl-9" placeholder="Location, e.g. London" aria-label="Filter by location" />
            </div>
            <input value={skills} onChange={(e) => setSkills(e.target.value)} className="input" placeholder="Skills, comma-separated, e.g. Python, Django" aria-label="Filter by skills" />
          </div>
        </div>

        {loading ? (
          <div className="grid xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" aria-hidden="true" />)}
          </div>
        ) : error ? (
          <div className="card p-12 text-center"><p style={{ color: 'var(--text-2)' }}>{error}</p></div>
        ) : results.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-3)' }} aria-hidden="true" />
            <p style={{ color: 'var(--text-2)' }}>No open-to-work candidates match those filters yet.</p>
          </div>
        ) : (
          <>
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
              Showing {results.length} of {totalCount} candidate{totalCount === 1 ? '' : 's'} open to work
            </p>
            <div className="grid xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((c) => <CandidateCard key={c.user_id} candidate={c} />)}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button onClick={loadMore} disabled={loadingMore} className="btn-secondary disabled:opacity-60">
                  {loadingMore ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Loading…</span>
                  ) : 'Load more candidates'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
