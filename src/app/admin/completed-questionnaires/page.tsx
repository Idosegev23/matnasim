'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CompletedQuestionnaire {
  id: string
  completion_date: string
  year: number
  progress_percentage: number
  user: {
    id: string
    name: string
    email: string
    organization: string
  }
  questionnaire: {
    id: string
    title: string
    category: string
    description: string
  }
}

interface CompletedData {
  stats: {
    total_completed: number
    unique_users: number
    categories_completed: number
    completion_rate_this_month: number
  }
  completed_questionnaires: CompletedQuestionnaire[]
  by_category: Array<{
    category: string
    title: string
    completions: CompletedQuestionnaire[]
  }>
}

export default function CompletedQuestionnairesPage() {
  const [data, setData] = useState<CompletedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/admin/login')
          return
        }

        const response = await fetch('/api/admin/completed-questionnaires', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else {
          setError('שגיאה בטעינת נתוני השאלונים המושלמים')
          if (response.status === 401) {
            localStorage.removeItem('token')
            router.push('/admin/login')
          }
        }
      } catch (error) {
        setError('שגיאה בחיבור לשרת')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleViewResponses = (userId: string, questionnaireId: string) => {
    router.push(`/admin/questionnaire-responses/${userId}/${questionnaireId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      accessibility: '♿',
      accounting: '📊',
      budget: '💰',
      community: '🏘️',
      financial: '💼',
      hr: '👥',
      inventory: '📦',
      legal: '⚖️',
      salary: '💵',
      security: '🔒',
      sgarot: '📋',
      general: '📄'
    }
    return icons[category] || '📄'
  }

  const filteredQuestionnaires = data?.completed_questionnaires.filter(item => {
    const categoryMatch = selectedCategory === 'all' || item.questionnaire.category === selectedCategory
    const userMatch = selectedUser === 'all' || item.user.id === selectedUser
    return categoryMatch && userMatch
  }) || []

  const uniqueUsers = data?.completed_questionnaires.reduce((acc: any[], item) => {
    if (!acc.find(user => user.id === item.user.id)) {
      acc.push(item.user)
    }
    return acc
  }, []) || []

  if (loading) {
    return (
      <div className="page-container" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div className="container">
          <div className="card" style={{ textAlign: 'center', maxWidth: '600px' }}>
            <div className="loading" style={{ margin: '40px auto' }}>
              <div className="spinner"></div>
            </div>
            <h2>טוען נתוני שאלונים מושלמים...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page-container" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div className="container">
          <div className="card" style={{ textAlign: 'center', maxWidth: '600px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>שגיאה</h2>
            <p style={{ marginBottom: '30px' }}>{error || 'לא ניתן לטעון את הנתונים'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '30px',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '42px', 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '10px'
              }}>
                📊 שאלונים מושלמים
              </h1>
              <p style={{ color: '#6c757d', fontSize: '18px' }}>
                צפייה בשאלונים שהושלמו על ידי המנהלים
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="btn btn-secondary"
              style={{ 
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              ← חזרה לדשבורד
            </button>
          </div>

          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '25px',
            marginBottom: '40px'
          }}>
            <div className="card hover-card" style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb', marginBottom: '10px' }}>
                {data.stats.total_completed}
              </div>
              <div style={{ color: '#6c757d', fontSize: '16px' }}>סה"כ שאלונים מושלמים</div>
            </div>
            
            <div className="card hover-card" style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a085', marginBottom: '10px' }}>
                {data.stats.unique_users}
              </div>
              <div style={{ color: '#6c757d', fontSize: '16px' }}>משתמשים פעילים</div>
            </div>
            
            <div className="card hover-card" style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📝</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8e44ad', marginBottom: '10px' }}>
                {data.stats.categories_completed}
              </div>
              <div style={{ color: '#6c757d', fontSize: '16px' }}>קטגוריות מושלמות</div>
            </div>
            
            <div className="card hover-card" style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📈</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e67e22', marginBottom: '10px' }}>
                {data.stats.completion_rate_this_month}%
              </div>
              <div style={{ color: '#6c757d', fontSize: '16px' }}>שיעור השלמה החודש</div>
            </div>
          </div>

          {/* Filters */}
          <div className="card" style={{ padding: '25px', marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>🔍 סינון תוצאות</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px' 
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  סינון לפי קטגוריה:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="all">כל הקטגוריות</option>
                  {data.by_category.map(cat => (
                    <option key={cat.category} value={cat.category}>
                      {getCategoryIcon(cat.category)} {cat.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  סינון לפי משתמש:
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="all">כל המשתמשים</option>
                  {uniqueUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.organization})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          <h3 style={{ 
            marginBottom: '25px', 
            color: '#2c3e50',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📋 שאלונים מושלמים ({filteredQuestionnaires.length})
          </h3>
          
          {filteredQuestionnaires.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>📭</div>
              <h3 style={{ color: '#6c757d', marginBottom: '15px' }}>לא נמצאו שאלונים מושלמים</h3>
              <p style={{ color: '#adb5bd' }}>נסה לשנות את הסינון או לחכות לעוד השלמות</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
              gap: '25px' 
            }}>
              {filteredQuestionnaires.map((item) => (
                <div 
                  key={`${item.user.id}-${item.questionnaire.id}`} 
                  className="card hover-card"
                  style={{ padding: '25px' }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '20px',
                    gap: '15px'
                  }}>
                    <div style={{ fontSize: '36px' }}>
                      {getCategoryIcon(item.questionnaire.category)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: '0 0 5px 0', 
                        color: '#2c3e50',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}>
                        {item.questionnaire.title}
                      </h4>
                      <p style={{ 
                        margin: 0, 
                        color: '#6c757d',
                        fontSize: '14px'
                      }}>
                        {item.questionnaire.category}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontWeight: '500', color: '#495057' }}>התקדמות:</span>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: item.progress_percentage === 100 ? '#27ae60' : '#f39c12',
                        fontSize: '16px'
                      }}>
                        {item.progress_percentage}%
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${item.progress_percentage}%`,
                        height: '100%',
                        background: item.progress_percentage === 100 
                          ? 'linear-gradient(90deg, #27ae60, #2ecc71)'
                          : 'linear-gradient(90deg, #f39c12, #e67e22)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#495057' }}>👤 משתמש:</strong>
                      <span style={{ marginRight: '8px' }}>{item.user.name}</span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#495057' }}>📧 אימייל:</strong>
                      <span style={{ marginRight: '8px' }}>{item.user.email}</span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#495057' }}>🏢 ארגון:</strong>
                      <span style={{ marginRight: '8px' }}>{item.user.organization}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#495057' }}>📅 הושלם:</strong>
                      <span style={{ marginRight: '8px' }}>{formatDate(item.completion_date)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewResponses(item.user.id, item.questionnaire.id)}
                    className="btn btn-primary"
                    style={{ 
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      fontWeight: '500'
                    }}
                  >
                    👁️ צפה בתשובות מפורטות
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 