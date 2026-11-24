"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      router.push('/')
    } else {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      fetchReports(parsedUser.id)
    }
  }, [router])

  const fetchReports = async (userId: number) => {
    const res = await fetch(`/api/reports?userId=${userId}`)
    const data = await res.json()
    setReports(data)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  if (!user) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">ARAL AIDA - Progress Reports</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {user.username}</span>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-medium">Logout</button>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto">
        <button onClick={() => router.push('/dashboard/teacher')} className="text-blue-600 hover:underline mb-6 block">
          ← Back to Dashboard
        </button>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Weekly Progress Summary</h2>
          
          {reports.length === 0 ? (
            <p className="text-gray-500">No learners or sessions found yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Accuracy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Comprehension</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Session</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{report.name}</div>
                        <div className="text-sm text-gray-500">Grade {report.grade} - {report.section}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          report.philIriLevel === 'Frustration' ? 'bg-red-100 text-red-800' :
                          report.philIriLevel === 'Instructional' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {report.philIriLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.totalSessions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-blue-600">{report.avgAccuracy}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-purple-600">{report.avgComprehension}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.lastSessionDate ? new Date(report.lastSessionDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}