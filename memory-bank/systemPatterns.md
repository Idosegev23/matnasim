# System Patterns - ארכיטקטורה ודפוסים טכניים

## ארכיטקטורה כללית
```
Frontend (Next.js) → API Routes → Supabase Database
```

## מבנה קבצים עיקרי
```
src/
├── app/
│   ├── api/           # API Routes
│   ├── auth/          # עמודי אימות
│   ├── dashboard/     # לוח בקרה
│   └── questionnaire/ # עמודי השאלונים
├── components/        # רכיבי UI
├── lib/              # ספריות עזר
│   ├── auth.ts       # פונקציות אימות
│   └── supabase.ts   # קונפיגורציה של Supabase
└── styles/           # עיצוב
```

## דפוסי אימות
- JWT tokens עם jose library
- Bearer token authentication
- Role-based access (admin/manager)
- Token extraction מheaders
- Password hashing עם bcryptjs

## API Routes Structure
```
/api/auth/
├── login/            # התחברות
└── register/         # הרשמה

/api/dashboard/
├── admin/            # לוח בקרה אדמין
└── manager/          # לוח בקרה מנהל

/api/questionnaire/
└── [category]/
    ├── answers/      # קבלת תשובות
    ├── complete/     # סימון כהושלם
    └── save/         # שמירת תשובות

/api/invitations/
└── create/           # יצירת הזמנות
```

## מודל נתונים (Supabase)
### טבלאות עיקריות:
- **users** - משתמשי המערכת
- **questionnaires** - שאלונים
- **invitations** - הזמנות לשאלונים
- **questionnaire_completions** - מעקב התקדמות
- **answers** - תשובות לשאלונים

## דפוסי שגיאות נוכחיים
- **Invalid token errors** - בעיה בvalidation של JWT
- שגיאות בכל ה-API routes שדורשות אימות
- בעיה בextraction או verification של טוקנים

## HTML Assets קיימים
קבצי HTML סטטיים לכל קטגוריה:
- accessibility.html, security.html, budget.html וכו'
- script.js ו-style.css גלובליים
- report.html/js למערכת דוחות

## טכנולוגיות נוספות
- bcryptjs לhashing סיסמאות
- jose לJWT handling
- uuid לgeneration של IDs
- TypeScript לtype safety 