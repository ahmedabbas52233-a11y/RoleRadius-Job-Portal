import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Briefcase, User, ChevronDown, Menu, X,
  LogOut, PlusCircle, LayoutDashboard
} from 'lucide-react'
import toast from 'react-hot-toast'

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'
  }`

export default function Navbar() {
  const { isAuthenticated, user, logout, isCandidate, isRecruiter } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => {
    setDropdownOpen(false)
    setMenuOpen(false)
    await logout()
    toast.success('Logged out')
    navigate('/')
  }

  const dashboardPath = isRecruiter ? '/recruiter/dashboard' : '/dashboard'

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-brand-700">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span>Role<span className="text-brand-500">Radius</span></span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/jobs" className={navLinkClass}>Browse Jobs</NavLink>
            {isAuthenticated && (
              <NavLink to={dashboardPath} className={navLinkClass}>Dashboard</NavLink>
            )}
          </div>

          {/* Desktop auth area */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-700 text-sm font-semibold">
                      {user?.full_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user?.full_name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute right-0 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-20 animate-scale-in"
                      role="menu"
                    >
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        role="menuitem"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" aria-hidden="true" /> Profile
                      </Link>

                      {isRecruiter && (
                        <Link
                          to="/recruiter/post-job"
                          role="menuitem"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <PlusCircle className="w-4 h-4" aria-hidden="true" /> Post a Job
                        </Link>
                      )}

                      <Link
                        to={dashboardPath}
                        role="menuitem"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> Dashboard
                      </Link>

                      <div className="border-t border-gray-50 mt-1">
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden btn-ghost p-2"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2 animate-fade-in">
          <Link to="/jobs"
            className="block px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
            onClick={() => setMenuOpen(false)}>
            Browse Jobs
          </Link>
          {isAuthenticated ? (
            <>
              <Link to={dashboardPath}
                className="block px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/profile"
                className="block px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setMenuOpen(false)}>
                Profile
              </Link>
              {isRecruiter && (
                <Link to="/recruiter/post-job"
                  className="block px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                  onClick={() => setMenuOpen(false)}>
                  Post a Job
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login"
                className="block px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
              <Link to="/register"
                className="block px-3 py-2 rounded-xl bg-brand-600 text-white font-medium text-center"
                onClick={() => setMenuOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
