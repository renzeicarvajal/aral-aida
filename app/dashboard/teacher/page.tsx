"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'
export default function TeacherDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [learners, setLearners] = useState<any[]>([])
  const [generatingId, setGeneratingId] = useState<number | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null)
  
  
  const [editTarget, setEditTarget] = useState<any>(null)
  const [editName, setEditName] = useState('')
  const [editGrade, setEditGrade] = useState('7')
  const [editSection, setEditSection] = useState('')
  const [editPhilIriLevel, setEditPhilIriLevel] = useState('Frustration')
  
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('7')
  const [section, setSection] = useState('')
  const [philIriLevel, setPhilIriLevel] = useState('Frustration')

  useEffect(() => {
    setGeneratingId(null)
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      router.push('/')
    } else {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      fetchLearners(parsedUser.id)
    }
  }, [router])

  useEffect(() => {
    const reset = () => setGeneratingId(null)
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchLearners = async (userId: number) => {
    const res = await fetch(`/api/learners?userId=${userId}`)
    const data = await res.json()
    setLearners(data)
  }

  const handleAddLearner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const res = await fetch('/api/learners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, grade, section, philIriLevel, userId: user.id }),
    })

    if (res.ok) {
      setName('')
      setSection('')
      showToast('Learner added successfully!', 'success')
      fetchLearners(user.id)
    } else {
      showToast('Failed to add learner', 'error')
    }
  }

  const handleGenerateMaterial = async (learnerId: number) => {
    setConfirmTarget(null)
    setGeneratingId(learnerId)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learnerId }),
      })

      const data = await res.json()
      if (data.success) {
        setGeneratingId(null)
        router.push(`/dashboard/teacher/materials/${learnerId}`)
      } else {
        setGeneratingId(null)
        showToast('Failed to generate material.', 'error')
      }
    } catch (err) {
      setGeneratingId(null)
      showToast('An error occurred while generating.', 'error')
    }
  }

  const handleEditLearner = (learner: any) => {
    setEditTarget(learner)
    setEditName(learner.name)
    setEditGrade(learner.grade.toString())
    setEditSection(learner.section)
    setEditPhilIriLevel(learner.philIriLevel)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/learners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editTarget.id,
        name: editName,
        grade: editGrade,
        section: editSection,
        philIriLevel: editPhilIriLevel
      }),
    })

    if (res.ok) {
      setEditTarget(null)
      showToast('Learner updated successfully!', 'success')
      if (user) fetchLearners(user.id)
    } else {
      showToast('Failed to update learner', 'error')
    }
  }

  const handleDeleteLearner = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/learners?id=${deleteTarget}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setDeleteTarget(null)
        showToast('Learner deleted successfully!', 'success')
        if (user) fetchLearners(user.id)
      } else {
        showToast('Failed to delete learner', 'error')
      }
    } catch (err) {
      showToast('An error occurred while deleting', 'error')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  if (!user) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-slide-in ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">ARAL AIDA - Teacher Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {user.username}</span>
          <button 
            onClick={() => router.push('/dashboard/teacher/reports')} 
            className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Reports
          </button>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-medium transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

        
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Learner</h2>
          <form onSubmit={handleAddLearner} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Grade</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700">
                  <option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <input type="text" value={section} onChange={(e) => setSection(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phil-IRI Level</label>
              <select value={philIriLevel} onChange={(e) => setPhilIriLevel(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700">
                <option value="Frustration">Frustration</option>
                <option value="Instructional">Instructional</option>
                <option value="Independent">Independent</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium">Add Learner</button>
          </form>
        </div>

        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">My Learners ({learners.length})</h2>
          {learners.length === 0 ? (
            <p className="text-gray-500">No learners added yet.</p>
          ) : (
            <ul className="space-y-4">
              {learners.map((learner) => (
                <li key={learner.id} className="flex justify-between items-start border-b pb-4">
                  <div>
                    <p className="font-medium text-gray-800 text-lg">{learner.name}</p>
                    <p className="text-sm text-gray-500">Grade {learner.grade} - {learner.section}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      learner.philIriLevel === 'Frustration' ? 'bg-red-100 text-red-800' :
                      learner.philIriLevel === 'Instructional' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {learner.philIriLevel}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmTarget({ id: learner.id, name: learner.name })}
                        disabled={generatingId === learner.id}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-all"
                      >
                        {generatingId === learner.id ? (
                          <><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating...</>
                        ) : 'Generate'}
                      </button>
                      <button onClick={() => router.push(`/dashboard/teacher/session/${learner.id}`)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium">Log</button>
                      <button onClick={() => router.push(`/dashboard/teacher/materials/${learner.id}`)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm font-medium">View</button>
                      <button onClick={() => handleEditLearner(learner)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-sm font-medium">Edit</button>
                      <button onClick={() => setDeleteTarget(learner.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium">Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Generate reading material?</h3>
            <p className="text-sm text-gray-600 mb-6">A new AI-generated passage will be created for <span className="font-semibold">{confirmTarget.name}</span>.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmTarget(null)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100">Cancel</button>
              <button onClick={() => handleGenerateMaterial(confirmTarget.id)} className="px-4 py-2 rounded-md bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">Generate</button>
            </div>
          </div>
        </div>
      )}

      
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Learner Info</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grade</label>
                  <select value={editGrade} onChange={(e) => setEditGrade(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700">
                    <option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Section</label>
                  <input type="text" value={editSection} onChange={(e) => setEditSection(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phil-IRI Level</label>
                <select value={editPhilIriLevel} onChange={(e) => setEditPhilIriLevel(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700">
                  <option value="Frustration">Frustration</option>
                  <option value="Instructional">Instructional</option>
                  <option value="Independent">Independent</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete this learner?</h3>
            <p className="text-sm text-gray-600 mb-6">This action cannot be undone. All associated sessions and materials will also be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100">Cancel</button>
              <button onClick={handleDeleteLearner} className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  )
}