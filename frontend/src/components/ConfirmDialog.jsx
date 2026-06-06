import { X, AlertTriangle } from 'lucide-react'

/**
 * Reusable confirmation dialog for destructive actions.
 * Usage:
 *   <ConfirmDialog
 *     open={showConfirm}
 *     title="Delete this job?"
 *     message="This will permanently remove the posting. Applications already submitted will be preserved."
 *     confirmLabel="Delete Job"
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowConfirm(false)}
 *     danger
 *   />
 */
export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm',
  onConfirm, onCancel, danger = false, loading = false,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              danger ? 'bg-red-50' : 'bg-amber-50'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-amber-500'}`}
                aria-hidden="true" />
            </div>
            <h2 id="dialog-title" className="font-semibold text-gray-900">{title}</h2>
          </div>
          <button onClick={onCancel} className="btn-ghost p-1.5" aria-label="Cancel">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 justify-center ${danger ? 'btn-danger' : 'btn-primary'}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing…
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
