import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Briefcase, Users, Zap, ArrowRight, MapPin, TrendingUp } from 'lucide-react'
import { jobsAPI } from '../services/api'
import JobCard from '../components/JobCard'
import { useAuth } from '../contexts/AuthContext'

const STATS = [
  { label: 'Jobs Posted', value: '2,400+', icon: Briefcase },
  { label: 'Companies Hiring', value: '580+', icon: Users },
  { label: 'AI-Matched', value: '94%', icon: Zap },
]

const CATEGORIES = [
  'Software Engineering', 'Data Science', 'Product Management',
  'Design & UX', 'Marketing', 'Finance', 'Healthcare', 'Sales',
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [recentJobs, setRecentJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { isAuthenticated, isCandidate, isRecruiter } = useAuth()

  useEffect(() => {
    jobsAPI.list({ page_size: 6, ordering: '-created_at' })
      .then(({ data }) => setRecentJobs(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('search', query)
    if (location) params.set('location', location)
    navigate(`/jobs?${params.toString()}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="page-container py-20 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Zap className="w-4 h-4 text-yellow-300" />
              AI-powered job matching
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Find your perfect role,<br />
              <span className="text-brand-200">faster than ever</span>
            </h1>
            <p className="text-lg text-brand-100 mb-10 max-w-xl mx-auto">
              RoleRadius uses TF-IDF matching to surface the jobs that truly fit your skills —
              not just any job, the <em>right</em> job.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Job title, skills, or company"
                  className="w-full pl-11 pr-4 py-3.5 bg-white text-gray-900 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-brand-300 shadow-sm placeholder:text-gray-400"
                />
              </div>
              <div className="relative sm:w-48">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="w-full pl-10 pr-4 py-3.5 bg-white text-gray-900 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-brand-300 shadow-sm placeholder:text-gray-400"
                />
              </div>
              <button type="submit" className="bg-white text-brand-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-brand-50 transition-colors shadow-sm">
                Search
              </button>
            </form>

            {/* Quick links */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['Remote', 'Full Stack', 'Data Science', 'Product Manager'].map((term) => (
                <Link key={term} to={`/jobs?search=${term}`}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-colors">
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-brand-800/50 border-t border-white/10">
          <div className="page-container py-6">
            <div className="flex justify-center gap-12 flex-wrap">
              {STATS.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-brand-300" />
                  <div>
                    <p className="text-xl font-bold text-white">{value}</p>
                    <p className="text-xs text-brand-200">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA for recruiters */}
      {!isAuthenticated && (
        <section className="bg-orange-50 border-b border-orange-100">
          <div className="page-container py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-orange-800 font-medium">
                🏢 Hiring? Post your jobs and reach qualified candidates instantly.
              </p>
              <Link to="/register?role=recruiter"
                className="text-sm font-semibold text-orange-700 hover:text-orange-900 flex items-center gap-1">
                Post a Job <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-14">
        <div className="page-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Browse by Category</h2>
              <p className="text-gray-500 mt-1">Explore thousands of opportunities</p>
            </div>
            <Link to="/jobs" className="btn-secondary text-sm hidden sm:flex">
              View all jobs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <Link key={cat} to={`/jobs?search=${encodeURIComponent(cat)}`}
                className="card p-4 hover:shadow-md hover:border-brand-100 hover:-translate-y-0.5 transition-all duration-200 group">
                <TrendingUp className="w-5 h-5 text-brand-400 mb-2 group-hover:text-brand-600 transition-colors" />
                <p className="text-sm font-medium text-gray-800 group-hover:text-brand-700 transition-colors">{cat}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Jobs */}
      <section className="py-14 bg-gray-50/50 border-t border-gray-100">
        <div className="page-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Latest Opportunities</h2>
              <p className="text-gray-500 mt-1">Fresh roles posted recently</p>
            </div>
            <Link to="/jobs" className="btn-secondary text-sm hidden sm:flex">
              Browse all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentJobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      </section>

      {/* AI Matching CTA */}
      {!isAuthenticated && (
        <section className="py-16 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
          <div className="page-container text-center">
            <Zap className="w-10 h-10 text-yellow-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">AI-powered matching, just for you</h2>
            <p className="text-brand-100 mb-8 max-w-lg mx-auto">
              Create your profile and upload your CV. Our TF-IDF engine instantly surfaces the jobs
              that match your real skills — not just keywords.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/register" className="bg-white text-brand-700 font-semibold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors">
                Get started free
              </Link>
              <Link to="/jobs" className="border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
                Browse jobs first
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
