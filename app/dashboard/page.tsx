'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Restaurant, BookingPreference } from '@/lib/supabase'

export default function DashboardPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [preferences, setPreferences] = useState<Record<string, BookingPreference[]>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('otto_token')
    if (!token) {
      router.push('/login')
      return
    }
    loadData()
  }, [router])

  async function loadData() {
    try {
      // Load restaurants
      const restRes = await fetch('/api/restaurants')
      const rests = await restRes.json()
      setRestaurants(rests)

      // Load preferences for each restaurant
      const prefs: Record<string, BookingPreference[]> = {}
      for (const rest of rests) {
        const prefRes = await fetch(`/api/preferences?restaurant_id=${rest.id}`)
        const restPrefs = await prefRes.json()
        prefs[rest.id] = restPrefs
      }
      setPreferences(prefs)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Otto Reservation Bot</h1>
          <p className="text-gray-600 mt-1">Auto-book restaurants when availability opens</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-medium">Tracked Restaurants</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{restaurants.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-medium">Active Preferences</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {Object.values(preferences).flat().filter((p) => p.active).length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-medium">Next Check</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">10:00 AM ET</div>
            <p className="text-xs text-gray-500 mt-2">Daily at release time</p>
          </div>
        </div>

        {/* Restaurants Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Restaurants</h2>
            <button
              onClick={() => router.push('/restaurants')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              + Manage Restaurants
            </button>
          </div>

          {restaurants.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-500 mb-4">No restaurants added yet.</p>
              <button
                onClick={() => router.push('/restaurants')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
              >
                Add Your First Restaurant
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="bg-white rounded-lg shadow hover:shadow-md transition">
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900">{restaurant.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{restaurant.location}</p>

                    {/* Release Info */}
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-medium text-gray-700">Release Pattern</p>
                      <p className="text-sm font-bold text-gray-900">
                        {restaurant.release_pattern} @ {restaurant.release_time} ET
                      </p>
                    </div>

                    {/* Preferences Summary */}
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">Booking Preferences</p>
                      {(preferences[restaurant.id] || []).length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No preferences set</p>
                      ) : (
                        <div className="space-y-2">
                          {(preferences[restaurant.id] || []).map((pref) => (
                            <div key={pref.id} className="text-xs bg-green-50 p-2 rounded border border-green-200">
                              <div className="font-medium text-green-900">
                                Party of {pref.party_size} @ {(pref.preferred_times as any)?.exact || 'any time'}
                              </div>
                              <div className="text-green-700 text-xs mt-1">
                                {pref.target_dates?.length || 0} date{pref.target_dates?.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-2">
                      <button
                        onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-medium text-sm"
                      >
                        Manage Preferences
                      </button>
                      <button
                        onClick={() => router.push('/activity')}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium text-sm"
                      >
                        Activity Log
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Bookings</h2>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 text-center text-gray-500">
              <p>No bookings yet. Check back after the bot makes its first reservation!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
