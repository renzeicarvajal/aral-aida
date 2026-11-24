"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      localStorage.setItem('user', JSON.stringify(data.user))
      if (data.user.role === 'Head') {
        router.push('/dashboard/head')
      } else {
        router.push('/dashboard/teacher')
      }
    } else {
      setError(data.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-600 mb-2">ARAL AIDA</h1>
        <p className="text-center text-gray-500 mb-6 text-sm sm:text-base">AI-Powered Reading Assessment System</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              className="mt-1 block w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="mt-1 block w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-md hover:bg-blue-700 font-medium transition-colors disabled:bg-blue-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}