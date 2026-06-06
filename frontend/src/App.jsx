import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import EmailVerificationBanner from './components/EmailVerificationBanner'

const Home               = lazy(() => import('./pages/Home'))
const Login              = lazy(() => import('./pages/Login'))
const Register           = lazy(() => import('./pages/Register'))
const Jobs               = lazy(() => import('./pages/Jobs'))
const JobDetail          = lazy(() => import('./pages/JobDetail'))
const CandidateDashboard = lazy(() => import('./pages/CandidateDashboard'))
const RecruiterDashboard = lazy(() => import('./pages/RecruiterDashboard'))
const PostJob            = lazy(() => import('./pages/PostJob'))
const EditJob            = lazy(() => import('./pages/EditJob'))
const Profile            = lazy(() => import('./pages/Profile'))
const ForgotPassword     = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword      = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail        = lazy(() => import('./pages/VerifyEmail'))
const NotFound           = lazy(() => import('./pages/NotFound'))

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center"
         role="status" aria-label="Loading page">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gray-50">

          {/* Skip navigation for keyboard/screen reader users */}
          <a href="#main-content"
             className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-md focus:m-2">
            Skip to main content
          </a>

          <Navbar />
          <EmailVerificationBanner />

          <main id="main-content" className="flex-1" tabIndex={-1}>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public */}
                  <Route path="/"                      element={<Home />} />
                  <Route path="/jobs"                  element={<Jobs />} />
                  <Route path="/jobs/:id"              element={<JobDetail />} />
                  <Route path="/login"                 element={<Login />} />
                  <Route path="/register"              element={<Register />} />
                  <Route path="/forgot-password"       element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/verify-email/:token"   element={<VerifyEmail />} />

                  {/* Candidate */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute role="candidate">
                      <CandidateDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  {/* Recruiter */}
                  <Route path="/recruiter/dashboard" element={
                    <ProtectedRoute role="recruiter">
                      <RecruiterDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/recruiter/post-job" element={
                    <ProtectedRoute role="recruiter">
                      <PostJob />
                    </ProtectedRoute>
                  } />
                  <Route path="/recruiter/jobs/:id/edit" element={
                    <ProtectedRoute role="recruiter">
                      <EditJob />
                    </ProtectedRoute>
                  } />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{ duration: 4000, style: { fontFamily: 'Sora, sans-serif', fontSize: '14px' } }}
        />
      </AuthProvider>
    </ErrorBoundary>
  )
}
