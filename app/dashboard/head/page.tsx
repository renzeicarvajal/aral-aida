"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HeadDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>({
    totalTeachers: 0,
    totalLearners: 0,
    totalSessions: 0,
    overallAvgAccuracy: '0.0',
    overallAvgComprehension: '0.0',
    teacherStats: []
  })
  
  const [teachers, setTeachers] = useState<any[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  const [editTarget, setEditTarget] = useState<any>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      router.push('/')
    } else {
      const parsedUser = JSON.parse(storedUser)
      if (parsedUser.role !== 'Head') {
        router.push('/dashboard/teacher')
        return
      }
      setUser(parsedUser)
      fetchDashboardData()
      fetchTeachers()
    }
  }, [router])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchDashboardData = async () => {
    const res = await fetch('/api/head/dashboard')
    const data = await res.json()
    setStats(data)
  }

  const fetchTeachers = async () => {
    const res = await fetch('/api/head/teachers')
    const data = await res.json()
    setTeachers(data)
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/head/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: newPassword }),
    })

    if (res.ok) {
      setNewUsername('')
      setNewPassword('')
      showToast('Teacher created successfully!', 'success')
      fetchTeachers()
      fetchDashboardData() 
    } else {
      const data = await res.json()
      showToast(data.error || 'Failed to create teacher', 'error')
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/head/teachers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editTarget.id, username: editUsername, password: editPassword }),
    })

    if (res.ok) {
      setEditTarget(null)
      showToast('Teacher updated successfully!', 'success')
      fetchTeachers()
    } else {
      showToast('Failed to update teacher', 'error')
    }
  }

  const handleDeleteTeacher = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/head/teachers?id=${deleteTarget}`, { method: 'DELETE' })

    if (res.ok) {
      setDeleteTarget(null)
      showToast('Teacher deleted successfully!', 'success')
      fetchTeachers()
      fetchDashboardData()
    } else {
      showToast('Failed to delete teacher', 'error')
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
        <h1 className="text-xl font-bold">ARAL AIDA - School Head Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {user.username}</span>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-medium transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 mb-1">Total Teachers</p>
            <p className="text-3xl font-bold text-gray-800">{stats.totalTeachers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <p className="text-sm text-gray-500 mb-1">Total Learners</p>
            <p className="text-3xl font-bold text-gray-800">{stats.totalLearners}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <p className="text-sm text-gray-500 mb-1">Total Sessions</p>
            <p className="text-3xl font-bold text-gray-800">{stats.totalSessions}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
            <p className="text-sm text-gray-500 mb-1">Avg Accuracy</p>
            <p className="text-3xl font-bold text-gray-800">{stats.overallAvgAccuracy}%</p>
          </div>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Teacher Form */}
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Create Teacher Account</h2>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input 
                  type="text" 
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.target.value)} 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700" 
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium">
                Create Account
              </button>
            </form>
          </div>

          
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Registered Teachers ({teachers.length})</h2>
            {teachers.length === 0 ? (
              <p className="text-gray-500">No teachers registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => {
                              setEditTarget(teacher)
                              setEditUsername(teacher.username)
                              setEditPassword('') // Leave blank to keep existing password
                            }}
                            className="text-yellow-600 hover:text-yellow-900 mr-4"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setDeleteTarget(teacher.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Teacher Account</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input 
                  type="text" 
                  value={editUsername} 
                  onChange={(e) => setEditUsername(e.target.value)} 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
                <input 
                  type="password" 
                  value={editPassword} 
                  onChange={(e) => setEditPassword(e.target.value)} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700" 
                />
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
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete this teacher?</h3>
            <p className="text-sm text-gray-600 mb-6">This action cannot be undone. The teacher and all their associated learners will be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100">Cancel</button>
              <button onClick={handleDeleteTeacher} className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700">Delete</button>
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