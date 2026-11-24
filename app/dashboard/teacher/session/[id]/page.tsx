"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'


export default function LogSessionPage() {
  const router = useRouter()
  const params = useParams()
  const learnerId = params.id as string

  const [learnerName, setLearnerName] = useState('')
  
  const [status, setStatus] = useState('Present')
  const [accuracy, setAccuracy] = useState('')
  const [comprehension, setComprehension] = useState('')
  const [notes, setNotes] = useState('')
  const [history, setHistory] = useState<any[]>([])
  
  
  const [editTarget, setEditTarget] = useState<any>(null)
  const [editAccuracy, setEditAccuracy] = useState('')
  const [editComprehension, setEditComprehension] = useState('')
  const [editNotes, setEditNotes] = useState('')
  
  const [deleteTarget, setDeleteTarget] = useState<{ attendanceId: number | null, progressId: number | null } | null>(null)
    
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  
  const getLocalDateString = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [date, setDate] = useState(getLocalDateString())

  useEffect(() => {
    
    const fetchLearner = async () => {
      const res = await fetch(`/api/learners?id=${learnerId}`)
      const data = await res.json()
      if (data) setLearnerName(data.name)
    }

    
    const fetchHistory = async () => {
      const res = await fetch(`/api/sessions?learnerId=${learnerId}`)
      const data = await res.json()
      setHistory(data)
    }

    fetchLearner()
    fetchHistory()
  }, [learnerId])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000) // Auto-hide after 3 seconds
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learnerId, date, status, accuracy, comprehension, notes }),
    })

    if (res.ok) {
      showToast('Session logged successfully!', 'success')
      
      setAccuracy('')
      setComprehension('')
      setNotes('')
      
      const refreshRes = await fetch(`/api/sessions?learnerId=${learnerId}`)
      const refreshData = await refreshRes.json()
      setHistory(refreshData)
    } else {
      showToast('Failed to log session.', 'error')
    }
  }

  const handleEdit = (session: any) => {
    setEditTarget(session)
    setEditAccuracy(session.accuracy.toString())
    setEditComprehension(session.comprehension.toString())
    setEditNotes(session.notes || '')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/sessions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        progressId: editTarget.progressId, // Fixed: use progressId, not attendance ID
        accuracy: editAccuracy,
        comprehension: editComprehension,
        notes: editNotes,
      }),
    })

    if (res.ok) {
      setEditTarget(null)
      showToast('Session updated successfully!', 'success')
      
      const refreshRes = await fetch(`/api/sessions?learnerId=${learnerId}`)
      const refreshData = await refreshRes.json()
      setHistory(refreshData)
    } else {
      showToast('Failed to update session', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const params = new URLSearchParams();
       if (deleteTarget.attendanceId) params.append('attendanceId', deleteTarget.attendanceId.toString());
       if (deleteTarget.progressId) params.append('progressId', deleteTarget.progressId.toString());

       const res = await fetch(`/api/sessions?${params.toString()}`, {
         method: 'DELETE'
       })

      if (res.ok) {
        setDeleteTarget(null)
        showToast('Session deleted successfully!', 'success')
        
        const refreshRes = await fetch(`/api/sessions?learnerId=${learnerId}`)
        const refreshData = await refreshRes.json()
        setHistory(refreshData)
      } else {
        showToast('Failed to delete session', 'error')
      }
    } catch (err) {
      showToast('An error occurred while deleting', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-slide-in ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline mb-4 block">← Back to Dashboard</button>
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Log Session for {learnerName}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Attendance</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700">
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          {status === 'Present' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Accuracy (%)</label>
                  <input type="number" min="0" max="100" value={accuracy} onChange={(e) => setAccuracy(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comprehension (%)</label>
                  <input type="number" min="0" max="100" value={comprehension} onChange={(e) => setComprehension(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teacher Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"></textarea>
              </div>
            </>
          )}

          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-medium">Save Session Log</button>
        </form>

        {history.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Recent History</h2>
            <ul className="space-y-3">
              {history.map((log) => (
                <li key={log.attendanceId || log.progressId} className="flex justify-between items-center border-b pb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(log.sessionDate).toLocaleDateString()}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    {log.status === 'Present' && log.accuracy !== null ? (
                      <p className="text-sm text-gray-600">
                        Accuracy: <span className="font-bold text-blue-600">{log.accuracy}%</span> | 
                        Comprehension: <span className="font-bold text-purple-600">{log.comprehension}%</span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Student was absent</p>
                    )}
                    {log.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">"{log.notes}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    
                    {log.status === 'Present' && log.progressId && (
                      <button
                        onClick={() => handleEdit(log)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    
                    <button
                      onClick={() => setDeleteTarget({ attendanceId: log.attendanceId, progressId: log.progressId })}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Session Log</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Accuracy (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editAccuracy}
                    onChange={(e) => setEditAccuracy(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comprehension (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editComprehension}
                    onChange={(e) => setEditComprehension(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teacher Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete this session log?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. The session record will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}