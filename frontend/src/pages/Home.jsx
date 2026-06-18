import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { jobsAPI } from '../services/api'
import JobCard from '../components/JobCard'
import { Search, ArrowRight, Zap, Shield, TrendingUp, Star, CheckCircle } from 'lucide-react'

const CATEGORIES = [
  {label:'Software Engineering', emoji:'💻', gradient:'linear-gradient(135deg,#6366f1,#8b5cf6)'},
  {label:'Data Science',         emoji:'📊', gradient:'linear-gradient(135deg,#8b5cf6,#a855f7)'},
  {label:'Design & UX',         emoji:'🎨', gradient:'linear-gradient(135deg,#ec4899,#f43f5e)'},
  {label:'Marketing',           emoji:'📢', gradient:'linear-gradient(135deg,#f59e0b,#ef4444)'},
  {label:'Healthcare Technology',emoji:'🏥', gradient:'linear-gradient(135deg,#10b981,#06b6d4)'},
  {label:'Finance & Fintech',   emoji:'💰', gradient:'linear-gradient(135deg,#06b6d4,#3b82f6)'},
  {label:'Hospitality & Tourism',emoji:'🏨', gradient:'linear-gradient(135deg,#f59e0b,#fb923c)'},
  {label:'Legal Services',      emoji:'⚖️', gradient:'linear-gradient(135deg,#64748b,#475569)'},
  {label:'Gaming',              emoji:'🎮', gradient:'linear-gradient(135deg,#6366f1,#ec4899)'},
  {label:'Retail & E-commerce', emoji:'🛍️', gradient:'linear-gradient(135deg,#f43f5e,#f59e0b)'},
  {label:'Charity & Non-profit',emoji:'💚', gradient:'linear-gradient(135deg,#10b981,#84cc16)'},
  {label:'Architecture & Construction',emoji:'🏗️',gradient:'linear-gradient(135deg,#78716c,#a8a29e)'},
  {label:'Media & Journalism',  emoji:'📰', gradient:'linear-gradient(135deg,#0ea5e9,#6366f1)'},
  {label:'Sustainability',      emoji:'🌱', gradient:'linear-gradient(135deg,#22c55e,#10b981)'},
  {label:'Education Technology',emoji:'📚', gradient:'linear-gradient(135deg,#8b5cf6,#6366f1)'},
  {label:'DevOps & Infrastructure',emoji:'⚙️',gradient:'linear-gradient(135deg,#374151,#6366f1)'},
]
const FEATURES = [
  {icon:Zap,    title:'AI Match Score',   desc:'Every job gets a 0–100% compatibility score based on your CV and skills.', color:'#6366f1'},
  {icon:Shield, title:'Verified Roles',   desc:'108+ real jobs across 14 companies spanning 8 diverse industries.', color:'#10b981'},
  {icon:TrendingUp,title:'Career Growth', desc:'From internships to executive roles — find where you fit right now.', color:'#f59e0b'},
]
const TRUSTEDBY = ['TechCorp','DataVentures','HealthTech UK','FinanceHub','LearnPath','EcoSystems','PixelForge','CreativeAgency']

export default function Home() {
  const [search, setSearch]   = useState('')
  const [latest, setLatest]   = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState({jobs:0, companies:0})

  useEffect(() => {
    jobsAPI.list({page_size:6, ordering:'-created_at'})
      .then(({data}) => { setLatest(data.results||[]); setStats({jobs:data.count||0,companies:14}) })
      .catch(()=>{})
      .finally(()=>setLoading(false))
  },[])

  const handleSearch = e => {
    e.preventDefault()
    if (search.trim()) window.location.href = `/jobs?search=${encodeURIComponent(search.trim())}`
  }

  return (
    <div>
      <section className="relative overflow-hidden" style={{background:'linear-gradient(135deg,#1e1b4b 0%,#312e81 35%,#4c1d95 65%,#6d28d9 100%)'}}>
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{position:'absolute',top:'-80px',right:'-80px',width:'400px',height:'400px',borderRadius:'50%',background:'rgba(99,102,241,.25)',filter:'blur(60px)'}} />
          <div style={{position:'absolute',bottom:'-60px',left:'-60px',width:'300px',height:'300px',borderRadius:'50%',background:'rgba(168,85,247,.2)',filter:'blur(50px)'}} />
          <div style={{position:'absolute',top:'40%',left:'45%',width:'200px',height:'200px',borderRadius:'50%',background:'rgba(236,72,153,.15)',filter:'blur(40px)'}} />
        </div>
        <div className="page-container py-20 sm:py-28 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-semibold"
            style={{background:'rgba(255,255,255,.1)',color:'rgba(255,255,255,.9)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,.15)'}}>
            <Zap className="w-4 h-4 text-yellow-300" aria-hidden="true" /> AI-powered job matching — free forever
          </div>
          <h1 className="font-extrabold leading-tight mb-5 text-white px-4" style={{fontSize:'clamp(2rem,6vw,3.5rem)',letterSpacing:'-.03em'}}>
            Your dream job is<br/>
            <span style={{background:'linear-gradient(135deg,#a5b4fc,#f9a8d4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
              closer than you think
            </span>
          </h1>
          <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto px-4" style={{color:'rgba(255,255,255,.75)'}}>
            Upload your CV and get instant AI match scores across 108 jobs in tech, law, healthcare, hospitality, retail, gaming and more.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto px-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{color:'rgba(99,102,241,.6)'}} aria-hidden="true" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Job title, skill, or industry..." aria-label="Search jobs"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg" />
            </div>
            <button type="submit" className="px-6 py-3.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all"
              style={{background:'linear-gradient(135deg,#818cf8,#a855f7)',color:'white',boxShadow:'0 4px 16px rgba(129,140,248,.5)'}}>
              Search
            </button>
          </form>
          <div className="flex flex-wrap justify-center gap-2 px-4">
            {['Python','React','Remote','Internship','Healthcare','Finance'].map(tag => (
              <Link key={tag} to={`/jobs?search=${tag}`} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{background:'rgba(255,255,255,.1)',color:'rgba(255,255,255,.85)',border:'1px solid rgba(255,255,255,.15)'}}>
                {tag}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-10 px-4">
            {[{n:stats.jobs||'108+',label:'Live jobs'},{n:'14',label:'Companies'},{n:'8',label:'Industries'},{n:'AI',label:'Matching'}].map(({n,label}) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-extrabold text-white">{n}</div>
                <div className="text-xs mt-0.5" style={{color:'rgba(255,255,255,.6)'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-b" style={{borderColor:'var(--border)'}} aria-label="Companies using RoleRadius">
        <div className="page-container py-6">
          <p className="text-center text-xs font-semibold mb-4" style={{color:'var(--text-3)',letterSpacing:'.08em',textTransform:'uppercase'}}>Featuring roles from</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            {TRUSTEDBY.map(co => <span key={co} className="text-sm font-semibold" style={{color:'var(--text-3)'}}>{co}</span>)}
          </div>
        </div>
      </section>

      <section className="page-container py-16 sm:py-20" aria-label="Key features">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full text-xs font-semibold" style={{background:'var(--primary-light)',color:'var(--primary)'}}>
            <Star className="w-3.5 h-3.5" aria-hidden="true" /> Why RoleRadius
          </div>
          <h2 className="section-title mb-3">Not just another job board</h2>
          <p className="max-w-xl mx-auto" style={{color:'var(--text-2)'}}>
            We use the same text similarity algorithm as document search engines — applied to recruitment — so you see exactly why you fit a role.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 stagger">
          {FEATURES.map(({icon:Icon, title, desc, color}) => (
            <div key={title} className="card card-hover-lift p-6 text-center animate-fade-up">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:`${color}15`}}>
                <Icon className="w-7 h-7" style={{color}} aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base mb-2" style={{color:'var(--text-1)'}}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{color:'var(--text-2)'}}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{background:'var(--surface-2)'}} aria-label="Browse by industry">
        <div className="page-container py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="section-title mb-2">Every industry. Every role.</h2>
            <p style={{color:'var(--text-2)'}}>From gaming studios to law firms — opportunities everywhere.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES.map(({label, emoji, gradient}) => (
              <Link key={label} to={`/jobs?category=${encodeURIComponent(label)}`}
                className="group relative overflow-hidden rounded-xl p-4 flex items-center gap-3 transition-all duration-200 hover:scale-105 hover:shadow-card-md"
                style={{background:'var(--surface)',border:'1px solid var(--border)'}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{background:gradient}}>{emoji}</div>
                <span className="text-sm font-semibold leading-tight" style={{color:'var(--text-1)'}}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-16 sm:py-20" aria-label="Latest jobs">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{background:'var(--primary-light)',color:'var(--primary)'}}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" /> New today
            </div>
            <h2 className="section-title">Latest Opportunities</h2>
          </div>
          <Link to="/jobs" className="btn-secondary text-sm hidden sm:flex items-center gap-2">View all <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array(6).fill(0).map((_,i)=><div key={i} className="skeleton h-56 rounded-2xl" aria-hidden="true" />)}</div>
        ) : latest.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-sm mb-3" style={{color:'var(--text-2)'}}>No jobs yet.</p>
            <code className="text-xs px-3 py-2 rounded-lg" style={{background:'var(--surface-3)',color:'var(--text-2)'}}>python manage.py seed_jobs</code>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">{latest.map(job => <JobCard key={job.id} job={job} />)}</div>
        )}
        <div className="mt-8 text-center sm:hidden">
          <Link to="/jobs" className="btn-primary w-full justify-center">View all jobs <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
        </div>
      </section>

      <section style={{background:'var(--surface-2)'}} aria-label="How RoleRadius works">
        <div className="page-container py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="section-title mb-2">How it works</h2>
            <p style={{color:'var(--text-2)'}}>Three steps from sign-up to your perfect match.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 relative">
            {[
              {step:'01', title:'Create profile', desc:'Add your skills, headline, and upload your CV in PDF, DOCX, or TXT format.', color:'#6366f1'},
              {step:'02', title:'AI scores every job', desc:'Our TF-IDF engine computes a compatibility score for every active listing instantly.', color:'#8b5cf6'},
              {step:'03', title:'Apply with confidence', desc:'See your match score before applying. Focus your energy where you fit best.', color:'#a855f7'},
            ].map(({step, title, desc, color}, i) => (
              <div key={step} className="relative">
                {i < 2 && <div aria-hidden="true" className="hidden sm:block absolute top-8 left-full w-full h-0.5 z-0" style={{background:'linear-gradient(to right,var(--border),transparent)',transform:'translateX(-50%)'}} />}
                <div className="card p-6 relative z-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-base mb-4" style={{background:color}}>{step}</div>
                  <h3 className="font-bold mb-2" style={{color:'var(--text-1)'}}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{color:'var(--text-2)'}}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-12 sm:py-16">
        <div className="rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden" style={{background:'linear-gradient(135deg,#1e1b4b,#4c1d95,#6d28d9)'}}>
          <div aria-hidden="true" style={{position:'absolute',top:'-40px',right:'-40px',width:'250px',height:'250px',borderRadius:'50%',background:'rgba(168,85,247,.3)',filter:'blur(50px)'}} />
          <div aria-hidden="true" style={{position:'absolute',bottom:'-30px',left:'-30px',width:'200px',height:'200px',borderRadius:'50%',background:'rgba(99,102,241,.25)',filter:'blur(40px)'}} />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              {[CheckCircle,CheckCircle,CheckCircle].map((Icon,i)=><Icon key={i} className="w-5 h-5 text-green-400" aria-hidden="true" />)}
            </div>
            <h2 className="font-extrabold text-white mb-3" style={{fontSize:'clamp(1.5rem,4vw,2.25rem)',letterSpacing:'-.02em'}}>Start for free. No credit card.</h2>
            <p className="mb-8 max-w-lg mx-auto" style={{color:'rgba(255,255,255,.75)'}}>Join thousands of candidates using AI match scores to apply smarter — not harder.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{background:'white',color:'var(--primary)'}}>Create Free Account</Link>
              <Link to="/jobs" className="px-8 py-3.5 rounded-xl font-semibold text-sm border transition-all" style={{background:'rgba(255,255,255,.1)',color:'rgba(255,255,255,.9)',border:'1px solid rgba(255,255,255,.2)'}}>Browse Jobs First</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
