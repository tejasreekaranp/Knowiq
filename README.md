# KnowIQ - Adaptive Learning System

<div align="center">
  <h3>Next-Generation AI Learning Platform with Automated Syllabus Decomposition & Didactic Clarity Loops</h3>
  <p>Transforms raw university curricula and course materials into structured, adaptive, concept-grounded learning journeys.</p>
</div>

---

## 🌟 Key Features

### 1. Smart Syllabus Analyzer & Course Engine
- **Automated Decomposition**: Automatically identifies course units, modules, and comma-delimited learning concepts.
- **Glued Unit Normalization**: Intelligently detects and splits glued unit headers (e.g., `...hidden markov modelsUNIT-2: Markov Decision Processes...`) into isolated units without losing context.
- **Source-Grounded Learning**: Ingests textbook excerpts, lecture notes, and syllabus documents to generate accurate, non-hallucinated explanations.

### 2. 4-Step Conceptual Clarity Loop
- **What Is It?**: Clear, intuitive definition avoiding dry jargon.
- **Why Does It Exist?**: The historical or engineering motivation.
- **The Problem It Solved**: The concrete dilemma or limitation before this concept was introduced.
- **Key Takeaway**: The golden principle that anchors long-term retention.
- **Streamlined Depth Modes**: Focus on high-retention learning with `Quick` and `Standard` depths.

### 3. Didactic Question Generator & Misconception Engine
- Generates scenario, conceptual, and application-based multiple-choice diagnostics.
- Provides deep `whyWrongMap` feedback explaining *why* distractors are misleading.
- Computes weighted clarity scores and provides adaptive pacing recommendations (`advance`, `reinforce_foundations`, or `investigate_misconception`).

### 4. Role-Based Experience
- **Dedicated Perspectives**: Student and Faculty roles chosen during account registration.
- **Student Space**: Personal syllabus tracking, XP, streaks, clarity diagnostics, and spaced revision cards.
- **Faculty Dashboard**: Cohort analytics, syllabus coverage monitors, and diagnostic insights.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend / Dev Server**: Node.js, Express, Vite HMR
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Database / Auth**: Supabase (Cloud & Offline-resilient persistent adapter)
- **Validation**: Zod schema validation for strict AI structured outputs

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### 1. Clone & Install
```bash
git clone https://github.com/tejasreekaranp/Knowiq.git
cd Knowiq
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_project_url (optional)
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key (optional)
```

### 3. Launch Development Server
```bash
npm run dev
```
The application will be live at `http://localhost:3000/`.

---

## 🧪 Testing & Verification

Run the automated test suites:
```bash
# Verify syllabus parsing & glued unit auto-formatting
npx tsx test_syllabus_analyzer.ts

# Verify AI didactic learning engine & clarity pipelines
npx tsx test_learning_engine.ts

# Run TypeScript compiler checks
npm run lint
```
