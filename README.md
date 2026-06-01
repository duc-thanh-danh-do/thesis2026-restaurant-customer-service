# thesis2026-restaraunt-customer-service
## 📖 Project Overview

This platform aims to solve the high hardware costs and rigid communication gaps in traditional restaurant ordering systems. By utilizing a **Unified Next.js Backend-for-Frontend (BFF) Architecture**, it delivers a seamless, app-free dining experience. Customers can scan table-specific QR codes to access dynamic menus, manage shared carts in real-time, and consult a context-aware AI assistant (powered by Google Gemini) for personalized dish recommendations and allergen safety.

To ensure code quality and prevent integration issues, this project strictly follows **GitHub Flow** and utilizes an automated CI/CD pipeline.

### 1. Branching Strategy (分支管理规范)
- **DO NOT push directly to `main`.** (严禁直接向 main 分支推送代码)
- For any new feature or bug fix, create a new branch from `main`:
  ```bash
  git checkout -b feat/your-feature-name
  # or
  git checkout -b fix/your-bug-name

### ✨ Key Features (Planned & In Progress)
* **Frictionless Customer Access:** QR-code-based session entry without mandatory account registration.
* **Agile Menu Management:** Staff dashboard to manage menu categories, items, visibility, and availability.
* **AI Menu Q&A Assistant:** Retrieval-Augmented Generation (RAG) implementation using Gemini 2.5 Flash-Lite, allowing customers to ask dietary and allergen-related questions based strictly on the restaurant's live database.
* **Automated CI/CD:** Strict code quality enforcement via GitHub Actions.

## 🛠️ Technology Stack

This project is built as a **Monorepo** to reduce development overhead and ensure full-stack type safety.

* **Framework:** [Next.js (App Router)](https://nextjs.org/) serving as a unified BFF.
* **Language:** TypeScript (Strict Mode).
* **Styling:** Tailwind CSS.
* **AI Integration:** Google Gemini SDK (`@google/generative-ai`).
* **CI/CD:** GitHub Actions (Automated Lint & Typecheck) & Vercel (Deployment).

## 🗂️ Repository Structure

Based on our architectural separation of concerns, the repository is structured as follows:

```text
.
├── .github/workflows/      # CI pipeline configurations (GitHub Actions)
├── client/                 # Main Next.js application (Frontend & BFF API layer)
│   ├── app/                # Next.js App Router (UI routes and API handlers)
│   ├── components/         # Reusable React components
│   ├── lib/                # Shared utilities and configurations
│   ├── types/              # Global TypeScript definitions
│   └── ...                 # Features, hooks, and static assets
├── documentation/          # System architecture docs and API contracts (v0.1, v0.2)
├── server/                 # (Deprecated/Reserved) Standalone server logic 
└── README.md               # You are here

Getting Started
Follow these steps to set up the development environment locally. All active development takes place inside the client directory.

1. Prerequisites
Node.js (v18.x or newer)

2. Installation
Navigate to the client directory and install the required dependencies:
cd client
npm install

3. Code Quality Checks (CI Scripts)
Before committing your code, ensure it passes the strict linter and TypeScript compiler checks:
npm run lint
npm run typecheck

4. Run the Development Server
npm run dev