'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    centerName: '',
    invitationToken: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: `מנהל ${formData.centerName}`,
          organizationName: formData.centerName,
          token: formData.invitationToken
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert('ההרשמה הושלמה בהצלחה! כעת תוכלו להתחבר למערכת')
        router.push('/auth/login')
      } else {
        setError(result.error || 'שגיאה בהרשמה')
      }
    } catch (error) {
      setError('שגיאה בחיבור לשרת')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">הרשמה למערכת</h1>
          <p className="card-subtitle">צרו חשבון חדש עם טוקן ההזמנה שקיבלתם</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="invitationToken" className="form-label">טוקן הזמנה</label>
            <input
              type="text"
              id="invitationToken"
              name="invitationToken"
              className="form-input"
              value={formData.invitationToken}
              onChange={handleChange}
              required
              placeholder="הזינו את טוקן ההזמנה שקיבלתם"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">כתובת אימייל</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="example@domain.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="centerName" className="form-label">שם המתנ"ס</label>
            <input
              type="text"
              id="centerName"
              name="centerName"
              className="form-input"
              value={formData.centerName}
              onChange={handleChange}
              required
              placeholder="הזינו את שם המתנס"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">סיסמה</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="לפחות 6 תווים"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">אימות סיסמה</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="הזינו שוב את הסיסמה"
            />
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'נרשם...' : 'הרשמה'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p>
            כבר יש לכם חשבון?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
              התחברות
            </Link>
          </p>
          <Link href="/" className="text-gray-600 hover:text-gray-800">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  )
} 