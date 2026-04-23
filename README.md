# SkillBridge - Attendance Management System

A state-level skilling programme attendance management system with role-based dashboards for Students, Trainers, Institutions, Programme Managers, and Monitoring Officers.

## 🌐 Live URLs

- **Frontend**: `https://skillbridge.vercel.app` _(deploy to Vercel)_
- **Backend API**: `https://api.skillbridge.railway.app` _(deploy to Railway/Render)_

## 🔐 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@skillbridge.test | Test@123 |
| Trainer | trainer@skillbridge.test | Test@123 |
| Institution | institution@skillbridge.test | Test@123 |
| Programme Manager | manager@skillbridge.test | Test@123 |
| Monitoring Officer | monitor@skillbridge.test | Test@123 |

## 🛠 Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS v3
- React Router v6
- Axios (HTTP client)
- Clerk (authentication)
- Lucide React (icons)
- React Hot Toast (notifications)

### Backend
- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL (Neon)
- Clerk JWT verification

## 📦 Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Clerk account ([clerk.com](https://clerk.com))

### 1. Clone and Install

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and CLERK keys
npm install

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your VITE_CLERK_PUBLISHABLE_KEY
npm install
```

### 2. Configure Environment Variables

**Backend `.env`:**
```
DATABASE_URL=postgresql://user:pass@host:5432/skillbridge?sslmode=require
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env`:**
```
VITE_API_BASE_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### 3. Database Setup

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health check: http://localhost:3001/health

## 📊 Database Schema

```
users ──┬── institutions
        ├── batch_trainers ──── batches ──── institutions
        ├── batch_students ──── batches
        ├── sessions ────────── batches
        ├── attendance ──────── sessions
        └── batch_invites ───── batches
```

## 🔌 API Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/auth/register` | Register new user | Public |
| GET | `/auth/me` | Get current user | All |
| GET | `/auth/institutions` | List institutions | Public |
| POST | `/batches` | Create batch | Trainer, Institution |
| GET | `/batches` | List user's batches | All |
| POST | `/batches/:id/invite` | Generate invite link | Trainer |
| POST | `/batches/join` | Join batch via invite | Student |
| GET | `/batches/:id/summary` | Batch attendance summary | Institution, Trainer |
| POST | `/sessions` | Create session | Trainer |
| GET | `/sessions` | List sessions | All |
| GET | `/sessions/active` | Active sessions (student) | Student |
| GET | `/sessions/:id/attendance` | Session attendance detail | Trainer |
| POST | `/attendance/mark` | Mark attendance | Student |
| GET | `/attendance/my` | Student's attendance history | Student |
| GET | `/institutions` | List institutions | PM, MO, Institution |
| GET | `/institutions/:id/summary` | Institution summary | PM, Institution |
| GET | `/programme/summary` | Programme-wide summary | PM, MO |

## ✅ Project Status

### Completed
- ✅ All 5 user roles with registration
- ✅ Role-based dashboard routing
- ✅ Clerk authentication integration
- ✅ Trainer can create sessions
- ✅ Student can mark attendance (present/absent/late)
- ✅ Batch invite link generation & joining
- ✅ Trainer can view session attendance details
- ✅ Institution batch summaries with student-level data
- ✅ Programme Manager cross-institutional view
- ✅ Monitoring Officer read-only dashboard
- ✅ Server-side role validation on all endpoints
- ✅ Responsive dark-themed UI with glassmorphism
- ✅ Toast notifications and loading states

### Nice to Have (Not Implemented)
- ⚪ Attendance time window enforcement (strict)
- ⚪ Real-time attendance updates (WebSocket)
- ⚪ Charts/graphs for summaries
- ⚪ CSV export
- ⚪ Email notifications

## 🐛 Known Issues

- First login after Clerk signup may require a page refresh to sync the database user
- Attendance time window validation is relaxed (students can mark any time for MVP)

## 🚀 Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Backend → Railway/Render
1. Push to GitHub
2. Create new service from repo
3. Set environment variables
4. Run Prisma migrations on deploy

## 👤 Developer Notes

- Built with TypeScript strict mode throughout
- Prisma ORM prevents SQL injection
- React escaping prevents XSS
- CORS configured for frontend origin
- JWT tokens verified server-side on every protected route
