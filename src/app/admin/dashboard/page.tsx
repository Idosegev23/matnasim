'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AdminDashboardData {
  admin: {
    name: string
    email: string
    organization: string
  }
  stats: {
    total_managers: number
    active_questionnaires: number
    completed_this_month: number
    pending_invitations: number
  }
  recent_activity: Array<{
    id: number
    type: string
    manager_name: string
    questionnaire_title?: string
    timestamp: string
  }>
  managers_progress: Array<{
    id: string
    name: string
    email: string
    progress: number
    completed_questionnaires: number
    total_questionnaires: number
    last_activity: string
  }>
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteDeadline, setInviteDeadline] = useState('')
  const [generatedToken, setGeneratedToken] = useState('')
  const [creating, setCreating] = useState(false)
  const [wasReplaced, setWasReplaced] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          router.push('/admin/login')
          return
        }

        const response = await fetch('/api/dashboard/admin', {
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
            router.push('/admin/login')
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

  const refreshDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/dashboard/admin', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error)
    }
  }

  const createInvitation = async (replaceExisting = false) => {
    if (!inviteEmail || !inviteDeadline) {
      alert('אנא מלא את כל השדות')
      return
    }

    setCreating(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          deadline: inviteDeadline,
          replaceExisting
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedToken(data.token)
        setWasReplaced(data.replaced || false)
        setShowInviteModal(false)
        setShowTokenModal(true)
        setInviteEmail('')
        setInviteDeadline('')
        // Don't refresh automatically - let user close the modal first
      } else if (response.status === 409) {
        // Conflict - invitation already exists
        const errorData = await response.json()
        const confirmReplace = confirm(
          `הזמנה קיימת כבר נשלחה לכתובת זו.\n\n` +
          `הטוקן הקיים: ${errorData.existingToken}\n\n` +
          `האם לבטל את ההזמנה הקיימת וליצור חדשה?\n` +
          `(הטוקן הישן יפסיק לעבוד)`
        )
        
        if (confirmReplace) {
          // Retry with replaceExisting = true
          createInvitation(true)
          return
        }
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'שגיאה ביצירת ההזמנה')
      }
    } catch (error) {
      alert('שגיאה בחיבור לשרת')
    } finally {
      setCreating(false)
    }
  }

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case 'questionnaire_completed':
        return `${activity.manager_name} השלים את ${activity.questionnaire_title}`
      case 'manager_registered':
        return `${activity.manager_name} נרשם למערכת`
      case 'questionnaire_started':
        return `${activity.manager_name} התחיל את ${activity.questionnaire_title}`
      default:
        return 'פעילות לא מזוהה'
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner"></div>
        <p className="text-center">טוען נתונים...</p>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="text-center">
            <h1 className="card-title">שגיאה</h1>
            <p className="card-subtitle">{error || 'לא ניתן לטעון את הנתונים'}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">דשבורד מנהל בכיר</h1>
        <p>שלום {dashboardData.admin.name} - {dashboardData.admin.organization}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowInviteModal(true)} 
            className="btn btn-primary"
          >
            הזמנה חדשה
          </button>
          <button onClick={handleLogout} className="btn btn-secondary">
            התנתקות
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-number">{dashboardData.stats.total_managers}</div>
          <div className="stat-label">מנהלי מתנ"ס</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{dashboardData.stats.active_questionnaires}</div>
          <div className="stat-label">שאלונים פעילים</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{dashboardData.stats.completed_this_month}</div>
          <div className="stat-label">הושלמו החודש</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{dashboardData.stats.pending_invitations}</div>
          <div className="stat-label">הזמנות ממתינות</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Activity */}
        <div className="card">
          <h3 className="mb-4">פעילות אחרונה</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {dashboardData.recent_activity.length > 0 ? (
              dashboardData.recent_activity.map((activity) => (
                <div key={activity.id} style={{ 
                  padding: '10px 0', 
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '14px'
                }}>
                  <p>{getActivityText(activity)}</p>
                  <p style={{ color: '#718096', fontSize: '12px' }}>
                    {new Date(activity.timestamp).toLocaleString('he-IL')}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: '#718096', textAlign: 'center' }}>אין פעילות אחרונה</p>
            )}
          </div>
        </div>

        {/* Managers Progress */}
        <div className="card">
          <h3 className="mb-4">התקדמות מנהלים</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {dashboardData.managers_progress.length > 0 ? (
              dashboardData.managers_progress.map((manager) => (
                <div key={manager.id} style={{ 
                  padding: '15px 0', 
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '600' }}>{manager.name}</h4>
                      <p style={{ fontSize: '14px', color: '#718096' }}>{manager.email}</p>
                      <p style={{ fontSize: '12px', color: '#718096' }}>
                        {manager.completed_questionnaires}/{manager.total_questionnaires} שאלונים
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: '#4299e1' 
                      }}>
                        {manager.progress}%
                      </div>
                    </div>
                  </div>
                  <div className="progress-container" style={{ marginTop: '10px' }}>
                    <div className="progress-bar" style={{ height: '6px' }}>
                      <div 
                        className="progress-fill" 
                        style={{ width: `${manager.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#718096', textAlign: 'center' }}>אין מנהלים רשומים</p>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
                     <div className="card" style={{ maxWidth: '400px', margin: '0' }}>
             <h3 className="mb-4">יצירת הזמנה חדשה</h3>
             <p style={{ color: '#718096', fontSize: '14px', marginBottom: '20px' }}>
               יצירת הזמנה למילוי השאלון השנתי
             </p>
             
             <div className="form-group">
               <label className="form-label">אימייל מנהל המתנ"ס</label>
               <input
                 type="email"
                 className="form-input"
                 placeholder="manager@matnasim.gov.il"
                 value={inviteEmail}
                 onChange={(e) => setInviteEmail(e.target.value)}
               />
             </div>
             
             <div className="form-group">
               <label className="form-label">תאריך סיום (דדליין)</label>
               <input
                 type="date"
                 className="form-input"
                 min={new Date().toISOString().split('T')[0]}
                 value={inviteDeadline}
                 onChange={(e) => setInviteDeadline(e.target.value)}
                 title="בחרו תאריך עד אליו המנהל יוכל להתחבר ולמלא את השאלון"
               />
               <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                 💡 עד תאריך זה המנהל יוכל להירשם ולמלא את השאלון
               </small>
             </div>

             <div style={{ 
               backgroundColor: '#f0f9ff', 
               padding: '15px', 
               borderRadius: '8px',
               fontSize: '14px',
               color: '#0369a1',
               marginBottom: '20px'
             }}>
               <strong>מה יקרה לאחר יצירת ההזמנה:</strong><br />
               🔑 ייווצר טוקן הזמנה ייחודי למנהל זה<br />
               📋 תקבלו פופאפ עם הקישור והטוקן<br />
               📤 תוכלו להעתיק ולשלוח למנהל המתנ"ס<br />
               📝 המנהל יוכל להירשם ולמלא את השאלון השנתי
             </div>
             
             <div style={{ display: 'flex', gap: '10px' }}>
               <button 
                 className="btn btn-primary" 
                 style={{ flex: 1 }}
                 onClick={() => createInvitation()}
                 disabled={creating}
               >
                 {creating ? 'יוצר...' : 'צור הזמנה'}
               </button>
               <button 
                 className="btn btn-secondary" 
                 style={{ flex: 1 }}
                 onClick={() => setShowInviteModal(false)}
                 disabled={creating}
               >
                 ביטול
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Token Display Modal */}
      {showTokenModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            // Close if clicking on overlay (not on the modal itself)
            if (e.target === e.currentTarget) {
              setShowTokenModal(false)
              setWasReplaced(false)
              refreshDashboardData()
            }
          }}
        >
          <div className="card" style={{ 
            maxWidth: '600px', 
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            margin: '0',
            position: 'relative'
          }}>
            {/* Close button */}
            <button 
              onClick={() => {
                setShowTokenModal(false)
                setWasReplaced(false)
                refreshDashboardData()
              }}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '5px',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="סגור"
            >
              ×
            </button>
            
            <h3 className="mb-4" style={{ paddingRight: '50px' }}>
              {wasReplaced ? 'הזמנה הוחלפה בהצלחה! 🔄' : 'הזמנה נוצרה בהצלחה! 🎉'}
            </h3>
            {wasReplaced && (
              <div style={{ 
                backgroundColor: '#fff4e6', 
                border: '1px solid #f7b500',
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '14px',
                color: '#8b4513'
              }}>
                <strong>⚠️ הודעה חשובה:</strong><br />
                ההזמנה הקודמת בוטלה והטוקן הישן כבר לא תקין.<br />
                השתמש רק בטוקן החדש שמוצג למטה.
              </div>
            )}
            <p style={{ color: '#4a5568', fontSize: '14px', marginBottom: '20px' }}>
              שלח למנהל המתנ"ס את הפרטים הבאים דרך מייל או וואטסאפ:
            </p>
            
            <div style={{ 
              backgroundColor: '#f0fff4', 
              border: '2px solid #38a169',
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <p style={{ marginBottom: '15px', fontWeight: '600' }}>
                טוקן ההזמנה:
              </p>
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '15px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '16px',
                wordBreak: 'break-all',
                color: '#2d3748'
              }}>
                {generatedToken}
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(generatedToken)}
                className="btn btn-secondary"
                style={{ marginTop: '10px', fontSize: '14px' }}
              >
                העתק לחיפוש
              </button>
            </div>

                         <div style={{ 
               backgroundColor: '#fffbf0', 
               padding: '20px', 
               borderRadius: '8px',
               fontSize: '14px',
               color: '#975a16',
               marginBottom: '20px',
               lineHeight: '1.6'
             }}>
               <div style={{ marginBottom: '20px' }}>
                 <strong style={{ fontSize: '16px', color: '#d97706' }}>הודעה למנהל המתנ"ס</strong>
               </div>
               
               <div style={{ marginBottom: '15px' }}>
                 שלום רב,<br />
                 אתם מוזמנים למלא את השאלון השנתי של המתנ"ס.<br />
                 השאלון כולל 11 קטגוריות ויכול להימלא על פני מספר פעמים.
               </div>

               <div style={{ 
                 backgroundColor: '#ffffff', 
                 padding: '15px', 
                 borderRadius: '6px',
                 border: '1px solid #d4ab00',
                 marginBottom: '15px'
               }}>
                 <strong>שלבי ההרשמה:</strong><br />
                 1️⃣ כנסו לקישור ההרשמה המצורף<br />
                 2️⃣ הזינו את טוקן ההזמנה<br />
                 3️⃣ מלאו את פרטי ההרשמה<br />
                 4️⃣ התחילו למלא את השאלון השנתי
               </div>
               
               <div style={{ marginBottom: '10px' }}>
                 <strong>🔗 קישור הרשמה:</strong><br />
                 <code style={{ fontSize: '12px', wordBreak: 'break-all', backgroundColor: '#fff', padding: '5px', borderRadius: '3px' }}>
                   {window.location.origin}/auth/register
                 </code>
               </div>
               
               <div>
                 <strong>🔑 טוקן הזמנה:</strong><br />
                 <code style={{ fontSize: '13px', fontWeight: 'bold', wordBreak: 'break-all', backgroundColor: '#fff', padding: '8px', borderRadius: '3px', color: '#1f2937' }}>
                   {generatedToken}
                 </code>
               </div>
             </div>
            
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
               <button 
                 className="btn btn-primary" 
                 onClick={() => {
                   navigator.clipboard.writeText(`${window.location.origin}/auth/register`);
                   alert('קישור ההרשמה הועתק לזיכרון! 📋');
                 }}
               >
                 📋 העתק קישור
               </button>
               <button 
                 className="btn btn-primary" 
                 onClick={() => {
                   navigator.clipboard.writeText(generatedToken);
                   alert('הטוקן הועתק לזיכרון! 🔑');
                 }}
               >
                 🔑 העתק טוקן
               </button>
             </div>

             <div style={{ 
               backgroundColor: '#e0f2fe', 
               padding: '15px', 
               borderRadius: '8px',
               fontSize: '13px',
               color: '#0277bd',
               marginBottom: '15px',
               textAlign: 'center'
             }}>
               💡 <strong>חשוב:</strong> העתיקו את הקישור והטוקן לפני סגירת החלון!<br />
               נתוני הדשבורד יתעדכנו רק כשתסגרו את החלון.
             </div>

             <div style={{ textAlign: 'center', marginTop: '30px' }}>
               <button 
                 className="btn btn-primary" 
                 style={{ 
                   fontSize: '16px',
                   padding: '12px 30px',
                   minWidth: '150px'
                 }}
                 onClick={() => {
                   setShowTokenModal(false)
                   setWasReplaced(false)
                   refreshDashboardData() // Refresh only when closing
                 }}
               >
                 ✅ סגור וסיים
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
} 