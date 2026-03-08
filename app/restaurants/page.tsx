'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Restaurant } from '@/lib/supabase'

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    resy_venue_id: '',
    location: '',
    release_pattern: 'unknown' as const,
    release_day: '',
    release_time: '',
    notes: '',
  })
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('otto_token')
    if (!token) {
      router.push('/login')
      return
    }
    loadRestaurants()
  }, [router])

  async function loadRestaurants() {
    try {
      const response = await fetch('/api/restaurants')
      const data = await response.json()
      setRestaurants(data)
    } catch (error) {
      console.error('Error loading restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  function startEditRestaurant(restaurant: Restaurant) {
    setEditingId(restaurant.id)
    setFormData({
      name: restaurant.name,
      resy_venue_id: restaurant.resy_venue_id,
      location: restaurant.location || '',
      release_pattern: (restaurant.release_pattern || 'unknown') as any,
      release_day: restaurant.release_day || '',
      release_time: restaurant.release_time || '',
      notes: restaurant.notes || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/restaurants/${editingId}` : '/api/restaurants'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Error saving restaurant')
        return
      }

      await loadRestaurants()
      setShowForm(false)
      setEditingId(null)
      setFormData({
        name: '',
        resy_venue_id: '',
        location: '',
        release_pattern: 'unknown',
        release_day: '',
        release_time: '',
        notes: '',
      })
    } catch (error) {
      console.error('Error saving restaurant:', error)
      alert('Error saving restaurant')
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Add/Edit Form */}
        <div className="mb-6">
          <button
            onClick={() => {
              setEditingId(null)
              setFormData({
                name: '',
                resy_venue_id: '',
                location: '',
                release_pattern: 'unknown',
                release_day: '',
                release_time: '',
                notes: '',
              })
              setShowForm(!showForm)
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            + Add Restaurant
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-8 border-l-4 border-indigo-600">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {editingId ? '✏️ Edit Restaurant & Release Pattern' : '➕ Add New Restaurant'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Torrisi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resy Venue ID *
                  </label>
                  <input
                    type="text"
                    value={formData.resy_venue_id}
                    onChange={(e) => setFormData({ ...formData, resy_venue_id: e.target.value })}
                    placeholder="e.g., 12345"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Find in URL: resy.com/cities/new-york-ny/venues/<strong>12345</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Manhattan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Release Pattern Section (Optional/Research) */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded">
                <h4 className="font-medium text-amber-900 mb-3">📋 Release Pattern (Research When You Have Time)</h4>
                <p className="text-xs text-amber-800 mb-4">
                  Check Resy to find when this restaurant releases tables. Different restaurants release at different times (daily 10am, weekly, 7-day advance, etc.). You can leave as "Unknown" and come back later to fill it in.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Release Pattern</label>
                    <select
                      value={formData.release_pattern}
                      onChange={(e) => setFormData({ ...formData, release_pattern: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="unknown">🔍 Unknown (Research Needed)</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Release Day (if weekly)</label>
                    <select
                      value={formData.release_day}
                      onChange={(e) => setFormData({ ...formData, release_day: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={formData.release_pattern === 'unknown' || formData.release_pattern === 'daily' || formData.release_pattern === 'manual'}
                    >
                      <option value="">—</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Release Time (e.g., 10:00 AM)</label>
                    <input
                      type="time"
                      value={formData.release_time}
                      onChange={(e) => setFormData({ ...formData, release_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={formData.release_pattern === 'unknown' || formData.release_pattern === 'manual'}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="e.g., 30 days advance, always books out in 10 minutes..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition"
                  disabled={!formData.name || !formData.resy_venue_id}
                >
                  {editingId ? 'Update Restaurant' : 'Add Restaurant'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Restaurants List */}
        {restaurants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No restaurants yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
            >
              Add Your First Restaurant
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Release Pattern</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {restaurants.map((restaurant) => {
                  const patternUnknown = restaurant.release_pattern === 'unknown' || !restaurant.release_pattern
                  return (
                    <tr key={restaurant.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{restaurant.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{restaurant.location || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        {patternUnknown ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                            🔍 Research needed
                          </span>
                        ) : (
                          <span className="text-gray-900 font-medium">
                            {restaurant.release_pattern} @ {restaurant.release_time}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            restaurant.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {restaurant.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        {patternUnknown && (
                          <button
                            onClick={() => startEditRestaurant(restaurant)}
                            className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1 rounded text-xs font-medium"
                          >
                            Research & Update
                          </button>
                        )}
                        {!patternUnknown && (
                          <button
                            onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1 rounded text-xs font-medium"
                          >
                            Manage Preferences
                          </button>
                        )}
                        <button
                          onClick={() => startEditRestaurant(restaurant)}
                          className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-1 rounded text-xs font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-3">How to Add a Restaurant</h3>
          <ol className="text-sm text-blue-900 space-y-2 list-decimal list-inside">
            <li>Click "Add Restaurant" and enter the name + Resy venue ID</li>
            <li>Leave release pattern as "Unknown" — you don't need to know it yet</li>
            <li>When you have time, research how the restaurant releases tables (check Resy, call them, etc.)</li>
            <li>Come back and click "Research & Update" to fill in the actual release pattern & time</li>
            <li>Once pattern is set, click "Manage Preferences" to add booking dates</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
