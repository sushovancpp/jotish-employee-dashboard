import { useState, useEffect } from 'react'

const API_URL = '/api/gettabledata'

function normaliseRow(r, i) {
  const salaryRaw = String(r[5] ?? '0').replace(/[$,]/g, '')
  return {
    id:          `${r[3]}_${i}`,
    name:        r[0]  ?? '—',
    email:       `${String(r[0] ?? '').toLowerCase().replace(/\s+/g, '.')}@company.com`,
    city:        r[2]  ?? '—',
    salary:      Number(salaryRaw) || 0,
    department:  '—',
    designation: r[1]  ?? '—',
    phone:       '—',
    startDate:   r[4]  ?? '—',
  }
}

async function fetchData() {
  const res = await fetch(API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ username: import.meta.env.VITE_API_USERNAME, password: import.meta.env.VITE_API_PASSWORD }),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = JSON.parse(text)
  const rows = json?.TABLE_DATA?.data ?? []
  console.log(`[EID] ${rows.length} rows loaded. First:`, rows[0])
  return rows
}

export function useEmployeeData() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let cancelled = false

    fetchData()
      .then(rows => {
        if (!cancelled) {
          setData(rows.map(normaliseRow))
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}