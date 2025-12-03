1. Ledgo ERP — The Best ERP Till Date (India Focus)
2. Problem Statement
Managing business operations and accounting efficiently in India often relies on tools like Tally ERP, favored by accountants due to their keyboard-first interface and customizable shortcuts. However, these platforms lack modern UIs and are less accessible to managers or CTOs looking for data insights and collaboration. Ledgo ERP bridges this gap by offering:
A powerful keyboard-first experience for accountants.
An intuitive, feature-rich UI for managers and CTOs.
Built-in AI-powered chatbots for fast support, queries, and automation.
Centralized platform for business management and finance.
3. System Architecture
Frontend: React.js with React Router for page navigation; custom keyboard shortcut management for all workflows; dynamic UI components for dashboards, reports, and approvals.
Backend (API): Node.js with Express.js; Prisma ORM for database modeling; RESTful API endpoints.
Database: MySQL (relational, scalable); Prisma acts as the ORM layer.
Authentication: JWT-based login/signup; role-based access (Accountant, Manager, CTO, Admin).
Chatbot/AI Integration: OpenAI or Claude API for ERP and accounting assistance.
Hosting:
Frontend → Vercel/Netlify
Backend → Render/Railway
Database → PlanetScale/MySQL Cloud
4. Key Features
Category
Features
Authentication
User registration, login, logout, strong role-based access (Accountant/Manager/Admin/CTO)
Keyboard Shortcuts
Configure core actions (add voucher, ledger search, transaction entry) via keyboard flows
CRUD Operations
Create, read, update, delete for core entities (accounts, vouchers, products, users)
Powerful UI
Interactive dashboards, approval workflow, analytics, filtering, sorting, search
AI/Chatbot
Chatbot for support, quick queries (find account, summarize sales, search transaction)
Frontend Routing
Home, Login, Dashboard, Ledger Details, User Roles, Profile, Reports, etc.
Data Management
Robust pagination, filtering, advanced search, audit logs
Hosting
Publicly accessible backend and frontend URLs

5. Tech Stack
Layer
Technologies
Frontend
React.js, React Router, Axios, TailwindCSS/Bootstrap, shortcut lib
Backend
Node.js, Express.js, Prisma ORM
Database
MySQL, PlanetScale
Authentication
JWT, OAuth (future scaling), RBAC
AI & Chatbot
OpenAI API, Claude API
Hosting
Vercel, Render, Netlify, Railway

6. API Overview (Sample)
Endpoint
Method
Description
Access
/api/auth/signup
POST
Register new user
Public
/api/auth/login
POST
Authenticate user
Public
/api/accounts
GET
List all accounts
Authenticated
/api/vouchers
POST
Add new voucher/transaction
Accountant/Admin
/api/ledger/:id
GET
View ledger details
Authenticated
/api/ledger/:id
PUT
Update ledger entry
Accountant/Admin
/api/ledger/:id
DELETE
Delete ledger entry
Admin only
/api/chatbot/query
POST
Query AI chatbot for ERP/accounting help
All roles
/api/users/:id
PUT
Update user profile/role
Admin only


