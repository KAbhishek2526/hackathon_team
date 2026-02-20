# MicroTask — Student Micro-Task Economy Platform

A production-structured MVP for a student-only, AI-governed micro-task economy. Tasks are automatically classified, priced, and matched using AI — there is no bidding and no negotiation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS, TypeScript |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| AI | OpenAI GPT-3.5-turbo (task classification only) |
| Auth | JWT, bcryptjs |

---

## Project Structure

```
hackathon_team/
├── backend/
│   ├── src/
│   │   ├── models/         # User, Task, Transaction (Mongoose)
│   │   ├── routes/         # auth, tasks, users, admin
│   │   ├── middleware/     # JWT auth, domain check
│   │   ├── services/       # AI, pricing, matching, badge
│   │   └── index.js        # Express app entry
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── register/       # Registration page
│   │   ├── login/          # Login page
│   │   ├── dashboard/      # User dashboard
│   │   ├── tasks/post/     # Post a task
│   │   ├── tasks/available/# Open tasks list
│   │   ├── tasks/my/       # My posted + assigned tasks
│   │   ├── profile/        # Full profile view
│   │   └── wallet/         # Balance + transactions
│   ├── lib/api.ts          # Centralised API client
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI
- (Optional) OpenAI API key for live AI classification

---

### 1. Clone the Repo

```bash
git clone https://github.com/KAbhishek2526/hackathon_team.git
cd hackathon_team
```

---

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/micro_task_db
JWT_SECRET=change_this_to_a_long_random_string
OPENAI_API_KEY=sk-...   # Leave as placeholder to use mock AI
```

> **Note**: If you leave `OPENAI_API_KEY` as the placeholder, a mock response is used (category: "General", complexity: "Medium", 2 hours). Everything else works normally.

---

### 3. Run the Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at: `http://localhost:5000`

Health check: `GET http://localhost:5000/health` → `{ "status": "ok" }`

---

### 4. Configure Frontend

```bash
cd frontend
# .env.local already set to http://localhost:5000
```

---

### 5. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Allowed Email Domains

Only these domains can register:

```javascript
["college.edu", "university.ac.in"]
```

To add more domains, edit `backend/src/middleware/domainCheck.js`.

---

## Core Business Rules

| Rule | Detail |
|---|---|
| **Pricing** | `price = (hours × ₹200) + complexity_bonus` (Low +₹0, Med +₹50, High +₹100) |
| **Matching** | Auto-assigned to highest reliability + tier student with `weekly_hours < 6` |
| **Weekly Cap** | Students cannot exceed 6 hours/week. POST `/api/reset-week` to reset. |
| **Escrow** | Price deducted from poster on task creation; released to assignee on completion |
| **Reliability** | +2 on completion, −3 on cancellation |
| **Skill Tier** | Tier 1 (default) → Tier 2 (score ≥ 20) → Tier 3 (score ≥ 50) |
| **Starting Wallet** | New users start with ₹500 |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with college email |
| POST | `/api/auth/login` | Login, receive JWT |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tasks` | Create task (AI classify + price + match) |
| GET | `/api/tasks` | List open tasks |
| GET | `/api/tasks/my` | My posted + assigned tasks |
| POST | `/api/tasks/:id/complete` | Mark complete (assignee only) |
| POST | `/api/tasks/:id/cancel` | Cancel task (poster only) |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Current user profile |
| GET | `/api/users/wallet` | Balance + transactions |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reset-week` | Reset weekly hours for all users |

---

## Badges

| Badge | Condition |
|---|---|
| Consistent Contributor | Completed ≥ 5 tasks |
| On-Time Pro | Reliability score ≥ 10 |
| Academic Safe Worker | Completed within weekly cap |