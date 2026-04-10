# SmartBank AI + Expense Analyzer - Product Requirements Document (PRD)

*Generated: March 2026*
*Status: In Active Development (Completed Parts 1-4)*

## 1. Project Overview
**SmartBank AI** is a modern, frontend-only fintech application built with React.js and Tailwind CSS. It is designed to act as an intelligent, proactive financial assistant for users (especially students and young professionals), helping them make better financial decisions through simulated AI insights, automated budget planning, and transparent product comparisons.

The platform relies on a sophisticated client-side state machine (`mockData.js`) and simulated AI processing logic (`aiService.js`) to provide real-time, dynamic feedback without requiring a backend server.

---

## 2. Core Modules & Completed Features

### 2.1 Dashboard & Financial Overview
The central hub of the application, completely overhauled with a fintech-grade glassmorphic UI.
- **Dynamic KPI Cards:** Displays Monthly Income, Current Expenses, Predicted Savings, and Active Debt (Loans) with trend indicators.
- **AI Daily Notification Center:** A prominent alert banner that parses user data to push real-time actionable insights (e.g., "Food expenses are higher than usual", "Upcoming EMI due on 15 April").
- **Visual Analytics:** Integrates `recharts` for a 6-month Balance Trajectory Area Chart and an Expense Distribution Pie Chart.
- **AI Financial Health Score:** Evaluates income vs. expenses and generates a calculated score out of 100 with actionable tips.
- **AI Budget Planner:** Recommends income allocation based on the 50/30/20 rule.
- **AI Expense Prediction:** Forecasts future category expenses based on historical spending metrics.
- **Goal-Based Investment Planner:** Allows users to set and track specific savings goals.

### 2.2 Investments Analyzer
Provides users with actionable insights into market trends.
- **Market Data Feed:** Renders daily summary cards simulating live data for indices like Nifty 50, Sensex, and Gold 24K.
- **Smart Investment Advice Engine:** Analyzes current market variables to generate dynamic, conversational investment summaries (e.g., advising on digital gold when prices rise).

### 2.3 Bank Comparison Engine
Replaces traditional static comparison tables with an active intelligence tool.
- **AI-Ranked Recommendations:** Suggests the top bank matches based on user profiles (e.g., student, professional).
- **Hidden Charges Intelligence:** Actively parses bank penalty structures to warn users about hidden fees or minimum balance requirements.
- **Top Bank Accounts Today:** Ranks banks dynamically based on zero-balance perks, digital capabilities, and onboarding ease.

### 2.4 Credit Card Advisor & Assistant
A personalized smart advisor for navigating credit card options.
- **Today's Financial Tip:** A dynamic AI banner that reads user expense patterns to generate bespoke credit card advice.
- **Detailed Benefits Analyzer:** Breaks down specific card benefits.
- **Credit Card Application Assistant (Modal):** A fluid, multi-step application flow triggered via "Apply Now".
  - *Eligibility Check:* Validates user income and credit score against card requirements.
  - *AI Warnings:* Proactively alerts users about interest rates before proceeding.
  - *Document Requirements:* Lists exact necessary files (PAN, Aadhaar) and explains the timeframe.

### 2.5 AI Document Analyzer
A standalone interactive utility for parsing financial documents.
- **Mock OCR Extractor:** Users can drag-and-drop simulated financial documents (e.g., Salary Slips, Bank Statements).
- **Automated Insight Generation:** Identifies Key Financial Markers, Red Flags, and immediate AI Recommendations based on the analyzed file type.

### 2.6 AI Loan Advisor 
A comprehensive loan management and simulation module.
- **Loan Purpose Intelligence:** Users select a purpose (Car, Home, Personal, etc.), and the AI filters the database for the best exact match with a rationale.
- **Advanced EMI Calculator:** A dynamic sliding-scale engine that calculates EMIs smoothly across Principal, Rate, and Tenure. Features a Recharts Pie Chart visually breaking down Principal vs. Total Interest.
- **Affordability Engine:** Calculates a safe debt-to-income threshold (e.g., the 40% rule) based on user income input, rendering real-time safety warnings if an EMI is unaffordable.
- **Smart Prepayment Strategy:** A proactive calculator simulating lump-sum early payments, allowing users to see exactly how much total compound interest they can save by paying early.

---

## 3. Technical Architecture Summary

### 3.1 Tech Stack
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS (Vanilla utilities, custom animations)
- **Icons:** `lucide-react`
- **Charting Engine:** `recharts` (SVG-based reactive data visualization)
- **Routing:** `react-router-dom`

### 3.2 Core Logic Files
- **`src/data/mockData.js`:** The centralized single source of truth simulating a backend database. Contains the `userProfile`, `banks`, `loans`, `creditCards`, and `investments` state.
- **`src/services/aiService.js`:** The deterministic AI brain of the application. Contains all algorithmic logic including:
  - `calculateFinancialHealthScore`
  - `getBudgetPlan`
  - Bank/Loan/Card recommendation engines
  - `simulateAIOCRAnalysis`
  - `checkAffordability`
  - `calculatePrepaymentSavings`

---

## 4. Current Status & Next Steps
**Status:** The core vision of merging an Expense Analyzer with an AI Banking Assistant has been successfully realized across 4 major development iterations. The UI is fully responsive and leverages modern Fintech Glassmorphic design paradigms.

**Potential Next Steps (Backlog):**
- Implementation of the Expense Analyzer logic (tracking individual transactions, adding new expenses).
- Creating the integrated Voice Chat Assistant.
- Connecting a real LLM (like Groq API) for the conversational AI Assistant tab.
- Building out settings and profile management.
