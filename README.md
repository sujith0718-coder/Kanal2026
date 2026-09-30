# StudyAI — Adaptive Academic Planner

> **Plan. Study. Measure. Adapt. Recover.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.7-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Assisted-4285F4)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com/)

## 🌐 Live Demo

**https://kanal2026-ldmg.vercel.app/**

---

## 🎯 Problem

Students manage:

- Exams
- Syllabus
- Deadlines
- Available study time
- Topic difficulty
- Learning progress

Most planners create a timetable once.

**Real student life changes. The plan should change too.**

---

## 💡 Solution

**StudyAI** is an adaptive academic planner that:

- Creates a realistic study plan
- Finds the **Next Best Action**
- Checks workload vs available time
- Calculates exam risk
- Measures mastery with micro-quizzes
- Rescues and replans missed sessions

### Core Loop

```text
PLAN → STUDY → MEASURE → ADAPT → RECOVER → REPLAN
```

---

## 🚀 Key Features

### 🧭 Next Best Action

Identifies the most important study task using:

```text
Exam Urgency
+ Remaining Syllabus
+ Mastery Gap
+ Difficulty
        ↓
Priority Score
        ↓
Next Best Action
```

### 📊 Feasibility Engine

```text
Required Workload
        VS
Available Capacity
```

```text
🟢 GREEN  → Comfortable
🟡 YELLOW → Tight but feasible
🔴 RED    → Workload exceeds capacity
```

### 🚨 Exam Risk Radar

```text
Risk =
45% Exam Urgency
+ 25% Mastery Gap
+ 20% Remaining Syllabus
+ 10% Difficulty
```

```text
0–35   → LOW
36–65  → MEDIUM
66–100 → HIGH
```

### 🧠 Micro-Quiz → Mastery

```text
Study
  ↓
Micro-Quiz
  ↓
Score
  ↓
Mastery Update
```

Repeated assessments use:

```text
New Mastery =
40% Previous Mastery
+ 60% Latest Quiz Score
```

### 🔄 Rescue Mode

When a session is missed:

```text
Missed Session
      ↓
Recalculate Workload
      ↓
Create New Plan Version
      ↓
Redistribute Work
      ↓
Respect Constraints
```

Changes can be:

`MOVED` · `SPLIT` · `DEFERRED` · `PROTECTED`

---

## 🤖 AI + Deterministic Logic

> **AI understands and explains. Deterministic logic decides.**

### Gemini

Used for:

- Academic document extraction
- Micro-quiz generation
- Plan-change explanations
- Exam-risk explanations

### Deterministic Logic

Handles:

- Scheduling
- Capacity
- Priority
- Feasibility
- Constraints
- Quiz scoring
- Mastery updates
- Rescue planning

---

## 🏗️ Architecture

```text
Academic Data + Student State + Availability
                    ↓
            Planning Engine
                    ↓
                Study Plan
                    ↓
      ┌─────────────┼─────────────┐
      ↓             ↓             ↓
 Next Action     Risk Radar   Feasibility
      └─────────────┼─────────────┘
                    ↓
              Study Session
                    ↓
                Micro-Quiz
                    ↓
             Mastery Update
                    ↓
              Reality Check
                    ↓
             Rescue / Replan
                    ↓
                   LOOP
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Google Gemini |
| Validation | Zod |
| Date Handling | date-fns |
| Testing | Vitest |
| Deployment | Vercel |

---

## 📁 Structure

```text
src/
├── app/
│   ├── page.tsx
│   ├── inbox/
│   ├── plan/
│   ├── quiz/
│   ├── rescue/
│   ├── risk/
│   ├── session/
│   ├── settings/
│   └── subjects/
│
├── app/api/
│   ├── today/
│   ├── plan/
│   ├── rescue/
│   ├── risk/
│   ├── quiz/
│   ├── sessions/
│   └── academic/
│
└── lib/
    ├── ai/
    ├── planner/
    └── db/
```

---

## 🔌 Main APIs

| Endpoint | Purpose |
|---|---|
| `GET /api/today` | Next Action, sessions, feasibility, risk |
| `GET /api/plan` | Active plan |
| `POST /api/plan/generate` | Generate plan |
| `GET /api/risk` | Calculate exam risk |
| `POST /api/rescue` | Replan after missed sessions |
| `POST /api/academic/extract` | AI academic extraction |
| `POST /api/academic/compare` | Compare exam schedules |
| `POST /api/quiz/[id]/submit` | Score quiz + update mastery |
| `POST /api/sessions/[id]/complete` | Complete session |
| `POST /api/sessions/[id]/miss` | Mark session missed |

---

## ▶️ Run Locally

```bash
git clone https://github.com/sujith0718-coder/Kanal2026.git
cd Kanal2026
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

For Gemini features, create `.env.local`:

```env
GEMINI_API_KEY=your_api_key_here
```

---

## 🧪 Validation

```bash
npm run build
npx vitest run
```

---

## 🎬 Hackathon Demo Flow

```text
Today
  ↓
Next Best Action
  ↓
Plan
  ↓
Risk Radar
  ↓
Complete Session
  ↓
Micro-Quiz
  ↓
Mastery Update
  ↓
Miss Session
  ↓
Rescue Mode
  ↓
New Plan
```

### Demo Message

> **“We are not just generating a timetable. We are building a study plan that adapts when real student life changes.”**

---

## ⚠️ Current Scope

The current prototype uses an **in-memory mock data store** for academic and planning state.

The core demonstrated system includes:

- Adaptive planning
- Feasibility checking
- Risk analysis
- Micro-assessment
- Mastery updates
- Rescue / replanning
- AI-assisted academic intelligence

---

## 👥 Team

```text
Member 1 → Frontend / UX
Member 2 → AI / Gemini
Member 3 → Planning / Decision Engine
```

---

# 🏆 StudyAI

> **Students don't need another timetable.  
> They need a plan that survives reality.**

**Plan. Study. Measure. Adapt. Recover.**
