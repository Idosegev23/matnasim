# מערכת מתנסים - שאלונים דיגיטליים

מערכת מתקדמת לניהול שאלונים דיגיטליים למתנסי ישראל, הבנויה עם Next.js 14 ו-Supabase.

## תכונות המערכת

- ✅ **ניהול שאלונים** - 11 קטגוריות שאלונים מלאות
- ✅ **אימות ואבטחה** - JWT authentication עם bcrypt
- ✅ **ממשקי ניהול** - דשבורד לאדמינים ומנהלים
- ✅ **התקדמות בזמן אמת** - מעקב אחר השלמת שאלונים
- ✅ **ניווט חכם** - התקדמות שלב אחר שלב
- ✅ **שמירה אוטומטית** - שמירת תשובות בזמן אמת
- ✅ **תמיכה בעברית** - ממשק מותאם לעברית

## קטגוריות שאלונים

1. **נגישות** (10 שאלות)
2. **הנהלת חשבונות** (9 שאלות)
3. **תקציב** (9 שאלות)
4. **קהילה** (23 שאלות)
5. **ניהול כספי** (25 שאלות)
6. **משאבי אנוש** (35 שאלות)
7. **מלאי** (7 שאלות)
8. **משפטי** (5 שאלות)
9. **שכר** (14 שאלות)
10. **אבטחה** (4 שאלות)
11. **סגרות** (13 שאלות)

**סך הכל: 154 שאלות**

## טכנולוגיות

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with bcryptjs
- **Deployment**: Vercel-ready

## התקנה מקומית

1. **שכפול הפרויקט**
```bash
git clone [repository-url]
cd matnasim
```

2. **התקנת dependencies**
```bash
npm install
```

3. **הגדרת משתני סביבה**
```bash
cp .env.example .env.local
```

הוסף את המשתנים הבאים ל-.env.local:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
```

4. **הרצת המערכת**
```bash
npm run dev
```

המערכת תהיה זמינה ב: http://localhost:3000

## פריסה לפרודקשן

### Vercel Deployment

1. **העלאה ל-Vercel**
```bash
npm run build
vercel deploy --prod
```

2. **הגדרת משתני סביבה ב-Vercel**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY  
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET

3. **הגדרת דומיין מותאם אישית** (אופציונלי)

### הכנה לפרודקשן

המערכת מוכנה לפרודקשן:
- ✅ אין נתונים קשיחים בקוד
- ✅ אימות מלא דרך מסד הנתונים
- ✅ Build עובר בהצלחה
- ✅ API routes מוגדרות כדינמיות
- ✅ טיפול בשגיאות מקיף

## מבנה המסד נתונים

### טבלאות עיקריות

1. **users** - משתמשי המערכת (אדמינים ומנהלים)
2. **questionnaires** - קטגוריות השאלונים
3. **questions** - השאלות עצמן
4. **responses** - תשובות המשתמשים
5. **questionnaire_completions** - מעקב השלמות
6. **invitations** - הזמנות למילוי שאלונים

## API Routes

### Authentication
- `POST /api/auth/login` - כניסה למערכת
- `POST /api/auth/register` - רישום משתמש חדש

### Dashboard
- `GET /api/dashboard/admin` - נתוני דשבורד אדמין
- `GET /api/dashboard/manager` - נתוני דשבורד מנהל

### Questionnaires
- `GET /api/questionnaire/[category]` - שליפת שאלון
- `POST /api/questionnaire/[category]/answers` - שמירת תשובות
- `POST /api/questionnaire/[category]/complete` - השלמת שאלון

### Invitations
- `POST /api/invitations/create` - יצירת הזמנה (אדמין בלבד)

## אבטחה

- **JWT Authentication** - טוקני JWT עם תפוגה של 7 ימים
- **Password Hashing** - bcrypt עם salt rounds 12
- **Role-based Access** - הפרדה בין אדמינים למנהלים
- **SQL Injection Protection** - שימוש ב-Supabase ORM
- **CORS Protection** - הגדרות CORS מתאימות

## תמיכה וצור קשר

לתמיכה טכנית או שאלות, פנה למפתח המערכת.

## רישיון

כל הזכויות שמורות למתנסי ישראל 