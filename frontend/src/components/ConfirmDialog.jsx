import { X, AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, title, message, confirmLabel='Confirm', onConfirm, onCancel, danger=false, loading=false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(15,14,23,.6)',backdropFilter:'blur(8px)'}} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in" style={{border:'1px solid var(--border)'}}>
        <div className="flex items-center justify-between p-6 border-b" style={{borderColor:'var(--border)'}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:danger?'#fee2e2':'#fef3c7'}}>
              <AlertTriangle className="w-5 h-5" style={{color:danger?'#dc2626':'#d97706'}} aria-hidden="true"/>
            </div>
            <h2 id="dialog-title" className="font-bold" style={{color:'var(--text-1)'}}>{title}</h2>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-gray-50 transition-colors" aria-label="Cancel">
            <X className="w-4 h-4" style={{color:'var(--text-3)'}}/>
          </button>
        </div>
        <div className="px-6 py-4"><p className="text-sm leading-relaxed" style={{color:'var(--text-2)'}}>{message}</p></div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 justify-center ${danger?'btn-danger':'btn-primary'}`}>
            {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Processing…</span> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
