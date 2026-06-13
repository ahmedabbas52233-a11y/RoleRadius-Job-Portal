import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Briefcase, Menu, X, User, LogOut, PlusCircle, LayoutDashboard, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, isAuthenticated, isCandidate, isRecruiter, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    setMobileOpen(false)
    setUserMenuOpen(false)
    toast.success('Signed out')
    navigate('/')
  }

  const active = (path) => location.pathname === path
    ? 'text-brand-600 font-semibold'
    : 'text-gray-600 hover:text-gray-900'

  const navLinks = [
    { to: '/jobs', label: 'Browse Jobs' },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100" role="banner">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg hover:opacity-80 transition-opacity"
            aria-label="RoleRadius home">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span>RoleRadius</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={`px-4 py-2 rounded-xl text-sm transition-colors ${active(to)}`}>
                {label}
              </Link>
            ))}
            {isRecruiter && (
              <Link to="/recruiter/dashboard" className={`px-4 py-2 rounded-xl text-sm transition-colors ${active('/recruiter/dashboard')}`}>
                Dashboard
              </Link>
            )}
            {isCandidate && (
              <Link to="/dashboard" className={`px-4 py-2 rounded-xl text-sm transition-colors ${active('/dashboard')}`}>
                Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="User menu">
                  <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-700 font-semibold text-xs">
                      {user?.full_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.full_name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 py-1 z-50 animate-scale-in"
                    role="menu">
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      role="menuitem">
                      <User className="w-4 h-4" aria-hidden="true" /> My Profile
                    </Link>
                    {isRecruiter && (
                      <Link to="/recruiter/post-job" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        role="menuitem">
                        <PlusCircle className="w-4 h-4" aria-hidden="true" /> Post a Job
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      role="menuitem">
                      <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden btn-ghost p-2"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
            {mobileOpen
              ? <X className="w-5 h-5" aria-hidden="true" />
              : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-gray-100 bg-white" role="navigation" aria-label="Mobile navigation">
          <div className="page-container py-4 flex flex-col gap-1">
            <Link to="/jobs" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors">
              <Briefcase className="w-5 h-5 text-gray-400" aria-hidden="true" /> Browse Jobs
            </Link>

            {isAuthenticated ? (
              <>
                {isCandidate && (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                    <LayoutDashboard className="w-5 h-5 text-gray-400" aria-hidden="true" /> My Dashboard
                  </Link>
                )}
                {isRecruiter && (
                  <>
                    <Link to="/recruiter/dashboard" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                      <LayoutDashboard className="w-5 h-5 text-gray-400" aria-hidden="true" /> Recruiter Dashboard
                    </Link>
                    <Link to="/recruiter/post-job" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                      <PlusCircle className="w-5 h-5 text-gray-400" aria-hidden="true" /> Post a Job
                    </Link>
                  </>
                )}
                <Link to="/profile" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                  <User className="w-5 h-5 text-gray-400" aria-hidden="true" /> My Profile
                </Link>
                <hr className="my-2 border-gray-100" />
                <div className="px-4 py-2 text-xs text-gray-400 font-medium">
                  Signed in as {user?.full_name}
                </div>
                <button onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors">
                  <LogOut className="w-5 h-5" aria-hidden="true" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <hr className="my-2 border-gray-100" />
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary w-full justify-center">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Close user menu on outside click */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
      )}
    </header>
  )
}
