import '../styles/globals.css'
import React from 'react'

export const metadata = {
  title: 'מערכת שאלונים - מתנ"ס',
  description: 'מערכת ניהול שאלונים עבור מתנ"סים',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
} 