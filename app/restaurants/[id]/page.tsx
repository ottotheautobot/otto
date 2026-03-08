'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Restaurant, BookingPreference } from '@/lib/supabase'

export default function RestaurantDetailPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [preferences, setPreferences] = useState<BookingPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    party_size: 2,
    target_dates: [] as string[],
    preferred_times: { exact: '19:00' },
    priority: 5,
    notes: '',
  })
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.id as string

  useEffect(() => {
    const token = localStorage.getItem('otto_token')
    if (!token) {
      router.push('/login')
      return
    }
    loadData()
  }, [restaurantId, router])

  async function loadData() {
    try {
      const [restRes, prefRes] = await Promise.all([
        fetch(`/api/restaurants`),
        fetch(`/api/preferences?restaurant_id=${restaurantId}`),
      ])

      const restaurants = await restRes.json()
      const rest = restaurants.find((r: Restaurant) => r.id === restaurantId)
      setRestaurant(rest)

      const prefs = await prefRes.json()
      setPreferences(prefs)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddPreference(e: React.FormEvent) {
    e.preventDefault()

    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          ...formData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Error adding preference')
        return
      }

      await loadData()
      setShowForm(false)
      setFormData({
        party_size: 2,
        target_dates: [],
        preferred_times: { exact: '19:00' },
        priority: 5,
        notes: '',
      })
    } catch (error) {
      console.error('Error adding preference:', error)
      alert('Error adding preference')
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!restaurant) return <div className="flex items-center justify-center min-h-screen">Restaurant not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {restaurant.release_pattern} @ {restaurant.release_time} ET
            </p>
          </div>
          <button
            onClick={() => router.push('/restaurants')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Back
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            + Add Booking Preference
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <form onSubmit={handleAddPreference} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Party Size
                  </label>
                  <input
                    type="number"
                    value={formData.party_size}
                    onChange={(e) => setFormData({ ...formData, party_size: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="1"
                    max="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority (1-10)
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="1"
                    max="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={(formData.preferred_times as any).exact || '19:00'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferred_times: { exact: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Dates (comma-separated YYYY-MM-DD)
                  </label>
                  <input
                    type="text"
                    placeholder="2026-03-15, 2026-03-17, 2026-03-20"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_dates: e.target.value
                          .split(',')
                          .map((d) => d.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Add Preference
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Preferences List */}
        {preferences.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No booking preferences yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
            >
              Add First Preference
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Party Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Preferred Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Target Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {preferences.map((pref) => (
                  <tr key={pref.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{pref.party_size}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {(pref.preferred_times as any)?.exact || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pref.target_dates?.join(', ') || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{pref.priority}/10</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          pref.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {pref.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
