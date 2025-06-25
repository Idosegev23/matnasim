# Tech Context - הקשר טכנולוגי

## Tech Stack
- **Framework**: Next.js 14.2.30
- **Language**: TypeScript 5.0+
- **Database**: Supabase
- **Authentication**: JWT (jose library)
- **Password Hashing**: bcryptjs
- **Styling**: CSS Modules + globals.css
- **Runtime**: Node.js

## Dependencies חשובים
```json
{
  "@supabase/supabase-js": "^2.38.0",
  "jose": "^5.1.3",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "uuid": "^9.0.1"
}
```

## Environment Variables
יש צורך בקובץ `.env.local` עם:
- JWT_SECRET - למפתח ה-JWT
- Supabase configuration
- אפשר שחסרים עוד משתנים

## Database Schema (Supabase)
### טבלאות מזוהות:
- `users` - משתמשי המערכת
- `questionnaires` - הגדרות שאלונים
- `invitations` - הזמנות לשאלונים עם סטטוס
- `questionnaire_completions` - מעקב התקדמות
- `answers` - תשובות משתמשים

### Fields חשובים:
- `users.email`, `users.full_name`, `users.organization_name`
- `invitations.manager_email`, `invitations.status`, `invitations.deadline`
- `questionnaire_completions.progress_percentage`, `is_completed`

## Authentication Flow
1. Login → JWT token creation
2. Token storage (frontend)
3. Token sending בheader: `Authorization: Bearer <token>`
4. Server verification ב-API routes

## Known Issues
- JWT verification כושל - Invalid token errors
- חוסר בdebug logging
- אפשר בעיה ב-environment configuration

## Legacy Files
קיימים קבצי HTML סטטיים מגרסה קודמת:
- accessibility.html, security.html וכו'
- script.js, style.css
- report.html/js

## Development Setup
```bash
npm run dev  # Port 3000
npm run build
npm run start
```

## Browser Compatibility
- Modern browsers עם ES6+ support
- מוכן לresponsive design בעברית (RTL) 