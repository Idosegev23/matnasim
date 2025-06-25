'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          userType: 'manager'
        }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/dashboard')
      } else {
        setError(data.error || 'שגיאה בכניסה למערכת')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('שגיאה בחיבור לשרת')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            כניסה למערכת
          </h2>
          <p className="card-subtitle">
            מנהלי מתנסים
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              אימייל:
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              style={{ direction: 'ltr' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              סיסמה:
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>

        <div className="text-center mt-4">
          <a 
            href="/auth/register" 
            style={{
              color: 'var(--secondary-color)',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            עדיין לא רשום? הירשם כאן
          </a>
        </div>
      </div>
    </div>
  )
} 