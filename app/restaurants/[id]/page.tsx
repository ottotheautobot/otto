'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { format12Hour, formatDateRanges } from '@/lib/time-utils'
import type { Restaurant, BookingPreference } from '@/lib/supabase'

export default function RestaurantDetailPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [preferences, setPreferences] = useState<BookingPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    party_size: 2,
    preferred_times: { start: '19:00', end: '21:30' },
    priority: 5,
    notes: '',
  })
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.id as string

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date())

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

  function toggleDate(dateStr: string) {
    const newDates = new Set(selectedDates)
    if (newDates.has(dateStr)) {
      newDates.delete(dateStr)
    } else {
      newDates.add(dateStr)
    }
    setSelectedDates(newDates)
  }

  function getDaysInMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  function getFirstDayOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  function formatDateISO(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const calendarDays = []
  const daysInMonth = getDaysInMonth(calendarMonth)
  const firstDay = getFirstDayOfMonth(calendarMonth)
  const today = new Date()
  const earliestDate = new Date(today)
  earliestDate.setDate(earliestDate.getDate() + 30) // 30 days advance for daily releases

  // Fill in empty cells before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  // Fill in days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  function startEdit(pref: BookingPreference) {
    setEditingId(pref.id)
    setFormData({
      party_size: pref.party_size || 2,
      preferred_times: pref.preferred_times as any,
      priority: pref.priority || 5,
      notes: pref.notes || '',
    })
    setSelectedDates(new Set(pref.target_dates || []))
    setShowForm(true)
  }

  async function handleSavePreference(e: React.FormEvent) {
    e.preventDefault()

    if (selectedDates.size === 0) {
      alert('Please select at least one date')
      return
    }

    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/preferences/${editingId}` : '/api/preferences'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          party_size: formData.party_size,
          target_dates: Array.from(selectedDates),
          preferred_times: formData.preferred_times,
          priority: formData.priority,
          notes: formData.notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Error saving preference')
        return
      }

      await loadData()
      setShowForm(false)
      setEditingId(null)
      setSelectedDates(new Set())
      setFormData({
        party_size: 2,
        preferred_times: { start: '19:00', end: '21:30' },
        priority: 5,
        notes: '',
      })
    } catch (error) {
      console.error('Error saving preference:', error)
      alert('Error saving preference')
    }
  }

  async function handleDeletePreference(prefId: string) {
    if (!confirm('Delete this preference?')) return

    try {
      const response = await fetch(`/api/preferences/${prefId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Delete failed')

      await loadData()
    } catch (error) {
      console.error('Error deleting preference:', error)
      alert('Error deleting preference')
    }
  }

  async function handleToggleActive(pref: BookingPreference) {
    try {
      const response = await fetch(`/api/preferences/${pref.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pref,
          active: !pref.active,
        }),
      })

      if (!response.ok) throw new Error('Toggle failed')

      await loadData()
    } catch (error) {
      console.error('Error toggling preference:', error)
      alert('Error toggling preference')
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
              {restaurant.release_pattern} @ {format12Hour(restaurant.release_time)} ET • {restaurant.location}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Warning if release pattern unknown */}
        {restaurant && (!restaurant.release_pattern || restaurant.release_pattern === 'unknown') && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-900 font-medium mb-2">📋 Release Pattern Not Set</p>
            <p className="text-sm text-amber-800 mb-3">
              You need to research and set the release pattern before adding booking preferences. Go back and click "Research & Update" on the restaurant.
            </p>
            <button
              onClick={() => router.push('/restaurants')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Back to Restaurants
            </button>
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={!restaurant || !restaurant.release_pattern || restaurant.release_pattern === 'unknown'}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            + Add Booking Preference
          </button>
        </div>

        {/* Form with Calendar */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 border-l-4 border-indigo-600">
            {/* Calendar */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingId ? '✏️ Edit Preference' : '➕ Add New Preference'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Earliest available: <strong>{earliestDate.toLocaleDateString()}</strong>
              </p>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                    className="px-3 py-1 hover:bg-gray-100 rounded"
                  >
                    ←
                  </button>
                  <h4 className="font-medium text-gray-900">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h4>
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                    className="px-3 py-1 hover:bg-gray-100 rounded"
                  >
                    →
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} />
                    }

                    const dateStr = formatDateISO(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth(),
                      day
                    )
                    const isSelected = selectedDates.has(dateStr)
                    const isBefore = new Date(dateStr) < earliestDate
                    const isDisabled = isBefore

                    return (
                      <button
                        key={dateStr}
                        onClick={() => !isDisabled && toggleDate(dateStr)}
                        disabled={isDisabled}
                        className={`p-2 text-sm rounded font-medium transition ${
                          isSelected
                            ? 'bg-green-500 text-white'
                            : isDisabled
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 hover:bg-indigo-50 text-gray-900'
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Selected dates preview */}
              {selectedDates.size > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm font-medium text-green-900 mb-1">
                    Selected: {selectedDates.size} date{selectedDates.size !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-green-800 font-medium">
                    {formatDateRanges(Array.from(selectedDates))}
                  </p>
                </div>
              )}
            </div>

            {/* Preference Settings */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Details</h3>
              <form onSubmit={handleSavePreference} className="space-y-4">
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
                    Earliest Preferred Time
                  </label>
                  <input
                    type="time"
                    value={(formData.preferred_times as any)?.start ?? '19:00'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferred_times: { 
                          ...(formData.preferred_times as any),
                          start: e.target.value 
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latest Preferred Time
                  </label>
                  <input
                    type="time"
                    value={(formData.preferred_times as any)?.end ?? '21:30'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferred_times: { 
                          ...(formData.preferred_times as any),
                          end: e.target.value 
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                  <p className="text-xs text-gray-500 mt-1">Higher = book sooner if multiple times available</p>
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

                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">Preview</p>
                  <p className="text-sm text-blue-800">
                    The bot will try to book a table for <strong>{formData.party_size}</strong> between{' '}
                    <strong>{format12Hour((formData.preferred_times as any).start)}</strong> and{' '}
                    <strong>{format12Hour((formData.preferred_times as any).end)}</strong> on{' '}
                    <strong>{selectedDates.size === 0 ? '0' : selectedDates.size}</strong> date
                    {selectedDates.size !== 1 ? 's' : ''} (books earliest available)
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={selectedDates.size === 0}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    {editingId ? 'Update Preference' : 'Add Preference'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingId(null)
                      setSelectedDates(new Set())
                      setFormData({
                        party_size: 2,
                        preferred_times: { start: '19:00', end: '21:30' },
                        priority: 5,
                        notes: '',
                      })
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preferences List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Preferences</h2>
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
            <div className="space-y-4">
              {preferences.map((pref) => (
                <div key={pref.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-600">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Party Size</p>
                      <p className="text-lg font-bold text-gray-900">{pref.party_size}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Time Range</p>
                      <p className="text-lg font-bold text-gray-900">
                        {format12Hour((pref.preferred_times as any)?.start) || '—'} – {format12Hour((pref.preferred_times as any)?.end) || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Target Dates</p>
                      <p className="text-lg font-bold text-gray-900">{pref.target_dates?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Priority</p>
                      <p className="text-lg font-bold text-gray-900">{pref.priority}/10</p>
                    </div>
                  </div>

                  {/* Show dates */}
                  {pref.target_dates && pref.target_dates.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-gray-600 mb-2">Dates</p>
                      <p className="text-sm text-indigo-900 font-medium">
                        {formatDateRanges(pref.target_dates as string[])}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(pref)}
                        className={`px-2 py-1 rounded text-xs font-medium transition ${
                          pref.active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {pref.active ? '✓ Active' : '○ Inactive'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(pref)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePreference(pref.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
