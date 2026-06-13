import { Link } from 'react-router-dom'
export default function EditJob() {
  return (
    <div className="page-container py-12 text-center">
      <h1 className="page-title mb-4">Edit Job</h1>
      <p className="text-gray-500 mb-6">Edit form uses the same fields as Post Job.</p>
      <Link to="/recruiter/dashboard" className="btn-secondary">Back to Dashboard</Link>
    </div>
  )
}
