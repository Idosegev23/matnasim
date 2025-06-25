'use client'

import React from 'react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="page-container">
      <div className="card" style={{maxWidth: '600px', position: 'relative'}}>
        {/* Hero Section */}
        <div className="card-header" style={{textAlign: 'center', marginBottom: '3rem'}}>
          {/* Logo Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
            position: 'relative'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                borderRadius: '6px'
              }}></div>
            </div>
          </div>
          
          <h1 className="card-title" style={{
            background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '2.5rem',
            marginBottom: '1rem',
            fontWeight: '700',
            letterSpacing: '-0.5px'
          }}>
            מערכת שאלונים למתנ"סים
          </h1>
          
          <p className="card-subtitle" style={{
            fontSize: '1.1rem',
            color: '#718096',
            marginBottom: '3rem',
            lineHeight: '1.6',
            maxWidth: '450px',
            margin: '0 auto 3rem auto'
          }}>
            פלטפורמה מתקדמת לניהול שאלונים שנתיים עם ממשק אינטואיטיביי ודוחות מפורטים
          </p>

          {/* Feature Pills */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '3rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: 'rgba(102, 126, 234, 0.1)',
              color: '#667eea',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              ניהול מתקדם
            </div>
            <div style={{
              background: 'rgba(39, 174, 96, 0.1)',
              color: '#27ae60',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              אבטחה גבוהה
            </div>
            <div style={{
              background: 'rgba(255, 184, 77, 0.1)',
              color: '#f39c12',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              ממשק מהיר
            </div>
          </div>
        </div>
        
        {/* Action Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Manager Card */}
          <div style={{
            background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            position: 'relative'
          }} 
          className="hover-card manager-card">
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '15px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25)'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '6px'
              }}></div>
            </div>
            
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '1rem'
            }}>
              מנהל מתנ"ס
            </h3>
            
            <p style={{
              color: '#718096',
              marginBottom: '2rem',
              lineHeight: '1.6',
              fontSize: '0.95rem'
            }}>
              מילוי שאלונים שנתיים, מעקב אחר התקדמות וניהול נתוני המתנ"ס בממשק פשוט ואינטואיטיבי
            </p>
            
            <Link href="/auth/login" className="btn btn-primary btn-full" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              fontSize: '1rem',
              padding: '12px 32px',
              borderRadius: '12px',
              fontWeight: '600',
              color: 'white',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}>
              כניסה למערכת
            </Link>
          </div>

          {/* Admin Card */}
          <div style={{
            background: 'linear-gradient(135deg, #fff 0%, #fafafa 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            position: 'relative'
          }}
          className="hover-card admin-card">
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
              borderRadius: '15px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 25px rgba(45, 55, 72, 0.25)'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '6px'
              }}></div>
            </div>
            
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '1rem'
            }}>
              מנהל מערכת
            </h3>
            
            <p style={{
              color: '#718096',
              marginBottom: '2rem',
              lineHeight: '1.6',
              fontSize: '0.95rem'
            }}>
              ניהול המערכת, יצירת הזמנות, מעקב אחר התקדמות כלל המתנ"סים ויצירת דוחות מקיפים
            </p>
            
            <Link href="/admin/login" className="btn btn-secondary btn-full" style={{
              background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
              border: 'none',
              fontSize: '1rem',
              padding: '12px 32px',
              borderRadius: '12px',
              fontWeight: '600',
              color: 'white',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}>
              כניסה לניהול
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem 1rem 1rem',
          borderTop: '1px solid #e2e8f0',
          marginTop: '2rem',
          color: '#a0aec0',
          fontSize: '0.9rem'
        }}>
          <div style={{fontWeight: '500', marginBottom: '0.5rem'}}>
            מערכת שאלונים דיגיטלית למתנ"סים
          </div>
          <div style={{fontSize: '0.8rem', opacity: '0.8'}}>
            שנת 2025 • פיתוח מתקדם ואמין
          </div>
        </div>
      </div>

      {/* Subtle Decorative Elements */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '15%',
        width: '40px',
        height: '40px',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        borderRadius: '50%',
        opacity: 0.1,
        animation: 'float 6s ease-in-out infinite'
      }}></div>
      
      <div style={{
        position: 'absolute',
        bottom: '25%',
        right: '20%',
        width: '30px',
        height: '30px',
        background: 'linear-gradient(135deg, #2d3748, #4a5568)',
        borderRadius: '50%',
        opacity: 0.1,
        animation: 'float 8s ease-in-out infinite reverse'
      }}></div>

      <div style={{
        position: 'absolute',
        top: '60%',
        left: '10%',
        width: '20px',
        height: '20px',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        borderRadius: '4px',
        opacity: 0.1,
        animation: 'float 10s ease-in-out infinite'
      }}></div>
    </div>
  )
} 