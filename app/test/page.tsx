'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format12Hour, formatDateRanges } from '@/lib/time-utils'

export default function TestPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function runTest() {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/booking/test', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Testing & Debug</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Manual Booking Test</h2>
          <p className="text-gray-600 mb-6">
            Trigger the booking scheduler manually to test the full pipeline without waiting for the daily cron.
          </p>

          <button
            onClick={runTest}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            {loading ? 'Running...' : '▶️ Run Booking Scheduler'}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {results && (
            <div className="mt-8 space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>Last Run:</strong> {new Date(results.timestamp).toLocaleString()}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Total Attempts:</strong> {results.attempts.length}
                </p>
              </div>

              {results.attempts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded border border-gray-200">
                  <p className="text-gray-600">No booking attempts made.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This could mean: no active preferences, no restaurants enabled, or no dates matched.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900">Booking Attempts:</h3>
                  {results.attempts.map((attempt: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded border-l-4 ${
                        attempt.success
                          ? 'bg-green-50 border-green-400'
                          : 'bg-red-50 border-red-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{attempt.restaurantName}</p>
                          <p className="text-sm text-gray-600">
                            {attempt.date} @ {attempt.time} (Party of {attempt.partySize})
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap ${
                            attempt.success
                              ? 'bg-green-200 text-green-800'
                              : 'bg-red-200 text-red-800'
                          }`}
                        >
                          {attempt.success ? '✓ SUCCESS' : '✗ FAILED'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{attempt.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {results.attempts.filter((a: any) => a.success).length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-900 font-bold text-lg">
                    🎉 {results.attempts.filter((a: any) => a.success).length} booking
                    {results.attempts.filter((a: any) => a.success).length !== 1 ? 's' : ''}{' '}
                    confirmed!
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    Check the Activity Log and Booked Confirmations pages for details.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-3">How to Test</h3>
          <ol className="text-sm text-blue-900 space-y-2 list-decimal list-inside">
            <li>Add a restaurant with open availability (preferably for this week)</li>
            <li>Create a booking preference for dates that have availability now</li>
            <li>Click "Run Booking Scheduler" above</li>
            <li>Results will appear instantly — no waiting for the daily 10am cron</li>
            <li>Check Activity Log and Booked Confirmations to see results</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
