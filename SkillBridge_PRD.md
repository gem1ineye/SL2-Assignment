# Product Requirements Document: SkillBridge Attendance Management System

## 1. Executive Summary

### 1.1 Project Overview
SkillBridge is a state-level skilling programme attendance management system designed to facilitate attendance tracking across multiple institutions, trainers, batches, and students. The system provides role-based access control for five distinct user types with varying levels of permissions and visibility.

### 1.2 Objectives
- Enable self-service attendance marking for students
- Provide trainers with session management and attendance tracking capabilities
- Give institutions visibility into their training operations
- Allow programme managers to monitor cross-institutional performance
- Provide monitoring officers with read-only oversight across the entire programme

### 1.3 Timeline & Scope
- **Development Window**: 2-3 days
- **Deployment**: Required - fully functional public URLs
- **Scope**: MVP with core functionality for all five user roles

---

## 2. User Roles & Permissions

### 2.1 Role Definitions

#### Student
**Primary Functions:**
- View assigned sessions
- Mark own attendance (present/absent/late)
- Join batches via invite links

**Access Level:** Limited to own sessions and batch information

#### Trainer
**Primary Functions:**
- Create and manage training sessions
- Generate batch invite links for student onboarding
- View attendance for sessions they conduct
- Manage student batches

**Access Level:** Full CRUD on own sessions, read access to assigned batches

#### Institution
**Primary Functions:**
- Manage trainers under their institution
- Manage batches
- View attendance summaries per batch
- Monitor institutional performance

**Access Level:** Full access to institution-level data, read access to trainer activities

#### Programme Manager
**Primary Functions:**
- Oversee all institutions in their region
- View cross-institutional attendance summaries
- Monitor programme-wide performance

**Access Level:** Read access across all institutions, aggregated data views

#### Monitoring Officer
**Primary Functions:**
- View programme-wide attendance rates
- Access read-only dashboards
- Generate reports (future enhancement)

**Access Level:** Read-only access across entire programme, no create/edit/delete permissions

### 2.2 Role-Based Access Control Matrix

| Feature | Student | Trainer | Institution | Programme Manager | Monitoring Officer |
|---------|---------|---------|-------------|-------------------|-------------------|
| View Own Sessions | ✓ | ✓ | - | - | - |
| Mark Attendance | ✓ | - | - | - | - |
| Create Sessions | - | ✓ | - | - | - |
| View Session Attendance | - | ✓ | ✓ | - | - |
| Create Batches | - | ✓ | ✓ | - | - |
| Generate Invite Links | - | ✓ | - | - | - |
| Join Batch (via invite) | ✓ | - | - | - | - |
| View Batch Summaries | - | - | ✓ | - | - |
| View Institution Summaries | - | - | ✓ | ✓ | - |
| View Programme Summary | - | - | - | ✓ | ✓ |
| Edit/Delete Any Data | - | - | - | - | ✗ |

---

## 3. Technical Architecture

### 3.1 Technology Stack

#### Frontend
- **Platform**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API / Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Deployment**: Vercel

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: Clerk
- **Deployment**: Railway / Render / Fly.io

#### Database
- **Type**: PostgreSQL 14+
- **ORM**: Prisma
- **Hosting**: Neon (serverless PostgreSQL)

#### Authentication & Authorization
- **Provider**: Clerk
- **Method**: JWT-based authentication
- **Role Storage**: Custom user metadata in database + Clerk metadata

### 3.2 System Architecture

```
┌─────────────────┐
│   Web Browser   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│     Vercel      │
│  React SPA      │
└────────┬────────┘
         │
         │ REST API
         ▼
┌─────────────────┐      ┌──────────────┐
│  Railway/Render │◄────►│    Clerk     │
│  Express API    │      │  Auth Service│
└────────┬────────┘      └──────────────┘
         │
         │ Prisma ORM
         ▼
┌─────────────────┐
│   Neon          │
│  PostgreSQL     │
└─────────────────┘
```

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
users
├── id (PK)
├── clerk_user_id (unique)
├── name
├── email
├── role (enum)
├── institution_id (FK, nullable)
└── created_at

institutions
├── id (PK)
├── name
├── code
└── created_at

batches
├── id (PK)
├── name
├── institution_id (FK)
├── created_at
└── updated_at

batch_trainers (junction table)
├── id (PK)
├── batch_id (FK)
├── trainer_id (FK)
└── assigned_at

batch_students (junction table)
├── id (PK)
├── batch_id (FK)
├── student_id (FK)
└── joined_at

sessions
├── id (PK)
├── batch_id (FK)
├── trainer_id (FK)
├── title
├── date
├── start_time
├── end_time
├── created_at
└── updated_at

attendance
├── id (PK)
├── session_id (FK)
├── student_id (FK)
├── status (enum: present, absent, late)
├── marked_at
└── updated_at

batch_invites (additional)
├── id (PK)
├── batch_id (FK)
├── invite_code (unique)
├── created_by (FK to users)
├── is_active
├── expires_at
└── created_at
```

### 4.2 Schema Definitions

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'trainer', 'institution', 'programme_manager', 'monitoring_officer')),
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### institutions
```sql
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### batches
```sql
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### batch_trainers
```sql
CREATE TABLE batch_trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(batch_id, trainer_id)
);
```

#### batch_students
```sql
CREATE TABLE batch_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(batch_id, student_id)
);
```

#### sessions
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### attendance
```sql
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);
```

#### batch_invites
```sql
CREATE TABLE batch_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    invite_code VARCHAR(100) UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 Indexes
```sql
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_batches_institution ON batches(institution_id);
CREATE INDEX idx_sessions_batch ON sessions(batch_id);
CREATE INDEX idx_sessions_trainer ON sessions(trainer_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_batch_invites_code ON batch_invites(invite_code);
```

---

## 5. Backend API Specification

### 5.1 Authentication Middleware

All protected endpoints must:
1. Verify Clerk JWT token
2. Extract user ID from token
3. Fetch user record from database
4. Verify user role matches endpoint requirements
5. Return 403 if role is unauthorized
6. Return 401 if authentication fails

### 5.2 API Endpoints

#### Base URL
```
Production: https://api.skillbridge.example.com
Development: http://localhost:3000
```

---

#### 5.2.1 Authentication Endpoints

##### POST /auth/register
**Description**: Create user account and sync with Clerk  
**Auth Required**: No (public)  
**Request Body**:
```json
{
  "clerkUserId": "user_xxxxxxxxxxxxx",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "clerkUserId": "user_xxxxxxxxxxxxx",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "institutionId": null,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

##### GET /auth/me
**Description**: Get current user profile  
**Auth Required**: Yes (all roles)  
**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "institution": {
      "id": "uuid",
      "name": "Tech Training Center"
    }
  }
}
```

---

#### 5.2.2 Batch Management Endpoints

##### POST /batches
**Description**: Create a new batch  
**Auth Required**: Yes (Trainer, Institution)  
**Request Body**:
```json
{
  "name": "Full Stack Development - Batch 5",
  "institutionId": "uuid"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Full Stack Development - Batch 5",
    "institutionId": "uuid",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Validation**:
- Trainer: `institutionId` must match their assigned institution
- Institution: `institutionId` must match their own institution

---

##### POST /batches/:id/invite
**Description**: Generate invite link for batch  
**Auth Required**: Yes (Trainer)  
**Request Body**:
```json
{
  "expiresIn": 7
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "inviteCode": "ABC123XYZ",
    "inviteUrl": "https://skillbridge.example.com/join/ABC123XYZ",
    "batchId": "uuid",
    "expiresAt": "2024-01-22T10:30:00Z"
  }
}
```

**Validation**:
- Trainer must be assigned to this batch

---

##### POST /batches/:id/join
**Description**: Student joins batch using invite code  
**Auth Required**: Yes (Student)  
**Request Body**:
```json
{
  "inviteCode": "ABC123XYZ"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "batchId": "uuid",
    "studentId": "uuid",
    "joinedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Validation**:
- Invite code must be valid and active
- Invite must not be expired
- Student cannot already be in this batch

---

##### GET /batches/:id/summary
**Description**: Get attendance summary for a batch  
**Auth Required**: Yes (Institution)  
**Response** (200):
```json
{
  "success": true,
  "data": {
    "batchId": "uuid",
    "batchName": "Full Stack Development - Batch 5",
    "totalSessions": 20,
    "totalStudents": 30,
    "averageAttendance": 85.5,
    "studentSummaries": [
      {
        "studentId": "uuid",
        "studentName": "John Doe",
        "sessionsAttended": 18,
        "totalSessions": 20,
        "attendanceRate": 90.0
      }
    ]
  }
}
```

**Validation**:
- Institution must own this batch

---

#### 5.2.3 Session Management Endpoints

##### POST /sessions
**Description**: Create a training session  
**Auth Required**: Yes (Trainer)  
**Request Body**:
```json
{
  "batchId": "uuid",
  "title": "Introduction to React Hooks",
  "date": "2024-01-20",
  "startTime": "10:00",
  "endTime": "12:00"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "batchId": "uuid",
    "trainerId": "uuid",
    "title": "Introduction to React Hooks",
    "date": "2024-01-20",
    "startTime": "10:00",
    "endTime": "12:00",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Validation**:
- Trainer must be assigned to the batch
- `endTime` must be after `startTime`
- Date cannot be in the past

---

##### GET /sessions/:id/attendance
**Description**: Get attendance for a specific session  
**Auth Required**: Yes (Trainer)  
**Response** (200):
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "sessionTitle": "Introduction to React Hooks",
    "date": "2024-01-20",
    "startTime": "10:00",
    "endTime": "12:00",
    "totalStudents": 30,
    "presentCount": 27,
    "absentCount": 2,
    "lateCount": 1,
    "attendanceRecords": [
      {
        "studentId": "uuid",
        "studentName": "John Doe",
        "status": "present",
        "markedAt": "2024-01-20T10:05:00Z"
      }
    ]
  }
}
```

**Validation**:
- Trainer must be the session creator or assigned to the batch

---

##### GET /sessions/active
**Description**: Get active sessions for current user (Student)  
**Auth Required**: Yes (Student)  
**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Introduction to React Hooks",
      "batchName": "Full Stack Development - Batch 5",
      "date": "2024-01-20",
      "startTime": "10:00",
      "endTime": "12:00",
      "attendanceStatus": "present",
      "canMarkAttendance": false
    }
  ]
}
```

---

#### 5.2.4 Attendance Endpoints

##### POST /attendance/mark
**Description**: Student marks their own attendance  
**Auth Required**: Yes (Student)  
**Request Body**:
```json
{
  "sessionId": "uuid",
  "status": "present"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sessionId": "uuid",
    "studentId": "uuid",
    "status": "present",
    "markedAt": "2024-01-20T10:05:00Z"
  }
}
```

**Validation**:
- Student must be enrolled in the session's batch
- Session must be active (within time window)
- Cannot mark attendance twice for same session (can update existing)

**Business Rules**:
- Attendance window: 15 minutes before start to 30 minutes after start
- Status "late" if marked after start time
- Auto-marked "absent" if not marked within window

---

#### 5.2.5 Institution Endpoints

##### GET /institutions/:id/summary
**Description**: Get attendance summary for all batches in institution  
**Auth Required**: Yes (Programme Manager)  
**Response** (200):
```json
{
  "success": true,
  "data": {
    "institutionId": "uuid",
    "institutionName": "Tech Training Center",
    "totalBatches": 10,
    "totalStudents": 300,
    "totalSessions": 150,
    "averageAttendance": 82.5,
    "batchSummaries": [
      {
        "batchId": "uuid",
        "batchName": "Full Stack Development - Batch 5",
        "studentCount": 30,
        "sessionCount": 20,
        "averageAttendance": 85.5
      }
    ]
  }
}
```

**Validation**:
- Programme Manager can access any institution

---

#### 5.2.6 Programme-Wide Endpoints

##### GET /programme/summary
**Description**: Get programme-wide attendance summary  
**Auth Required**: Yes (Programme Manager, Monitoring Officer)  
**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalInstitutions": 25,
    "totalBatches": 150,
    "totalStudents": 4500,
    "totalSessions": 2000,
    "averageAttendance": 80.2,
    "institutionSummaries": [
      {
        "institutionId": "uuid",
        "institutionName": "Tech Training Center",
        "batchCount": 10,
        "studentCount": 300,
        "averageAttendance": 82.5
      }
    ]
  }
}
```

---

### 5.3 Error Handling

#### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You do not have permission to perform this action",
    "details": {}
  }
}
```

#### HTTP Status Codes
- `200 OK`: Successful GET request
- `201 Created`: Successful POST request creating resource
- `400 Bad Request`: Invalid request body or parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Valid auth but insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource or constraint violation
- `500 Internal Server Error`: Server-side error

#### Common Error Codes
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks required role
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource doesn't exist
- `DUPLICATE_ENTRY`: Unique constraint violation
- `EXPIRED_INVITE`: Invite code expired
- `INVALID_INVITE`: Invite code not found or inactive
- `ATTENDANCE_WINDOW_CLOSED`: Cannot mark attendance outside time window

---

## 6. Frontend Specifications

### 6.1 Application Structure

```
/src
  /components
    /common
      - Header.tsx
      - Sidebar.tsx
      - ProtectedRoute.tsx
      - LoadingSpinner.tsx
    /student
      - SessionsList.tsx
      - AttendanceMarker.tsx
    /trainer
      - SessionCreator.tsx
      - BatchInviteGenerator.tsx
      - AttendanceViewer.tsx
    /institution
      - BatchList.tsx
      - TrainerList.tsx
      - AttendanceSummary.tsx
    /programme-manager
      - InstitutionList.tsx
      - ProgrammeMetrics.tsx
    /monitoring-officer
      - ReadOnlyDashboard.tsx
  /pages
    - Login.tsx
    - SignUp.tsx
    - StudentDashboard.tsx
    - TrainerDashboard.tsx
    - InstitutionDashboard.tsx
    - ProgrammeManagerDashboard.tsx
    - MonitoringOfficerDashboard.tsx
  /hooks
    - useAuth.ts
    - useRoleCheck.ts
  /services
    - api.ts
    - auth.ts
  /types
    - index.ts
  /utils
    - formatters.ts
    - validators.ts
```

---

### 6.2 Page Specifications

#### 6.2.1 Authentication Pages

##### Sign Up Page
**Route**: `/signup`  
**Components**:
- Role selection dropdown (5 options)
- Name input
- Email input
- Password input
- Clerk sign-up integration

**Flow**:
1. User enters details and selects role
2. Clerk creates auth account
3. POST to `/auth/register` to create user record
4. Redirect to role-appropriate dashboard

##### Login Page
**Route**: `/login`  
**Components**:
- Email input
- Password input
- Clerk sign-in integration

**Flow**:
1. User enters credentials
2. Clerk authenticates
3. GET `/auth/me` to fetch user profile
4. Redirect to role-appropriate dashboard

---

#### 6.2.2 Student Dashboard

**Route**: `/dashboard/student`  
**Required Role**: Student  

**Components**:

1. **Active Sessions List**
   - Display sessions from enrolled batches
   - Show session title, date, time, batch name
   - Indicate attendance status (not marked, present, absent, late)
   - Highlight sessions where attendance is still open

2. **Attendance Marker**
   - Button to mark attendance (only shown for active sessions)
   - Status selector: Present / Absent / Late
   - Confirmation message after submission
   - Disable if already marked or window closed

**Mock Layout**:
```
┌─────────────────────────────────────────┐
│  SkillBridge | Student: John Doe        │
├─────────────────────────────────────────┤
│  My Sessions                            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ React Hooks - Jan 20, 10:00 AM  │   │
│  │ Batch: FS Dev Batch 5           │   │
│  │ Status: ⚪ Not Marked           │   │
│  │ [Mark Attendance]               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Node.js Basics - Jan 18         │   │
│  │ Batch: FS Dev Batch 5           │   │
│  │ Status: ✅ Present              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**API Calls**:
- `GET /sessions/active` on page load
- `POST /attendance/mark` when marking attendance

---

#### 6.2.3 Trainer Dashboard

**Route**: `/dashboard/trainer`  
**Required Role**: Trainer  

**Sections**:

1. **Create Session**
   - Batch selector (dropdown of assigned batches)
   - Session title input
   - Date picker
   - Start time input
   - End time input
   - Create button

2. **My Sessions**
   - List of created sessions
   - Click to view attendance details
   - Show date, time, batch, attendance stats

3. **Batch Management**
   - List of assigned batches
   - Generate invite link button
   - Copy invite URL
   - View batch details

**Mock Layout**:
```
┌─────────────────────────────────────────┐
│  SkillBridge | Trainer: Sarah Smith     │
├─────────────────────────────────────────┤
│  Create New Session                     │
│  ┌─────────────────────────────────┐   │
│  │ Batch: [FS Dev Batch 5 ▼]      │   │
│  │ Title: [________________]       │   │
│  │ Date:  [Jan 20, 2024]          │   │
│  │ Time:  [10:00] to [12:00]      │   │
│  │ [Create Session]                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  My Sessions                            │
│  ┌─────────────────────────────────┐   │
│  │ React Hooks - Jan 20            │   │
│  │ Attendance: 27/30 (90%)         │   │
│  │ [View Details]                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  My Batches                             │
│  ┌─────────────────────────────────┐   │
│  │ FS Dev Batch 5 (30 students)    │   │
│  │ [Generate Invite Link]          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**API Calls**:
- `POST /sessions` when creating session
- `GET /sessions/:id/attendance` when viewing attendance
- `POST /batches/:id/invite` when generating invite

---

#### 6.2.4 Institution Dashboard

**Route**: `/dashboard/institution`  
**Required Role**: Institution  

**Sections**:

1. **Batch Overview**
   - List all batches in institution
   - Show student count, session count, avg attendance per batch
   - Click to view detailed summary

2. **Trainer Management**
   - List trainers in institution
   - Show assigned batches
   - Add/remove trainer assignments (future)

3. **Attendance Summary**
   - Overall institution attendance rate
   - Batch-wise breakdown
   - Charts/graphs for visualization

**Mock Layout**:
```
┌─────────────────────────────────────────┐
│  SkillBridge | Tech Training Center     │
├─────────────────────────────────────────┤
│  Institution Overview                   │
│  Total Batches: 10 | Avg Attendance: 82%│
│                                         │
│  Batches                                │
│  ┌─────────────────────────────────┐   │
│  │ FS Dev Batch 5                  │   │
│  │ Students: 30 | Sessions: 20     │   │
│  │ Attendance: 85.5%               │   │
│  │ [View Details]                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Trainers (5)                           │
│  • Sarah Smith - 2 batches              │
│  • Mike Johnson - 3 batches             │
└─────────────────────────────────────────┘
```

**API Calls**:
- `GET /batches/:id/summary` for batch details
- Custom endpoint for trainer list (future)

---

#### 6.2.5 Programme Manager Dashboard

**Route**: `/dashboard/programme-manager`  
**Required Role**: Programme Manager  

**Sections**:

1. **Programme Overview**
   - Total institutions, batches, students
   - Overall attendance rate
   - Trend charts

2. **Institution Summaries**
   - List all institutions
   - Show key metrics per institution
   - Click to drill down

3. **Performance Metrics**
   - Top performing institutions
   - Institutions needing attention
   - Attendance trends over time

**Mock Layout**:
```
┌─────────────────────────────────────────┐
│  SkillBridge | Programme Manager        │
├─────────────────────────────────────────┤
│  Programme Overview                     │
│  Institutions: 25 | Students: 4,500     │
│  Avg Attendance: 80.2%                  │
│                                         │
│  Institutions                           │
│  ┌─────────────────────────────────┐   │
│  │ Tech Training Center            │   │
│  │ Batches: 10 | Students: 300     │   │
│  │ Attendance: 82.5%               │   │
│  │ [View Details]                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Skill Academy                   │   │
│  │ Batches: 8 | Students: 240      │   │
│  │ Attendance: 78.3%               │   │
│  │ [View Details]                  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**API Calls**:
- `GET /programme/summary` for programme overview
- `GET /institutions/:id/summary` for institution details

---

#### 6.2.6 Monitoring Officer Dashboard

**Route**: `/dashboard/monitoring-officer`  
**Required Role**: Monitoring Officer  

**Sections**:

1. **Programme Dashboard**
   - Read-only view of programme summary
   - Same data as Programme Manager
   - No create/edit/delete actions anywhere

2. **Reports View**
   - Historical attendance data
   - Export functionality (future)
   - Filter by date range, institution

**Mock Layout**:
```
┌─────────────────────────────────────────┐
│  SkillBridge | Monitoring Officer       │
├─────────────────────────────────────────┤
│  Programme Monitoring Dashboard         │
│  (Read-Only Access)                     │
│                                         │
│  Overall Metrics                        │
│  • Total Institutions: 25               │
│  • Total Students: 4,500                │
│  • Average Attendance: 80.2%            │
│                                         │
│  Institution Performance                │
│  [Same list view as Programme Manager]  │
│  (No edit/delete buttons)               │
└─────────────────────────────────────────┘
```

**API Calls**:
- `GET /programme/summary` (read-only)

---

### 6.3 Routing & Navigation

#### Route Configuration
```typescript
const routes = [
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <SignUp /> },
  { 
    path: '/dashboard/student', 
    element: <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute> 
  },
  { 
    path: '/dashboard/trainer', 
    element: <ProtectedRoute role="trainer"><TrainerDashboard /></ProtectedRoute> 
  },
  { 
    path: '/dashboard/institution', 
    element: <ProtectedRoute role="institution"><InstitutionDashboard /></ProtectedRoute> 
  },
  { 
    path: '/dashboard/programme-manager', 
    element: <ProtectedRoute role="programme_manager"><ProgrammeManagerDashboard /></ProtectedRoute> 
  },
  { 
    path: '/dashboard/monitoring-officer', 
    element: <ProtectedRoute role="monitoring_officer"><MonitoringOfficerDashboard /></ProtectedRoute> 
  },
  { path: '/join/:inviteCode', element: <BatchJoin /> },
  { path: '*', element: <NotFound /> }
];
```

#### Post-Login Redirect Logic
```typescript
const redirectByRole = {
  'student': '/dashboard/student',
  'trainer': '/dashboard/trainer',
  'institution': '/dashboard/institution',
  'programme_manager': '/dashboard/programme-manager',
  'monitoring_officer': '/dashboard/monitoring-officer'
};
```

---

### 6.4 State Management

#### User Context
```typescript
interface UserContext {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    institution?: {
      id: string;
      name: string;
    };
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
}
```

#### Session State (for Trainers)
```typescript
interface SessionState {
  sessions: Session[];
  activeSessions: Session[];
  loadSessions: () => Promise<void>;
  createSession: (data: CreateSessionInput) => Promise<Session>;
  getAttendance: (sessionId: string) => Promise<AttendanceData>;
}
```

---

### 6.5 UI/UX Requirements

#### Design Principles
- **Functional over aesthetic**: Focus on working features, not pixel-perfect design
- **Mobile-responsive**: Basic responsive layout (desktop-first is acceptable)
- **Clear role indicators**: Always show current user's role and name
- **Loading states**: Show spinners during API calls
- **Error handling**: Display user-friendly error messages
- **Success feedback**: Confirm actions with toast notifications

#### Component Library
- **Recommended**: Tailwind CSS + Headless UI / Radix UI
- **Alternative**: Material-UI / Chakra UI if preferred
- **Must-have components**:
  - Loading spinner
  - Error boundary
  - Toast notifications
  - Form inputs with validation
  - Modal dialogs
  - Data tables

---

## 7. Deployment Architecture

### 7.1 Deployment Checklist

#### Frontend (Vercel)
- [ ] Build succeeds without errors
- [ ] Environment variables configured
- [ ] Custom domain (optional)
- [ ] Automatic deployments from main branch

**Environment Variables**:
```
VITE_API_BASE_URL=https://api.skillbridge.railway.app
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

#### Backend (Railway/Render)
- [ ] Build succeeds without errors
- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Health check endpoint responding

**Environment Variables**:
```
DATABASE_URL=postgresql://user:pass@host:5432/skillbridge
CLERK_SECRET_KEY=sk_test_xxxxx
NODE_ENV=production
PORT=3000
```

#### Database (Neon)
- [ ] Database created
- [ ] Connection string obtained
- [ ] Schema migrated
- [ ] Seed data loaded (optional)

#### Authentication (Clerk)
- [ ] Application created
- [ ] Sign-up/sign-in configured
- [ ] JWT template created
- [ ] Webhooks configured (optional)
- [ ] Allowed redirect URLs set

---

### 7.2 Seed Data Strategy

#### Test Accounts Setup

Create one test account per role with predictable credentials:

```
Student:
Email: student@skillbridge.test
Password: Test@123

Trainer:
Email: trainer@skillbridge.test
Password: Test@123

Institution:
Email: institution@skillbridge.test
Password: Test@123

Programme Manager:
Email: manager@skillbridge.test
Password: Test@123

Monitoring Officer:
Email: monitor@skillbridge.test
Password: Test@123
```

#### Seed Data Script
Create initial institutions, batches, sessions, and sample attendance data:

```sql
-- Institution
INSERT INTO institutions (id, name, code) VALUES 
('inst-001', 'Tech Training Center', 'TTC'),
('inst-002', 'Skill Academy', 'SA');

-- Sample batches, students, trainers, sessions, attendance
-- (Full seed script to be created)
```

---

### 7.3 Post-Deployment Testing

#### Manual Test Cases

1. **Authentication Flow**
   - [ ] Sign up as each role type
   - [ ] Login as each role
   - [ ] Verify redirect to correct dashboard
   - [ ] Logout and verify redirect to login

2. **Role-Based Access**
   - [ ] Student cannot access trainer endpoints
   - [ ] Trainer cannot create institutions
   - [ ] Monitoring Officer cannot create/edit anything
   - [ ] Direct URL access blocked for unauthorized roles

3. **Core Workflows**
   - [ ] Trainer creates session → Student sees it
   - [ ] Trainer generates invite → Student joins batch
   - [ ] Student marks attendance → Trainer sees update
   - [ ] Institution views batch summary with correct data
   - [ ] Programme Manager sees cross-institutional data

4. **Data Integrity**
   - [ ] Attendance counts match actual records
   - [ ] Batch summaries calculate correctly
   - [ ] No duplicate attendance entries
   - [ ] Time window validation works

---

## 8. Success Criteria

### 8.1 Minimum Viable Product (MVP) Requirements

#### Must Have (Critical)
- ✅ All 5 roles can sign up and login
- ✅ Role-based dashboard routing works
- ✅ Trainer can create sessions
- ✅ Student can mark attendance
- ✅ Attendance data persists in database
- ✅ Server-side role validation on all protected endpoints
- ✅ Live deployment with public URLs
- ✅ Test accounts work for all roles

#### Should Have (High Priority)
- ✅ Batch invite link generation
- ✅ Student batch joining via invite
- ✅ Trainer can view session attendance
- ✅ Institution can view batch summaries
- ✅ Programme Manager can view programme summary
- ✅ Monitoring Officer has read-only access

#### Nice to Have (Medium Priority)
- ⚪ Attendance time window enforcement
- ⚪ Real-time attendance updates
- ⚪ Charts/graphs for summaries
- ⚪ Responsive mobile design
- ⚪ Email notifications

#### Future Enhancements (Low Priority)
- ⚪ CSV export for reports
- ⚪ Bulk student upload
- ⚪ Session templates
- ⚪ Automated attendance reports
- ⚪ Student performance analytics

---

### 8.2 Quality Gates

#### Code Quality
- TypeScript strict mode enabled
- ESLint configured and passing
- No console errors in browser
- Proper error boundaries implemented

#### Security
- JWT tokens validated server-side
- No sensitive data in client-side code
- Environment variables properly secured
- SQL injection prevention (via Prisma)
- XSS protection (React escaping)

#### Performance
- Initial page load < 3 seconds
- API response time < 500ms
- No memory leaks on navigation
- Optimistic UI updates where appropriate

#### User Experience
- Clear error messages
- Loading indicators during async operations
- Form validation with helpful feedback
- Success confirmations for actions
- Responsive layout (basic)

---

## 9. Development Workflow

### 9.1 Recommended Development Sequence

#### Phase 1: Foundation (Day 1 Morning)
1. Initialize repositories (frontend + backend)
2. Set up Clerk authentication
3. Create database schema in Neon
4. Set up Prisma ORM
5. Deploy "Hello World" to verify infrastructure

#### Phase 2: Backend Core (Day 1 Afternoon)
1. Implement auth endpoints
2. Create user registration flow
3. Build batch management endpoints
4. Build session management endpoints
5. Build attendance endpoints
6. Add role validation middleware

#### Phase 3: Frontend Foundation (Day 1 Evening)
1. Set up React with TypeScript
2. Configure routing
3. Implement Clerk integration
4. Create protected route component
5. Build login/signup pages

#### Phase 4: Role Dashboards (Day 2)
1. Student dashboard + attendance marking
2. Trainer dashboard + session creation
3. Institution dashboard + summaries
4. Programme Manager dashboard
5. Monitoring Officer dashboard

#### Phase 5: Polish & Deploy (Day 3)
1. End-to-end testing
2. Bug fixes
3. README documentation
4. Create test accounts
5. Final deployment
6. Submission preparation

---

### 9.2 Git Workflow

#### Branch Strategy
```
main (protected)
  ├── develop
  │   ├── feature/auth-setup
  │   ├── feature/student-dashboard
  │   ├── feature/trainer-dashboard
  │   └── feature/summaries
```

#### Commit Convention
```
feat: add student attendance marking
fix: resolve session time validation
docs: update README with test accounts
refactor: extract role check middleware
```

---

## 10. Documentation Requirements

### 10.1 README Structure

```markdown
# SkillBridge Attendance Management System

## Live URLs
- Frontend: https://skillbridge.vercel.app
- Backend API: https://api.skillbridge.railway.app
- API Documentation: https://api.skillbridge.railway.app/docs

## Test Accounts
[Credentials for all 5 roles]

## Local Setup
[Step-by-step instructions]

## Technology Stack
[Detailed stack with versions]

## Database Schema
[ERD or schema explanation]

## API Endpoints
[Quick reference]

## Project Status
✅ Completed: [list]
🚧 Partially Done: [list]
❌ Not Implemented: [list]

## Known Issues
[Any bugs or limitations]

## Future Improvements
[What you'd do with more time]

## Developer Notes
[Challenges faced, decisions made]
```

---

### 10.2 CONTACT.txt Format

```
Name: [Full Name]
Email: [Email Address]
Phone: [Phone Number]
GitHub: [GitHub Profile URL]

Most Challenging Part:
[One sentence describing the most challenging aspect]
```

---

## 11. Risk Mitigation

### 11.1 Common Pitfalls

#### Technical Risks
1. **Clerk integration issues**
   - Mitigation: Test auth flow first, use Clerk webhooks for user sync
   
2. **Database migration failures**
   - Mitigation: Test migrations locally before production deploy
   
3. **CORS errors in production**
   - Mitigation: Configure CORS early, whitelist frontend domain
   
4. **Environment variable mismatches**
   - Mitigation: Use .env.example files, document all variables

#### Scope Risks
1. **Feature creep**
   - Mitigation: Stick to MVP, mark nice-to-haves clearly
   
2. **Over-engineering**
   - Mitigation: Simple solutions first, refactor only if needed
   
3. **Perfection paralysis**
   - Mitigation: Working prototype > perfect design

---

### 11.2 Fallback Plans

#### If Clerk doesn't work
- Fallback: Simple JWT auth with bcrypt password hashing

#### If deployment fails
- Fallback: Local demo with screen recording + documented deployment attempt

#### If time runs out
- Priority: Ensure 3 roles work completely rather than 5 partially
- Submit with clear documentation of what works

---

## 12. Appendix

### 12.1 Useful Commands

#### Prisma
```bash
# Generate client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# View database
npx prisma studio
```

#### Deployment
```bash
# Vercel frontend
vercel --prod

# Railway backend
railway up

# Check logs
railway logs
```

---

### 12.2 External Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Prisma Guides](https://www.prisma.io/docs)
- [Neon Quickstart](https://neon.tech/docs/get-started-with-neon)
- [Railway Deployment Guide](https://docs.railway.app)
- [Vercel Deployment](https://vercel.com/docs)

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Status**: Ready for Development
