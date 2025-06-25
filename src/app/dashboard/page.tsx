'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Questionnaire {
  id: string
  title: string
  description: string
  category: string
  year: number
  progress_percentage: number
  is_completed: boolean
  completed_at: string | null
  updated_at: string | null
  question_count: number
  answered_count: number
  estimated_minutes: number
  status: 'not_started' | 'in_progress' | 'completed'
}

interface DashboardData {
  user: {
    name: string
    organization: string
    user_type: string
  }
  questionnaires: Questionnaire[]
  stats: {
    total: number
    completed: number
    in_progress: number
    not_started: number
    overall_progress: number
    total_questions: number
    answered_questions: number
    estimated_remaining_minutes: number
  }
  year: number
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          router.push('/auth/login')
          return
        }

        const response = await fetch('/api/dashboard/manager', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
        } else {
          setError('שגיאה בטעינת נתוני הדשבורד')
          if (response.status === 401) {
            localStorage.removeItem('authToken')
            router.push('/auth/login')
          }
        }
      } catch (error) {
        setError('שגיאה בחיבור לשרת')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    router.push('/')
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_started': return 'לא התחיל'
      case 'in_progress': return 'בתהליך'
      case 'completed': return 'הושלם'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-700 border border-gray-200'
      case 'in_progress': return 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      default: return 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  }

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'accessibility': 'נגישות',
      'accounting': 'הנהלת חשבונות', 
      'budget': 'תקציב',
      'community': 'קהילה',
      'financial': 'ניהול כספי',
      'hr': 'משאבי אנוש',
      'inventory': 'מלאי',
      'legal': 'משפטי',
      'salary': 'שכר',
      'security': 'אבטחה',
      'sgarot': 'סגרות',
      'general': 'כללי'
    }
    return categoryMap[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'accessibility': '#8b5cf6',
      'accounting': '#3b82f6', 
      'budget': '#10b981',
      'community': '#ec4899',
      'financial': '#059669',
      'hr': '#f97316',
      'inventory': '#06b6d4',
      'legal': '#6366f1',
      'salary': '#eab308',
      'security': '#ef4444',
      'sgarot': '#14b8a6',
      'general': '#6b7280'
    }
    return colorMap[category] || '#6b7280'
  }

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{textAlign: 'center'}}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem auto'
          }}></div>
                      <p style={{
              color: '#4a5568',
              fontSize: '1.1rem',
              fontWeight: '500'
            }}>
              טוען נתונים...
            </p>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold'}}>!</span>
            </div>
          </div>
                      <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '1rem'
            }}>
              שגיאה
            </h1>
            <p style={{
              color: '#718096',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              {error || 'לא ניתן לטעון את הנתונים'}
            </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.transform = 'translateY(-1px)'
              target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.transform = 'translateY(0)'
              target.style.boxShadow = 'none'
            }}
                      >
              נסה שוב
            </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '2rem'
          }}>
            <div>
              {/* Logo */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '6px'
                  }}></div>
                </div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px'
                }}>
                  מערכת שאלונים
                </h1>
              </div>
              <p style={{
                fontSize: '1.2rem',
                color: '#2d3748',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                {dashboardData.user.organization}
              </p>
              <p style={{
                fontSize: '1rem',
                color: '#718096',
                marginBottom: '0.25rem'
              }}>
                שלום {dashboardData.user.name}
              </p>
              <p style={{
                fontSize: '0.9rem',
                color: '#a0aec0'
              }}>
                שנת {dashboardData.year}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement
                target.style.transform = 'translateY(-1px)'
                target.style.boxShadow = '0 6px 20px rgba(45, 55, 72, 0.3)'
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement
                target.style.transform = 'translateY(0)'
                target.style.boxShadow = 'none'
              }}
                          >
                התנתקות
              </button>
          </div>

          {/* Progress Overview */}
          <div style={{
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4a5568'
              }}>
                התקדמות כללית
              </span>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {dashboardData.stats.overall_progress}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: '#e2e8f0',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div 
                style={{
                  height: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '6px',
                  transition: 'width 0.8s ease-out',
                  width: `${dashboardData.stats.overall_progress}%`
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#667eea',
                  marginBottom: '0.5rem'
                }}>
                  {dashboardData.stats.total}
                </div>
                <div style={{
                  color: '#718096',
                  fontWeight: '500'
                }}>
                  סה"כ שאלונים
                </div>
              </div>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#10b981',
                  marginBottom: '0.5rem'
                }}>
                  {dashboardData.stats.completed}
                </div>
                <div style={{
                  color: '#718096',
                  fontWeight: '500'
                }}>
                  הושלמו
                </div>
              </div>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '50%'
                }}></div>
              </div>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#f59e0b',
                  marginBottom: '0.5rem'
                }}>
                  {dashboardData.stats.in_progress}
                </div>
                <div style={{
                  color: '#718096',
                  fontWeight: '500'
                }}>
                  בתהליך
                </div>
              </div>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '3px solid rgba(255, 255, 255, 0.9)',
                  borderTop: '3px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 2s linear infinite'
                }}></div>
              </div>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  {dashboardData.stats.not_started}
                </div>
                <div style={{
                  color: '#718096',
                  fontWeight: '500'
                }}>
                  לא התחילו
                </div>
              </div>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '50%',
                  border: '3px solid transparent'
                }}></div>
              </div>
            </div>
          </div>

          {/* New Stats - Questions Answered */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#8b5cf6',
                  marginBottom: '0.5rem'
                }}>
                  {dashboardData.stats.answered_questions}
                </div>
                <div style={{
                  color: '#718096',
                  fontWeight: '500'
                }}>
                  שאלות נענו
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#a0aec0'
                }}>
                  מתוך {dashboardData.stats.total_questions}
                </div>
              </div>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: '#8b5cf6',
                    borderRadius: '2px'
                  }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Estimated Time Remaining */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#06b6d4',
                  marginBottom: '0.5rem'
                }}>
                  {Math.ceil(dashboardData.stats.estimated_remaining_minutes / 60)}
                </div>
                <div style={{
                  color: '#718096',
                  fontWeight: '500'
                }}>
                  שעות נותרות
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#a0aec0'
                }}>
                  זמן מוערך
                </div>
              </div>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid rgba(255, 255, 255, 0.9)',
                  borderRadius: '50%',
                  borderTopColor: 'transparent',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    width: '6px',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questionnaires Grid */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '2rem',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#2d3748',
              margin: 0
            }}>
              רשימת שאלונים
            </h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            padding: '2rem'
          }}>
            {dashboardData.questionnaires.map((questionnaire) => (
              <div 
                key={questionnaire.id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => router.push(`/questionnaire/${questionnaire.category}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* Header */}
                <div style={{
                  background: getCategoryColor(questionnaire.category),
                  padding: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: 'white',
                      margin: 0
                    }}>
                      {getCategoryDisplayName(questionnaire.category)}
                    </h3>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      background: questionnaire.status === 'completed' ? '#d1fae5' : 
                                questionnaire.status === 'in_progress' ? '#fef3c7' : '#f3f4f6',
                      color: questionnaire.status === 'completed' ? '#065f46' : 
                            questionnaire.status === 'in_progress' ? '#92400e' : '#374151',
                      border: questionnaire.status === 'completed' ? '1px solid #a7f3d0' : 
                             questionnaire.status === 'in_progress' ? '1px solid #fcd34d' : '1px solid #d1d5db'
                    }}>
                      {getStatusText(questionnaire.status)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{padding: '1.5rem'}}>
                  <p style={{
                    color: '#718096',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    marginBottom: '1rem',
                    minHeight: '2.5rem'
                  }}>
                    {questionnaire.description}
                  </p>

                  {/* Question Info */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{color: '#4a5568'}}>
                      📝 {questionnaire.answered_count}/{questionnaire.question_count} שאלות
                    </div>
                    <div style={{color: '#6b7280'}}>
                      ⏱️ ~{questionnaire.estimated_minutes} דקות
                    </div>
                  </div>
                  
                  <div style={{marginBottom: '1.5rem'}}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        color: '#4a5568'
                      }}>
                        התקדמות
                      </span>
                      <span style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#2d3748'
                      }}>
                        {questionnaire.progress_percentage}%
                      </span>
                    </div>
                    
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div 
                        style={{
                          height: '100%',
                          background: questionnaire.is_completed ? 
                            'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                            questionnaire.progress_percentage > 0 ? 
                              'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#d1d5db',
                          borderRadius: '4px',
                          transition: 'width 0.8s ease-out',
                          width: `${questionnaire.progress_percentage}%`
                        }}
                      ></div>
                    </div>
                    
                    {questionnaire.completed_at && (
                      <p style={{
                        fontSize: '0.8rem',
                        color: '#059669',
                        background: '#d1fae5',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        marginTop: '1rem',
                        border: '1px solid #a7f3d0'
                      }}>
                        הושלם: {new Date(questionnaire.completed_at).toLocaleDateString('he-IL')}
                      </p>
                    )}
                  </div>
                  
                  <button style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: getCategoryColor(questionnaire.category),
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.transform = 'translateY(-1px)'
                    target.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.transform = 'translateY(0)'
                    target.style.opacity = '1'
                  }}>
                    {questionnaire.status === 'completed' ? 'צפה בתשובות' : 
                     questionnaire.status === 'in_progress' ? 'המשך מילוי' : 'התחל מילוי'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}