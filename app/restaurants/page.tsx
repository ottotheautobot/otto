'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Restaurant } from '@/lib/supabase'

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    resy_venue_id: '',
    location: '',
    release_pattern: 'daily' as const,
    release_day: '',
    release_time: '10:00',
    notes: '',
  })
  const [earliestDate, setEarliestDate] = useState<string>('')
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

  async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setFormData({ ...formData, name: query })

    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/resy/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSearchResults(data.venues || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  function selectVenue(venue: any) {
    // Calculate earliest available date based on advance days
    const today = new Date()
    const earliestBooking = new Date(today)
    earliestBooking.setDate(earliestBooking.getDate() + (venue.estimatedAdvanceDays || 30))

    setFormData({
      ...formData,
      name: venue.name,
      resy_venue_id: venue.id,
      location: venue.location,
      release_pattern: venue.estimatedReleasePattern || 'daily',
      release_time: venue.estimatedReleaseTime || '10:00',
    })
    setSearchResults([])
    setEarliestDate(earliestBooking.toISOString().split('T')[0])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Error adding restaurant')
        return
      }

      await loadRestaurants()
      setShowForm(false)
      setFormData({
        name: '',
        resy_venue_id: '',
        location: '',
        release_pattern: 'daily',
        release_day: '',
        release_time: '10:00',
        notes: '',
      })
      setEarliestDate('')
    } catch (error) {
      console.error('Error adding restaurant:', error)
      alert('Error adding restaurant')
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
        {/* Add Restaurant Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            + Add Restaurant
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Restaurant *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={handleSearch}
                      placeholder="Type restaurant name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {searching && (
                      <div className="absolute right-3 top-3 text-sm text-gray-500">
                        Searching...
                      </div>
                    )}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                        {searchResults.map((venue) => (
                          <button
                            key={venue.id}
                            type="button"
                            onClick={() => selectVenue(venue)}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 border-b last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{venue.name}</div>
                            <div className="text-xs text-gray-500">
                              {venue.location} • Earliest: {new Date(new Date().getTime() + (venue.estimatedAdvanceDays || 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.resy_venue_id && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      ✓ Found! Earliest reservation: <strong>{earliestDate}</strong>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Release Pattern (Auto-detected)
                  </label>
                  <div className="text-sm font-medium text-gray-900">{formData.release_pattern}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Release Time (Auto-detected)
                  </label>
                  <div className="text-sm font-medium text-gray-900">{formData.release_time} ET</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Earliest Reservation
                  </label>
                  <div className="text-sm font-medium text-green-700">{earliestDate}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition"
                >
                  Add Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Restaurants List */}
        {restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No restaurants added yet.</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Release
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {restaurant.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {restaurant.location || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {restaurant.release_pattern} @ {restaurant.release_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        restaurant.enabled 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {restaurant.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a href={`/restaurants/${restaurant.id}`} className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </a>
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
