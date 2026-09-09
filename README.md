# Job Portal Platform

Full-stack MERN recruitment platform with separate experiences for candidates, recruiters, and administrators. The repository contains two React/Vite browser applications and one Express/MongoDB server.

![alt text](image-1.png)

## Contents

- [What this project does](#what-this-project-does)
- [System overview](#system-overview)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Repository structure](#repository-structure)
- [Application boundaries](#application-boundaries)
- [Configuration](#configuration)
- [Backend architecture](#backend-architecture)
- [API reference](#api-reference)
- [Authentication and authorization](#authentication-and-authorization)
- [Product workflows](#product-workflows)
- [Admin console](#admin-console)
- [Data model](#data-model)
- [Files, uploads, and storage](#files-uploads-and-storage)
- [Payments and wallets](#payments-and-wallets)
- [Real-time messaging and notifications](#real-time-messaging-and-notifications)
- [Scheduled jobs](#scheduled-jobs)
- [Frontend architecture](#frontend-architecture)
- [Commands](#commands)
- [Testing and verification](#testing-and-verification)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Development guidelines](#development-guidelines)
- [Known limitations](#known-limitations)

## What this project does

The platform connects candidates looking for work with recruiters and companies posting jobs.

### Candidate capabilities

- Create an account through a paid registration flow.
- Verify email and phone number with OTP flows.
- Maintain a professional profile, resume, experience, education, certifications, projects, portfolio, social links, and profile photo.
- Search and filter jobs.
- View job details and company profiles.
- Save jobs, apply to jobs, withdraw applications, and track application status.
- Receive recommended jobs and resume-match information.
- Communicate with recruiters through conversations and notifications.
- Manage account, privacy, security, notification, and job preferences.
- Recover a candidate ID and reset a forgotten password.

### Recruiter capabilities

- Register a recruiter/company account through a paid registration flow.
- Maintain recruiter, company, team, and company-image information.
- Create, edit, close, delete, and request reopening for job postings.
- View applicants and update application status.
- Invite and manage company team members.
- Contact candidates and download resumes using wallet-controlled access.
- Manage wallet balance, recharge wallet, and review wallet transactions.
- Upload offer letters and participate in the hired-badge workflow.
- Manage recruiter settings, password, security, and profile picture.

### Administrator capabilities

- Sign in through a completely separate admin application and token namespace.
- View dashboard statistics and recent platform activity.
- Search candidates, recruiters, and jobs from the global admin search.
- Review candidate and recruiter accounts, verification, status, documents, notes, analytics, applications, and activity.
- Manage jobs, applicants, job reports, disputes, reopen requests, payments, refunds, wallets, and hired badges.
- Configure platform branding, payment settings, payment plans, moderation, session timeout, and security settings.
- Manage other administrators when signed in as a superadmin.
- Review admin notifications, sessions, and audit logs.

## System overview

```text
Candidate browser  ───────┐
                          │
Recruiter browser ───────┼──> backend/ Express REST API ──> MongoDB
                          │                 │
Admin browser ───────────┘                 ├── Razorpay
                                            ├── SMTP/Nodemailer
                                            ├── Cloudinary or Cloudflare R2
                                            ├── Twilio
                                            └── Socket.IO
```

| Component | Directory | Technology | Default URL |
|---|---|---|---|
| Public application | `frontend/` | React 18, Vite, Tailwind CSS | `http://localhost:3000` |
| Admin application | `admin-panel/` | React 18, Vite, Tailwind CSS | `http://localhost:3001` |
| API and real-time server | `backend/` | Node.js, Express, Socket.IO | `http://localhost:5000` |
| Database | External/local | MongoDB through Mongoose | Configured by `MONGO_URI` |

The public application and admin application are intentionally separate. The public app never imports admin routes, and the admin app uses a separate API base path and token key.

## Requirements

- Node.js 18 or newer. Node.js 20 LTS is recommended for deployment.
- npm 9 or newer.
- MongoDB, either a local server or MongoDB Atlas.
- A browser with JavaScript enabled.
- Provider accounts only for the features you need:
  - Razorpay for production payments.
  - SMTP-compatible email provider for email and admin two-factor flows.
  - Cloudinary and/or Cloudflare R2 for media and file storage.
  - Twilio for SMS verification.
- Network access to MongoDB and external providers.

## Quick start

### 1. Install dependencies

Run each install from the corresponding directory:

```powershell
cd backend
npm install

cd ..\frontend
npm install

cd ..\admin-panel
npm install

### 2. Create environment files

Create `backend/.env`, `frontend/.env`, and `admin-panel/.env` using the templates in [Configuration](#configuration). Never commit real secrets.

### 3. Start the backend

```powershell
cd backend
npm run dev
```

The backend connects to MongoDB before it starts listening. Check it with:

```text
http://localhost:5000/health
```

Expected response:

```json
{"status":"ok"}
```

### 4. Start the public frontend

In a second terminal:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:3000`.

### 5. Start the admin panel

In a third terminal:

```powershell
cd admin-panel
npm run dev
```

Open `http://localhost:3001/login`.

### Local service URLs

| Service | URL |
|---|---|
| Backend health | `http://localhost:5000/health` |
| Public API | `http://localhost:5000/api` |
| Admin API | `http://localhost:5000/admin-api` |
| Socket.IO | `ws://localhost:5000` |
| Public frontend | `http://localhost:3000` |
| Admin panel | `http://localhost:3001` |

## Repository structure

```text
updated-job-portal-main/
├── README.md
├── backend/
│   ├── server.js                         # Database, HTTP, Socket.IO, cron startup
│   ├── package.json
│   ├── seedAdmin.js                      # Admin account creation utility
│   ├── seedMessageTest.js                # Message test-data utility
│   ├── seedTestRecruiter.js              # Recruiter test-data utility
│   ├── migrateRecruiters.js              # Recruiter migration utility
│   ├── src/
│   │   ├── app.js                         # Express application and route mounting
│   │   ├── config/                        # Database and external-provider setup
│   │   ├── controllers/                   # Request handlers, grouped by domain
│   │   ├── jobs/                           # node-cron scheduled jobs
│   │   ├── middleware/                     # Auth, roles, upload, rate limits, maintenance
│   │   ├── models/                         # Mongoose schemas and models
│   │   ├── routes/                         # REST route declarations
│   │   ├── services/                       # Email, platform settings, audit, 2FA services
│   │   └── utils/                          # Token and shared utility functions
│   └── uploads/                            # Local upload fallback/storage directory
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/                            # Public Axios client
│       ├── components/                     # Shared public UI
│       ├── context/                        # Public auth and app state
│       ├── data/                           # Frontend constants/data
│       ├── pages/                          # Public, candidate, and recruiter pages
│       ├── routes/                         # Public protected-route wrappers
│       ├── socket.js                       # Socket.IO client setup
│       ├── theme.js                        # Theme tokens
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
└── admin-panel/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api/                            # Admin Axios client
        ├── components/                     # Admin layout, navigation, shared UI
        ├── context/                        # Admin auth state
        ├── pages/                          # Admin dashboard and management pages
        ├── routes/                         # Admin protected-route wrappers
        ├── App.jsx
        ├── index.css
        └── main.jsx
```

## Application boundaries

### Public frontend

`frontend/src/App.jsx` owns public routes. Public pages include marketing/help/legal pages, candidate workspace pages, recruiter workspace pages, and public recruiter/company profiles.

Authentication is provided by `frontend/src/context/AuthContext.jsx`. Candidate workspace pages are protected by `ProtectedRoute` and `CandidateWorkspaceRoute`. Recruiter workspace pages are protected by `ProtectedRoute role="recruiter"`.

### Admin panel

`admin-panel/src/App.jsx` owns admin routes. `/login` is public; all other routes are inside `AdminProtectedRoute` and `AdminLayout`.

Admin pages include:

| Area | Pages/routes |
|---|---|
| Overview | Dashboard |
| Users | Recruiters, pending recruiters, recruiter profile, Candidates, candidate profile |
| Hiring | Jobs, job details, job applicants, Applications, Reopen Requests, Job Reports |
| Finance | Account/wallet payments, Analytics/reports, payment management |
| Moderation | Disputes, badge approvals |
| Configuration | Settings |
| Security | Admin Management, Admin Profile |

`AdminLayout.jsx` owns the desktop sidebar, mobile drawer, top search, notifications, admin profile shortcut, logout action, and nested `<Outlet />` content.

## Configuration

### Backend environment: `backend/.env`

#### Core server and URLs

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/job-portal
PUBLIC_FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

`PUBLIC_FRONTEND_URL` and `ADMIN_FRONTEND_URL` are used by CORS. `FRONTEND_URL` is also used when email links are generated.

#### JWT secrets and expiry

```dotenv
JWT_SECRET=replace-with-a-long-random-public-secret
JWT_EXPIRES_IN=1h
ADMIN_JWT_SECRET=replace-with-a-different-long-random-admin-secret
ADMIN_JWT_EXPIRES_IN=30m
```

Use different, high-entropy secrets. Rotating a secret invalidates tokens signed with the old value.

#### Razorpay

```dotenv
RAZORPAY_KEY_ID=replace-me
RAZORPAY_KEY_SECRET=replace-me
PRICE_CANDIDATE_REGISTRATION=9
PRICE_RECRUITER_REGISTRATION=110
PRICE_RESUME_DOWNLOAD=9
```

The price variables are numeric rupee amounts used by registration and resume-download flows. Development can use fallback behavior when Razorpay is not configured; production requires valid credentials.

#### Email

```dotenv
EMAIL_USER=replace-me
EMAIL_APP_PASSWORD=replace-me
```

The email service uses these values for account, password-reset, notification, and admin two-factor email operations.

#### Cloudinary

```dotenv
CLOUDINARY_URL=optional-cloudinary-url
CLOUDINARY_CLOUD_NAME=replace-me
CLOUDINARY_API_KEY=replace-me
CLOUDINARY_API_SECRET=replace-me
```

Use the configuration format expected by `backend/src/config/cloudinary.js`.

#### Twilio

```dotenv
TWILIO_ACCOUNT_SID=replace-me
TWILIO_AUTH_TOKEN=replace-me
TWILIO_PHONE_NUMBER=replace-me
```

These are required for real SMS OTP delivery.

#### Optional operational settings

```dotenv
ADMIN_IP_WHITELIST=127.0.0.1,::1
ADMIN_PAYMENTS_OVERVIEW_LIMIT=5000
```

`ADMIN_IP_WHITELIST` is a comma-separated allowlist used by admin middleware. Leave it unset when IP restriction is not part of the deployment design, but protect the admin app by network controls in production.

### Public frontend environment: `frontend/.env`

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Vite exposes variables beginning with `VITE_` to browser code. Do not put secrets here. The public Axios client uses `VITE_API_BASE_URL` and stores the public token under `localStorage.token`.

### Admin frontend environment: `admin-panel/.env`

```dotenv
VITE_ADMIN_API_BASE_URL=http://localhost:5000/admin-api
```

The admin Axios client uses this base URL and stores the admin token under `localStorage.admin_token`. Admin and public tokens must never be interchanged.

### Configuration rules

- Do not commit `.env` files or provider credentials.
- Do not expose `JWT_SECRET`, `ADMIN_JWT_SECRET`, provider secrets, SMTP passwords, or Twilio tokens in Vite variables.
- Set frontend variables before building because Vite embeds them into the generated browser bundle.
- Use exact HTTPS origins in production.
- Keep local development URLs and production URLs separate.

## Backend architecture

### Startup sequence

`backend/server.js` performs these operations:

1. Loads environment variables.
2. Configures DNS resolvers for MongoDB connectivity.
3. Imports the Express app.
4. Connects to MongoDB.
5. Starts renewal reminders, account suspension, wallet cleanup, and job-preference alert cron jobs.
6. Creates a raw HTTP server.
7. Attaches Socket.IO to that HTTP server.
8. Listens on `PORT`.

The server waits for the database connection before accepting requests.

### Express middleware order

`backend/src/app.js` configures:

1. Static `/uploads` serving.
2. Helmet security headers.
3. Morgan request logging.
4. JSON request parsing.
5. Request IDs with the `X-Request-ID` response header.
6. CORS for configured public and admin origins.
7. `GET /health`.
8. Public rate limiting and maintenance-mode middleware.
9. Public API routes under `/api`.
10. Admin routes under `/admin-api`.
11. JSON 404 handling.
12. Global error handling.

In production, internal error details are hidden. The response includes a request ID that can be correlated with server logs.

## API reference

All paths below are relative to `http://localhost:5000`.

### Public API namespaces

| Prefix | Responsibility |
|---|---|
| `/api/candidate` | Candidate registration, login, search, verification, profile, preferences, saved jobs, and account actions |
| `/api/profile` | Candidate profile sections, profile photo, resume upload/download |
| `/api/recruiter` | Recruiter registration/login, profile, company, team, invites, settings, resume access |
| `/api/jobs` | Job search, suggestions, recommendations, recruiter job management, reporting, reopening |
| `/api/companies` | Public company listings such as top companies |
| `/api/applications` | Candidate applications and recruiter applicant management |
| `/api/payments` | Registration/payment order creation and verification |
| `/api/messages` | Conversations, threads, replies, read state, and chat preference |
| `/api/otp` | Generic OTP send and verification |
| `/api/referral` | Recruiter referral lookup |
| `/api/notifications` | Candidate/recruiter notification list and read actions |
| `/api/help-center` | Support/help-center reports |
| `/api/platform` | Public platform settings needed by the public app |

### Important public endpoints

```text
POST   /api/candidate/register/create-order
POST   /api/candidate/register/verify-payment
POST   /api/candidate/login
GET    /api/candidate/search
GET    /api/candidate/me/profile
PUT    /api/candidate/me/profile
GET    /api/candidate/me/saved-jobs
POST   /api/candidate/me/saved-jobs/:jobId
DELETE /api/candidate/me/saved-jobs/:jobId

POST   /api/recruiter/register/create-payment-order
POST   /api/recruiter/register/verify-payment
POST   /api/recruiter/login
GET    /api/recruiter/me/profile
PUT    /api/recruiter/me/profile
GET    /api/recruiter/dashboard/overview
GET    /api/recruiter/me/team
POST   /api/recruiter/me/team/invite
GET    /api/recruiter/me/invites

GET    /api/jobs
GET    /api/jobs/suggestions
GET    /api/jobs/recommended
POST   /api/jobs
GET    /api/jobs/mine/list
PATCH  /api/jobs/:id
PATCH  /api/jobs/:id/close
POST   /api/jobs/:id/reopen-request

POST   /api/applications
GET    /api/applications/mine
GET    /api/applications/recruiter
PATCH  /api/applications/:id/status

POST   /api/payments/create-order
POST   /api/payments/verify
GET    /api/messages/mine
GET    /api/notifications/mine
```

The route files under `backend/src/routes/` are the authoritative source for the complete endpoint list, middleware, and parameter names. Read the route and controller together before changing an API contract.

### Admin API namespaces

All admin routes are relative to `/admin-api` and are mounted from `backend/src/routes/admin.routes.js`.

| Group | Representative endpoints |
|---|---|
| Authentication | `POST /auth/login`, `POST /auth/two-factor/verify`, `GET /auth/me`, session revoke, profile/password/2FA updates |
| Admin management | `GET/POST /admins`, `PATCH /admins/:id`, audit log |
| Dashboard and reports | `GET /dashboard/overview`, `GET /reports` |
| Platform settings | `/admin/settings`, logo upload, payment settings, payment plans, moderation settings |
| Notifications | `/admin/notifications`, mark one/all read, clear notifications |
| Candidates | `/users/candidates`, candidate profile, applications, analytics, activity, notes, verification, status, resume, password reset |
| Recruiters | `/users/recruiters`, recruiter profile, verification, status, suspension, ban, notes, documents, analytics, wallet adjustment |
| Payments | `/payments/overview`, list/detail, refund, refund status |
| Badges | `/badges/pending`, approve, reject |
| Jobs | `/jobs`, job detail, status, delete, applications, reopen-request approval/rejection |
| Moderation | `/moderation/reports` and support reports |

Example admin requests:

```text
POST  /admin-api/auth/login
GET   /admin-api/auth/me
GET   /admin-api/dashboard/overview
GET   /admin-api/users/candidates?search=term&page=1&limit=10
GET   /admin-api/users/recruiters?search=term&page=1&limit=10
GET   /admin-api/jobs?search=term&page=1&limit=10
PATCH /admin-api/users/recruiters/:id/verify
PATCH /admin-api/jobs/:id/status
GET   /admin-api/payments/overview
```

## Authentication and authorization

### Public users

- Candidate and recruiter accounts authenticate with JWTs signed using `JWT_SECRET`.
- The public Axios client sends the token as a Bearer token.
- The browser stores the token under `localStorage.token` and the serialized user under `localStorage.user`.
- `verifyTokenAndStatus` validates the token and checks account status.
- `requireRole('candidate')` and `requireRole('recruiter')` enforce role ownership.
- Suspended or banned accounts trigger a restriction event in the public app and are logged out.

### Admin users

- Admin accounts authenticate with a separate JWT signed using `ADMIN_JWT_SECRET`.
- Admin tokens include a session identifier and admin token type.
- The admin browser stores the token under `localStorage.admin_token`.
- `requireAdmin` validates admin authentication and optional IP restrictions.
- `requireSuperAdmin` protects administrator management and other high-impact settings/actions.
- Admin login may include two-factor verification through the email service.
- Admin status restrictions clear the admin session and return the user to login.

### Security boundaries

- Keep public and admin APIs on separate base paths.
- Keep public and admin tokens in separate storage keys.
- Do not link the admin application from the public application.
- Use HTTPS in production.
- Do not log credentials, tokens, payment secrets, or provider auth values.
- Preserve rate limiters, Helmet, CORS, request IDs, and audit logging when changing middleware.

## Product workflows

### Candidate registration and application

1. Candidate submits registration information.
2. Backend creates or prepares a payment order.
3. Candidate completes payment and backend verifies the payment signature.
4. Candidate account becomes available for login and verification.
5. Candidate completes profile and uploads a resume.
6. Candidate searches jobs, views a job, and submits an application.
7. Recruiter reviews the application and changes its status.
8. Candidate sees status changes through the application page and notifications.

### Recruiter registration and job publishing

1. Recruiter starts the paid registration flow.
2. Backend verifies the Razorpay payment.
3. Recruiter account and company data are created or completed.
4. Recruiter signs in and completes the company profile.
5. Recruiter creates a job posting.
6. Recruiter manages applicants and application statuses.
7. Recruiter may close a job or request admin approval to reopen it.

### Resume downloads and wallet

1. Recruiter checks candidate resume availability.
2. If access requires payment, the recruiter creates a wallet recharge/payment flow.
3. Backend verifies the payment and updates wallet/transaction records.
4. Recruiter downloads the resume.
5. Download activity is recorded for the recruiter.

### Hiring and badges

Offer-letter and hired-badge functionality spans recruiter uploads, admin pending approval, and candidate/recruiter status views. Update the offer-letter model, recruiter UI, admin badge page, and related controllers together.

### Reopen requests

1. Recruiter requests reopening a closed job.
2. Admin sees the request in the Reopen Requests page and dashboard notifications.
3. Admin approves or rejects the request.
4. Backend updates the job/request status and the recruiter sees the result.

## Admin console

### Sidebar sections

The admin panel navigation is organized into:

- Dashboard.
- Users: Recruiters and Candidates.
- Hiring: Jobs, Applicants, Reopen Requests, Job Reports.
- Finance: Account, Analytics, Settings.
- Security: Admin Management for superadmins.

The sidebar supports desktop collapse and a mobile drawer. Platform branding is configured through Settings and is displayed in the admin header; the sidebar keeps the `Admin Console` label and the logged-in admin profile card.

### Global search

The header search queries candidates, recruiters, and jobs concurrently through:

```text
GET /admin-api/users/candidates?search=...
GET /admin-api/users/recruiters?search=...
GET /admin-api/jobs?search=...
```

Results are limited in the UI and link to the relevant admin detail page. The dedicated Recruiters page supports its own name, email, company, and phone search and pagination.

### Admin roles

The ordinary admin role can use routine management features allowed by the backend. Superadmin-only features include administrator management, audit-sensitive settings, payment/refund controls, moderation settings, and other routes explicitly guarded by `requireSuperAdmin`.

## Data model

Models are in `backend/src/models/`.

| Model | Responsibility |
|---|---|
| `Candidate` | Candidate account, contact, profile, resume, preferences, and account status |
| `Recruiter` | Recruiter identity, company data, verification, team, profile, and account status |
| `Job` | Job content, recruiter ownership, lifecycle status, and listing metadata |
| `Application` | Candidate-to-job application and recruiter-managed status |
| `Payment` | Payment/order, gateway IDs, amount, status, and refund-related records |
| `Wallet` | Recruiter balance and wallet transaction activity |
| `Message` | Candidate/recruiter conversation messages |
| `Notification` | User notifications and read state |
| `OfferLetter` | Offer-letter uploads and hired-badge approval workflow |
| `Dispute` | Platform/payment dispute records and resolution state |
| `JobReopenRequest` | Recruiter requests to reopen jobs closed by the platform/admin |
| `JobReport` | Job moderation reports |
| `HelpCenterReport` | Support/help-center reports |
| `Admin` | Admin credentials, role, status, profile, and security settings |
| `AdminSession` | Admin login/session tracking and revocation |
| `AdminAuditLog` | Admin action history |
| `AdminNotification` | Admin-specific alerts and read state |
| `PlatformSettings` | Platform branding and configurable platform behavior |
| `PendingCandidateRegistration` | Candidate registration/payment staging |
| `WalletPlan` | Configurable wallet/payment plans |
| `CandidatePerformanceEvent` | Candidate performance/activity events |
| `ChatPreference` | Candidate/recruiter chat preferences |
| `DeliveryLog` | Delivery tracking for notification/email-like operations |

When changing a model, search all controllers, services, route handlers, seed scripts, and frontend pages that read or write the affected field. Existing recruiter data intentionally uses `fullName`, `companyName`, `companyWebsite`, `phone`, and related fields; do not reintroduce removed identifier-generation behavior without updating all consumers.

## Files, uploads, and storage

The backend creates an `uploads/` directory if it does not exist and exposes it at `/uploads`. Upload middleware controls file fields, file types, and limits for profile photos, resumes, company images, experience certificates, offer letters, and admin images.

The project contains configuration for:

- Cloudinary: image/media management.
- Cloudflare R2 through the AWS S3-compatible SDK: object storage option.
- Local `backend/uploads/`: development/fallback storage.

Before production deployment, choose the storage provider intentionally, configure public/private access correctly, define retention rules, and make sure uploaded files are not lost when deploying to ephemeral infrastructure.

Never expose private resume URLs without authorization. Resume download routes verify the requesting recruiter and any required wallet/payment condition.

## Payments and wallets

Razorpay configuration is in `backend/src/config/razorpay.js`. Payment-sensitive operations follow the pattern:

1. Server creates an order.
2. Client completes the gateway checkout.
3. Client sends gateway identifiers to the server.
4. Server verifies the signature with `RAZORPAY_KEY_SECRET`.
5. Server records the payment and applies the business effect.

Payment flows cover candidate registration, recruiter registration, resume downloads, and wallet recharge. Test success, failure, duplicate verification, pending states, refunds, and invalid signatures. Never trust an amount or success status supplied only by the browser.

## Real-time messaging and notifications

Socket.IO shares port `5000` with the REST server. The public client derives the socket origin from `VITE_API_BASE_URL` by removing the `/api` suffix.

Real-time behavior includes:

- Candidate/recruiter conversations.
- New-message updates.
- Notification updates.
- Read-state changes where implemented.

When changing an event name or payload, update the backend emitter, every frontend listener, authentication setup, and cleanup logic. Remove listeners when components unmount to prevent duplicate notifications.

Admin notifications use admin REST endpoints and are loaded by the admin layout. They include pending recruiter/reopen-request activity and admin notifications with read/clear actions.

## Scheduled jobs

`backend/server.js` starts these jobs after MongoDB connects:

| Job | File | Purpose |
|---|---|---|
| Renewal reminders | `renewalReminder.cron.js` | Processes renewal reminder work |
| Account suspension | `accountSuspension.cron.js` | Processes account suspension checks |
| Wallet cleanup | `walletCleanup.cron.js` | Cleans up wallet-related temporary data |
| Job preference alerts | `jobPreferenceAlerts.cron.js` | Sends alerts for matching job preferences |

Run only one coordinated worker for each scheduled job unless the job implementation has distributed locking/idempotency. Multiple backend replicas can otherwise process the same record more than once.

## Frontend architecture

### Shared frontend conventions

- React 18 functional components and hooks.
- Vite development and production builds.
- Tailwind CSS v4 for styling.
- React Router v6 for navigation.
- Axios instances for API calls.
- Lucide icons and Recharts where applicable.
- Framer Motion and Three.js are available in the public app for interactive experiences.
- Socket.IO client for public real-time features.

### Public page map

Public pages include Home, About, Contact Support, Help Center, Privacy Policy, Terms, ID Recovery, password reset, resume registration, and public recruiter profiles.

Candidate workspace pages include:

- Dashboard.
- Profile.
- Job Search and Job Detail.
- Recommended Jobs.
- Applied Jobs.
- Saved Jobs.
- Resume Match.
- Messages.
- Companies.
- Settings.

Recruiter workspace pages include:

- Dashboard.
- Recruiter/company profile.
- Jobs and Post Job.
- Applicants.
- Messages.
- Invites.
- Resume Downloads.
- Wallet.
- Settings.

### Admin page map

Admin pages are in `admin-panel/src/pages/` and are mounted by `admin-panel/src/App.jsx`. Keep admin page API calls on `adminAxiosInstance`; do not use the public Axios client for admin operations.

### UI behavior rules

- Keep tables inside horizontal overflow containers.
- Preserve readable full values for recruiter/candidate details.
- Keep loading, empty, error, and unauthorized states explicit.
- Test desktop and mobile layouts after changes.
- Preserve route guards and redirect behavior.
- Reuse existing colors, spacing, icons, and component patterns before adding a new visual system.

## Commands

### Backend commands

Run from `backend/`:

```powershell
npm install
npm run dev              # nodemon server.js
npm start                # node server.js
npm run seed:admin       # create/validate an admin account through seedAdmin.js
npm run seed:message-test
```

Additional utilities can be run directly when needed:

```powershell
node seedAdmin.js
node seedTestRecruiter.js
node migrateRecruiters.js
```

Read a seed script before running it against a non-test database.

### Public frontend commands

Run from `frontend/`:

```powershell
npm install
npm run dev
npm run build
npm run preview
```

### Admin frontend commands

Run from `admin-panel/`:

```powershell
npm install
npm run dev
npm run build
npm run preview
```

There is no root-level package file or single root-level test command. Install and run each application independently.

## Testing and verification

### Fast checks

For a backend JavaScript syntax change:

```powershell
node --check path\to\file.js
```

For a frontend change:

```powershell
cd frontend
npm run build

cd ..\admin-panel
npm run build
```

Run the build for the application that changed. If a shared backend contract changed, run both frontend builds as well.

### Manual smoke test

1. Start MongoDB and the backend.
2. Verify `/health`.
3. Open the public app and test candidate login/register behavior.
4. Test recruiter login, job creation, applicants, and profile behavior.
5. Open the admin app at `/login` and test admin authentication.
6. Confirm public token and admin token remain separate.
7. Test the changed page on desktop and mobile widths.
8. Test loading, empty, error, unauthorized, and success states.
9. Check browser console and backend logs for request IDs/errors.

### Higher-risk test cases

- Invalid and expired JWTs.
- Suspended and banned users.
- Admin versus superadmin permissions.
- Duplicate payment verification and invalid Razorpay signatures.
- Missing provider credentials in development and production.
- Upload type/size failures.
- Resume download without authorization or balance.
- Concurrent search requests and stale response handling.
- Socket reconnect, duplicate listener prevention, and logout cleanup.
- Cron idempotency when records are already processed.

## Deployment

### Backend

- Set `NODE_ENV=production`.
- Use strong separate public/admin JWT secrets.
- Use a least-privilege MongoDB user and backups.
- Set exact production CORS origins.
- Configure Razorpay production keys and signature verification.
- Configure SMTP, storage, and Twilio providers as required.
- Serve through HTTPS and proxy WebSocket upgrades for Socket.IO.
- Use a process manager with restart policy and structured logs.
- Expose a health check for orchestration.
- Run scheduled jobs only once per logical deployment.
- Keep uploads on durable storage.

### Public frontend

Build with the production API URL:

```powershell
cd frontend
npm run build
```

Deploy the generated `dist/` directory to a static host. Configure history fallback so client-side routes resolve to `index.html`.

### Admin frontend

Build with the production admin API URL:

```powershell
cd admin-panel
npm run build
```

The admin app should ideally be hosted on a protected subdomain, VPN, private network, or IP-restricted environment. Configure history fallback for admin routes as well.

### Production checklist

- [ ] Secrets are stored in the deployment secret manager.
- [ ] No credential is present in frontend source or generated static configuration.
- [ ] MongoDB network access and backups are configured.
- [ ] Public and admin domains are correctly listed in CORS.
- [ ] HTTPS works for REST, browser pages, and Socket.IO.
- [ ] Razorpay webhook/signature behavior has been tested.
- [ ] Email, SMS, image, and object-storage providers have been tested.
- [ ] Admin access is network-protected.
- [ ] Durable storage is configured for resumes and images.
- [ ] Logs, health checks, and restart policy are active.
- [ ] Exactly one coordinated scheduled-job worker is active.

## Troubleshooting

### The backend will not start

Check `MONGO_URI`, MongoDB availability, DNS/network access, credentials, and Atlas IP allowlisting. Startup intentionally waits for the database.

### Browser reports a CORS error

Check the exact protocol, host, and port against `PUBLIC_FRONTEND_URL` and `ADMIN_FRONTEND_URL`. Development loopback origins are supported, but production origins must be explicitly configured.

### Admin requests return 401

Confirm that:

- The admin panel points to `/admin-api`.
- The backend is running.
- `admin_token` exists and has not expired.
- The account exists and is active.
- The admin JWT secret matches the secret used when the server started.

Clear only the admin token when testing admin auth; do not accidentally remove the public user token while debugging the public app.

### Public requests return 401 or 403

Check `VITE_API_BASE_URL`, `localStorage.token`, token expiry, role, and account status. Suspension and ban responses intentionally clear the public session.

### Payments fail

Check Razorpay key ID/secret, environment mode, amount units, signature generation, and server-side verification. Do not treat a browser callback alone as proof of payment.

### Emails or OTPs do not arrive

Check SMTP credentials, sender restrictions, provider logs, spam folders, and Twilio credentials for SMS. Never print secrets while diagnosing delivery.

### Uploads fail or disappear after deployment

Check multipart field names, MIME/type limits, provider credentials, bucket permissions, and whether the deployment filesystem is ephemeral. Move production uploads to durable object storage.

### Socket.IO does not connect

Check the derived socket origin, CORS configuration, HTTPS/WebSocket proxy settings, token availability, and server logs. Confirm listeners are not being registered repeatedly by a component.

### Data appears stale after searching

Check request cancellation/stale-response handling, query parameter names, backend pagination, and whether the API searches the fields shown in the UI. The admin global search queries multiple resources concurrently, so inspect each response separately.

## Development guidelines

1. Identify the owning route, controller, model, service, or page before editing.
2. Read the neighboring implementation and its API response shape.
3. Preserve public APIs and existing local patterns unless a contract change is required.
4. Keep backend authorization in the backend; frontend guards are not security boundaries.
5. Validate all payment, file, and user-provided data server-side.
6. Make the smallest focused change possible.
7. Run diagnostics and the narrowest relevant build immediately after editing.
8. Test both success and failure paths.
9. Test mobile layout for UI changes.
10. Update this README when setup, configuration, route ownership, or deployment behavior changes.

## Known limitations

- There is no root-level package script that starts all three processes together.
- Automated test coverage is not represented by a single root test suite; verification currently relies on focused builds, syntax checks, and manual workflows.
- Some dashboard/finance display values may have fallback or presentation logic and should not automatically be treated as accounting source-of-truth data without checking the controller and database records.
- Production deployment configuration for Docker, reverse proxy, CI/CD, and process management is not standardized in this repository.
- Local upload behavior is not a substitute for durable production storage.
- Running multiple backend replicas requires explicit coordination for cron jobs and any non-idempotent scheduled work.
- API response fields are consumed directly by frontend pages; renaming a field requires coordinated backend/frontend changes.

## Related project documents

The repository contains focused operational and implementation notes. Read the relevant document before changing that area:

- `TESTING_GUIDE.md`
- `DEPLOYMENT_CHECKLIST.md`
- `DEPLOYMENT_ACTION_PLAN.md`
- `ADMIN_UNLOCK_ENDPOINT.md`
- `ADMIN_UNLOCK_IMPLEMENTATION.md`
- `RECRUITER_PROFILE_SETUP.md`
- `EMAIL_FIX_SUMMARY.md`
- `LANGUAGES_TEST.md`
- `REPORTS_PAGE_ANALYSIS.md`
- `REPORTS_IMPLEMENTATION_GUIDE.md`
- `REPORTS_ACTION_ITEMS.md`
- `QUICK_REFERENCE.md`

The source code is the implementation authority. Project notes describe decisions and verification history, but route/controller/model behavior should always be checked before making a change.
