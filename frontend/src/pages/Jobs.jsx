import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { jobsAPI } from '../services/api'
import JobCard from '../components/JobCard'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react'
import useDebounce from '../hooks/useDebounce'

const JOB_TYPES = [
  {v:'',label:'All Types'},{v:'full_time',label:'Full-time'},{v:'part_time',label:'Part-time'},
  {v:'contract',label:'Contract'},{v:'freelance',label:'Freelance'},{v:'internship',label:'Internship'},
]
const WORK_MODES = [{v:'',label:'All Modes'},{v:'remote',label:'Remote'},{v:'hybrid',label:'Hybrid'},{v:'onsite',label:'On-site'}]
const EXP_LEVELS  = [{v:'',label:'All Levels'},{v:'entry',label:'Entry Level'},{v:'mid',label:'Mid Level'},{v:'senior',label:'Senior'},{v:'lead',label:'Lead'},{v:'executive',label:'Executive'}]

function Select({value, onChange, options, label}) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} aria-label={label}
      className="text-sm font-medium px-3 py-2.5 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 transition-all"
      style={{borderColor:'var(--border)',background:'var(--surface)',color:'var(--text-2)','--tw-ring-color':'rgba(99,102,241,.25)'}}>
      {options.map(o=><option key={o.v} value={o.v}>{o.label}</option>)}
    </select>
  )
}

export default function Jobs() {
  const [searchParams] = useSearchParams()
  const [jobs, setJobs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [search,   setSearch]   = useState(searchParams.get('search')||'')
  const [jobType,  setJobType]  = useState(searchParams.get('job_type')||'')
  const [workMode, setWorkMode] = useState(searchParams.get('work_mode')||'')
  const [expLevel, setExpLevel] = useState(searchParams.get('experience_level')||'')
  const [category, setCategory] = useState(searchParams.get('category')||'')
  const debSearch = useDebounce(search, 400)
  const PAGE_SIZE   = 9
  const totalPages  = Math.ceil(total / PAGE_SIZE)
  const hasFilters  = debSearch||jobType||workMode||expLevel||category

  const fetchJobs = useCallback(()=>{
    setLoading(true)
    const p = {page, page_size:PAGE_SIZE}
    if (debSearch) p.search = debSearch
    if (jobType)   p.job_type = jobType
    if (workMode)  p.work_mode = workMode
    if (expLevel)  p.experience_level = expLevel
    if (category)  p.category = category
    jobsAPI.list(p)
      .then(({data})=>{ setJobs(data.results||[]); setTotal(data.count||0) })
      .catch(()=>setJobs([]))
      .finally(()=>setLoading(false))
  }, [page,debSearch,jobType,workMode,expLevel,category])

  useEffect(()=>{ fetchJobs() },[fetchJobs])
  useEffect(()=>{ setPage(1) },[debSearch,jobType,workMode,expLevel,category])
  const clear = () => { setSearch(''); setJobType(''); setWorkMode(''); setExpLevel(''); setCategory(''); setPage(1) }

  return (
    <div style={{background:'var(--surface-2)',minHeight:'100vh'}}>
      <div style={{background:'white',borderBottom:'1px solid var(--border)'}}>
        <div className="page-container py-5">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
            <div>
              <h1 className="page-title">Find Your Next Role</h1>
              <p className="text-sm mt-1" style={{color:'var(--text-2)'}}>
                {total > 0 ? <><span className="font-bold" style={{color:'var(--primary)'}}>{total}</span> jobs across all industries</> : 'Loading…'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{color:'var(--text-3)'}} aria-hidden="true"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} aria-label="Search jobs"
                placeholder="Search jobs, skills, companies, industries…" className="input pl-10" style={{background:'var(--surface-2)'}} />
              {search && (
                <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Clear search" style={{color:'var(--text-3)'}}>
                  <X className="w-3.5 h-3.5"/>
                </button>
              )}
            </div>
            <button onClick={()=>setShowFilters(!showFilters)} aria-expanded={showFilters}
              className="btn-secondary flex items-center gap-2 relative"
              style={showFilters ? {borderColor:'var(--primary)',color:'var(--primary)',background:'var(--primary-light)'} : {}}>
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true"/>
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary-500" aria-label="Filters active"/>}
            </button>
          </div>
          {showFilters && (
            <div className="flex flex-wrap gap-2 items-center mt-3 pt-3 border-t animate-fade-up" style={{borderColor:'var(--border)'}}>
              <Select value={jobType}  onChange={setJobType}  options={JOB_TYPES}  label="Job type"/>
              <Select value={workMode} onChange={setWorkMode} options={WORK_MODES} label="Work mode"/>
              <Select value={expLevel} onChange={setExpLevel} options={EXP_LEVELS} label="Experience level"/>
              {category && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold" style={{background:'var(--primary-light)',color:'var(--primary)'}}>
                  {category}
                  <button onClick={()=>setCategory('')} aria-label="Remove category filter"><X className="w-3.5 h-3.5"/></button>
                </div>
              )}
              {hasFilters && (
                <button onClick={clear} className="flex items-center gap-1 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors ml-1">
                  <X className="w-3.5 h-3.5"/> Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="page-container py-6">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
            {Array(PAGE_SIZE).fill(0).map((_,i)=><div key={i} className="skeleton h-64 rounded-2xl" aria-hidden="true"/>)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:'var(--surface-2)'}}>
              <Briefcase className="w-8 h-8" style={{color:'var(--text-3)'}} aria-hidden="true"/>
            </div>
            <h2 className="font-bold text-lg mb-2" style={{color:'var(--text-1)'}}>No jobs found</h2>
            <p className="text-sm mb-5" style={{color:'var(--text-2)'}}>Try a different search or clear your filters</p>
            {hasFilters && <button onClick={clear} className="btn-primary">Clear filters</button>}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
              {jobs.map(job=><JobCard key={job.id} job={job}/>)}
            </div>
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Pagination">
                <button onClick={()=>setPage(p=>p-1)} disabled={page===1} className="btn-secondary px-3 py-2.5 disabled:opacity-40" aria-label="Previous page">
                  <ChevronLeft className="w-4 h-4"/>
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
                    let p
                    if (totalPages<=7) p=i+1
                    else if (page<=4)  p=i+1
                    else if (page>=totalPages-3) p=totalPages-6+i
                    else p=page-3+i
                    return (
                      <button key={p} onClick={()=>setPage(p)} aria-label={`Page ${p}`} aria-current={page===p?'page':undefined}
                        className="w-9 h-9 rounded-xl text-sm font-semibold transition-all"
                        style={page===p ? {background:'var(--primary)',color:'white',boxShadow:'0 2px 8px rgba(99,102,241,.4)'} : {color:'var(--text-2)'}}>
                        {p}
                      </button>
                    )
                  })}
                </div>
                <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} className="btn-secondary px-3 py-2.5 disabled:opacity-40" aria-label="Next page">
                  <ChevronRight className="w-4 h-4"/>
                </button>
              </nav>
            )}
            <p className="text-center text-xs mt-3" style={{color:'var(--text-3)'}}>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,total)} of {total} jobs</p>
          </>
        )}
      </div>
    </div>
  )
}
