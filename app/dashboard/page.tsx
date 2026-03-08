'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('otto_token')
    if (!token) {
      router.push('/login')
    } else {
      setIsAuthenticated(true)
      setLoading(false)
    }
  }, [router])

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Otto Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem('otto_token')
              router.push('/login')
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Restaurants</h3>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Booked</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Failed Attempts</h3>
            <p className="text-3xl font-bold text-red-600">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Next Release</h3>
            <p className="text-lg font-bold text-indigo-600">—</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/restaurants" className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-lg text-center font-medium transition">
            Manage Restaurants
          </a>
          <a href="/activity" className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg text-center font-medium transition">
            Activity Log
          </a>
          <a href="/booked" className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg text-center font-medium transition">
            Booked Confirmations
          </a>
        </div>
      </main>
    </div>
  )
}
