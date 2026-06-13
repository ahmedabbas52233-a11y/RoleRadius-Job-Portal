import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { jobsAPI } from '../services/api'
import JobCard from '../components/JobCard'
import { Search, Briefcase, Users, Zap, ArrowRight, Star, Building2 } from 'lucide-react'

const CATEGORIES = [
  { label: 'Software Engineering', icon: '💻', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { label: 'Data Science',         icon: '📊', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { label: 'Design & UX',         icon: '🎨', color: 'bg-pink-50 text-pink-700 border-pink-100' },
  { label: 'Marketing',           icon: '📢', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  { label: 'Healthcare Technology', icon: '🏥', color: 'bg-green-50 text-green-700 border-green-100' },
  { label: 'Finance & Fintech',   icon: '💰', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { label: 'Hospitality & Tourism', icon: '🏨', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { label: 'Legal Services',      icon: '⚖️', color: 'bg-slate-50 text-slate-700 border-slate-100' },
  { label: 'Gaming',              icon: '🎮', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { label: 'Retail & E-commerce', icon: '🛍️', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  { label: 'Charity & Non-profit', icon: '💚', color: 'bg-teal-50 text-teal-700 border-teal-100' },
  { label: 'Architecture & Construction', icon: '🏗️', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  { label: 'Media & Journalism',  icon: '📰', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  { label: 'Sustainability',      icon: '🌱', color: 'bg-lime-50 text-lime-700 border-lime-100' },
  { label: 'Education Technology', icon: '📚', color: 'bg-violet-50 text-violet-700 border-violet-100' },
  { label: 'DevOps & Infrastructure', icon: '⚙️', color: 'bg-gray-50 text-gray-700 border-gray-100' },
]

const STATS = [
  { value: '108+', label: 'Live Jobs', icon: Briefcase },
  { value: '14',   label: 'Companies', icon: Building2 },
  { value: 'AI',   label: 'Powered Matching', icon: Zap },
  { value: '8',    label: 'Industry Sectors', icon: Star },
]

export default function Home() {
  const [search, setSearch] = useState('')
  const [latestJobs, setLatestJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)

  useEffect(() => {
    jobsAPI.list({ page_size: 6, ordering: '-created_at' })
      .then(({ data }) => setLatestJobs(data.results || []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) window.location.href = `/jobs?search=${encodeURIComponent(search.trim())}`
  }

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-800 text-white">
        <div className="page-container py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" aria-hidden="true" /> AI-powered job matching
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
            Find Your Perfect Role<br className="hidden sm:block" /> with AI Matching
          </h1>
          <p className="text-base sm:text-xl text-white/80 max-w-2xl mx-auto mb-8 sm:mb-10 px-4">
            Upload your CV and get a personalised match score for every job — across tech, healthcare, retail, law, hospitality, and more.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto px-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="Job title, skill, or company..."
                aria-label="Search jobs"
              />
            </div>
            <button type="submit" className="px-5 sm:px-8 py-3 rounded-xl bg-white text-brand-700 font-semibold text-sm sm:text-base hover:bg-gray-50 transition-colors whitespace-nowrap">
              Search
            </button>
          </form>

          <p className="text-white/60 text-sm mt-4">
            108+ jobs across 14 companies · All industries
          </p>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100" aria-label="Platform statistics">
        <div className="page-container py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 text-center">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mb-1">
                  <Icon className="w-5 h-5 text-brand-600" aria-hidden="true" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</span>
                <span className="text-xs sm:text-sm text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section className="page-container py-12 sm:py-16" aria-label="Browse by category">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="section-title">Browse by Category</h2>
            <p className="text-gray-500 text-sm mt-1">Explore opportunities across every industry</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map(({ label, icon, color }) => (
            <Link key={label}
              to={`/jobs?category=${encodeURIComponent(label)}`}
              className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border ${color} hover:shadow-sm transition-all duration-150 active:scale-95 text-sm font-medium`}>
              <span className="text-xl sm:text-2xl" aria-hidden="true">{icon}</span>
              <span className="leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Latest Jobs ──────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-12 sm:py-16" aria-label="Latest job opportunities">
        <div className="page-container">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="section-title">Latest Opportunities</h2>
              <p className="text-gray-500 text-sm mt-1">Fresh roles posted recently</p>
            </div>
            <Link to="/jobs" className="btn-secondary text-sm hidden sm:flex">
              Browse all <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {loadingJobs ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse h-52" aria-hidden="true" />
              ))}
            </div>
          ) : latestJobs.length === 0 ? (
            <div className="card p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" aria-hidden="true" />
              <p className="text-gray-500 mb-4">No jobs yet — run the seed command to populate demo data.</p>
              <code className="text-xs bg-gray-100 px-3 py-2 rounded-lg text-gray-600 block max-w-xs mx-auto">
                python manage.py seed_jobs
              </code>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link to="/jobs" className="btn-primary w-full justify-center">
              View all jobs <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="page-container py-12 sm:py-16">
        <div className="bg-gradient-to-r from-brand-600 to-emerald-700 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to find your perfect role?</h2>
          <p className="text-white/80 mb-8 text-sm sm:text-base max-w-xl mx-auto">
            Create your profile, upload your CV, and let our AI match you with jobs that fit your skills.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="px-8 py-3 bg-white text-brand-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Create Free Account
            </Link>
            <Link to="/jobs" className="px-8 py-3 bg-white/15 text-white rounded-xl font-semibold hover:bg-white/25 transition-colors border border-white/20">
              Browse Jobs First
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
