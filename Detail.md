# Job Portal Project - Interview Preparation Detail

This document is an interview-ready explanation of the Job Portal project. It is based on the current repository structure, package files, README, backend routes/models/services, frontend pages, admin panel, and the recent referral and external-application-link work.

---

## 1. One-Minute Project Introduction

I worked on a full-stack MERN recruitment platform called **Job Portal**. It connects candidates, recruiters, companies, and administrators in one system.

The platform has three separate experiences:

1. A public React application for candidates and recruiters.
2. A separate React admin panel for platform administration.
3. A Node.js and Express backend that exposes REST APIs and Socket.IO real-time events.

MongoDB stores the application data through Mongoose. Candidates can register, maintain profiles and resumes, search jobs, save jobs, apply, track applications, message recruiters, receive notifications, and receive referrals. Recruiters can register companies, post jobs, create application questions, manage applicants, communicate with candidates, download resumes through wallet-controlled access, manage offers, and handle company settings. Administrators can moderate jobs and users, manage payments, disputes, reports, badges, settings, and other administrators.

The default local architecture is:

```text
Candidate React app  ----\
                          \
Recruiter React app -------> Express REST API ----> MongoDB
                            /              \\
Admin React app -----------/                \\--> Razorpay
                                             \\--> SMTP/Nodemailer
                                              \\--> Cloudinary / Cloudflare R2
                                               \\--> Twilio
                                                \\--> Socket.IO
```

The public frontend runs on port `3000`, the admin frontend on `3001`, and the backend on `5000`.

---

## 2. Project Goals

The main goals were:

- Build a complete recruitment marketplace rather than only a job listing page.
- Separate candidate, recruiter, and administrator responsibilities.
- Protect sensitive operations with authentication, role checks, and account-status checks.
- Support real recruitment workflows: posting, applying, reviewing, interviewing, offering, hiring, and notifications.
- Support paid operations such as candidate registration, recruiter registration, wallet recharge, and resume access.
- Provide both normal platform applications and recruiter-owned external applications.
- Support real-time messaging and notification updates.
- Make the admin side independent from the public application for security and maintainability.
- Keep the code organized by domain using routes, controllers, models, services, middleware, and reusable React components.

---

## 3. Technology Stack

### Backend

- **Node.js**: JavaScript runtime for the server.
- **Express 4**: HTTP server and REST API framework.
- **CommonJS**: Backend module system, configured with `type: commonjs`.
- **MongoDB**: Document database.
- **Mongoose**: MongoDB ODM for schemas, references, validation, indexes, queries, and population.
- **Socket.IO**: Real-time messaging and notifications.
- **JWT / jsonwebtoken**: Stateless authentication tokens.
- **bcryptjs**: Password hashing and verification.
- **dotenv**: Environment configuration.
- **Helmet**: Security-related HTTP headers.
- **CORS**: Controlled cross-origin access for the public and admin frontends.
- **Morgan**: HTTP request logging.
- **express-rate-limit**: API rate limiting.
- **sanitize-html**: Sanitizing recruiter-authored rich job descriptions.
- **Multer**: Multipart file upload handling.
- **pdf-parse**: PDF resume parsing.
- **Razorpay**: Payment orders, payment verification, refunds, and wallet-related payments.
- **Nodemailer**: Email delivery.
- **Twilio**: SMS and phone OTP integration.
- **Cloudinary**: Image/media storage option.
- **AWS SDK S3 client**: Cloudflare R2 S3-compatible storage option.
- **node-cron**: Scheduled reminders, suspension checks, wallet cleanup, and job alerts.
- **XLSX**: Spreadsheet-related export or processing functionality.
- **Nodemon**: Development server restart utility.

### Public frontend

- **React 18**: Component-based UI.
- **Vite**: Development server and production bundler.
- **React Router v6**: Client-side routes and protected route layouts.
- **Axios**: API requests through a shared public Axios instance.
- **Tailwind CSS**: Utility-first responsive styling.
- **Framer Motion**: UI transitions and page animations.
- **Lucide React**: Consistent icon system.
- **Recharts**: Charts and dashboard visualizations.
- **Socket.IO client**: Real-time connection to the backend.
- **Three.js, React Three Fiber, Drei, and postprocessing**: Available for interactive/visual experiences.
- **react-easy-crop and react-image-crop**: Image cropping workflows.

### Admin frontend

- **React 18**
- **Vite**
- **React Router v6**
- **Tailwind CSS**
- **Axios with a separate admin Axios instance**
- **Framer Motion**
- **Lucide React**
- **Recharts**
- **Three.js**
- **Lottie/DotLottie React**

### Why this stack

I used React because the product contains many interactive workflows and reusable UI surfaces. Vite gives fast development and optimized production builds. Express is lightweight and works well for domain-based REST APIs. MongoDB fits the product because candidate profiles, recruiter profiles, jobs, application answers, preferences, and notifications have flexible nested data. Mongoose adds schema validation and relationships on top of MongoDB. Socket.IO is useful for messages and notifications where the user should see updates without refreshing.

---

## 4. Repository Structure

```text
updated-job-portal-main/
├── README.md
├── Detail.md
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── seedAdmin.js
│   ├── seedMessageTest.js
│   ├── seedTestRecruiter.js
│   ├── migrateRecruiters.js
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── uploads/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── data/
│       ├── pages/
│       ├── routes/
│       ├── socket.js
│       └── theme.js
└── admin-panel/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── api/
        ├── components/
        ├── context/
        ├── pages/
        └── routes/
```

### Backend organization

- `server.js`: Loads environment variables, connects MongoDB, starts cron jobs, creates the HTTP server, attaches Socket.IO, and listens on the configured port.
- `src/app.js`: Creates the Express app, configures middleware, mounts API routes, exposes health checks, and handles errors.
- `config/`: Database, cloud storage, Razorpay, Twilio, email/socket configuration.
- `controllers/`: Business logic for candidates, recruiters, jobs, applications, payments, messages, referrals, admin operations, and more.
- `models/`: Mongoose schemas and database models.
- `routes/`: HTTP route declarations and middleware composition.
- `middleware/`: Authentication, role checks, uploads, rate limiting, maintenance mode, admin restrictions, and validation-related behavior.
- `services/`: Reusable business services such as notifications, email, audit logs, sessions, badges, platform settings, and verification storage.
- `jobs/`: Cron/scheduled workers.

### Frontend organization

- `App.jsx`: Public route tree and application layout.
- `api/axiosInstance.js`: Public API client and token interceptor.
- `context/AuthContext.jsx`: Public login/session state.
- `routes/`: Candidate and recruiter route protection.
- `components/`: Shared navigation, application forms, notification center, profile UI, and common components.
- `pages/candidate/`: Candidate dashboard, profile, job search, job detail, saved/applied/recommended/referred jobs, messages, settings, companies, and resume match.
- `pages/recruiter/`: Recruiter dashboard, company profile, post job, jobs, applicants, messages, invites, wallet, settings, and resume downloads.
- `socket.js`: Public Socket.IO client configuration.
- `theme.js`: Shared design tokens.

### Admin organization

The admin application is intentionally separate. It has its own `App.jsx`, protected route, auth context, Axios instance, layout, pages, and CSS. This prevents accidental mixing of admin APIs and public APIs.

---

## 5. Application Boundaries and Ports

| Application | Directory | Default URL | Main responsibility |
|---|---|---|---|
| Public frontend | `frontend/` | `http://localhost:3000` | Candidate and recruiter workflows |
| Admin panel | `admin-panel/` | `http://localhost:3001` | Platform administration |
| Backend | `backend/` | `http://localhost:5000` | REST API and Socket.IO |
| MongoDB | External/local | From `MONGO_URI` | Persistent data |

API prefixes:

- Public API: `http://localhost:5000/api`
- Admin API: `http://localhost:5000/admin-api`
- Health check: `http://localhost:5000/health`
- Socket.IO: `ws://localhost:5000`

There is no root `package.json`; each application is installed and run independently.

---

## 6. Backend Startup and Express Request Flow

### Startup sequence

`backend/server.js` does the following:

1. Loads `.env` through `dotenv`.
2. Configures DNS resolvers used for database connectivity.
3. Imports the Express application.
4. Connects to MongoDB using Mongoose.
5. Starts scheduled jobs:
   - Renewal reminders.
   - Account suspension processing.
   - Wallet cleanup.
   - Job preference alerts.
6. Creates a raw Node HTTP server from the Express app.
7. Attaches Socket.IO to the same HTTP server.
8. Starts listening on `PORT`, defaulting to `5000`.

The server intentionally waits for MongoDB before listening. This prevents the application from accepting requests while its primary data store is unavailable.

### Middleware order

`backend/src/app.js` configures middleware in this general order:

1. Static `/uploads` directory.
2. Helmet security headers.
3. Morgan request logging.
4. JSON request parsing.
5. Request ID generation using `crypto.randomUUID()`.
6. CORS validation.
7. `/health` endpoint.
8. Public rate limiter.
9. Maintenance-mode middleware.
10. Public route groups under `/api`.
11. Admin route group under `/admin-api`.
12. JSON 404 fallback.
13. Global error handler.

Each request receives an `X-Request-ID` header. This allows a frontend error or support report to be correlated with a backend log entry.

### Error handling

The backend returns JSON errors instead of HTML errors. In development, the server can log more detail. In production, sensitive internal details should be hidden while the request ID remains available for debugging.

---

## 7. Authentication and Authorization

### Public authentication

Candidates and recruiters use the public JWT system:

- Tokens are signed with `JWT_SECRET`.
- Tokens contain a user ID and role.
- The frontend stores the token in `localStorage.token`.
- The serialized user is stored in `localStorage.user`.
- Axios attaches `Authorization: Bearer <token>` to requests.
- `verifyToken` validates the token.
- `verifyTokenAndStatus` validates the token and checks account status.
- `requireRole('candidate')` and `requireRole('recruiter')` enforce ownership of protected operations.

### Admin authentication

The admin panel uses a separate authentication system:

- Admin tokens are signed with `ADMIN_JWT_SECRET`.
- Admin tokens use a different token namespace and storage key.
- The admin frontend stores its token under `localStorage.admin_token`.
- The admin API uses `/admin-api`, not `/api`.
- Admin middleware validates admin identity, token type, session information, status, and optional IP restrictions.
- Superadmin-only actions are protected by `requireSuperAdmin`.
- Admin login can include email-based two-factor verification.

### Why separate public and admin authentication

This creates an explicit security boundary. A public candidate or recruiter token cannot be replayed against admin routes, and public frontend code does not need to know about admin endpoints. It also allows separate deployment and stricter network protection for the admin application.

### Account status enforcement

Candidate and recruiter requests can be rejected when an account is suspended or banned. The frontend clears the session and displays a restriction flow. The backend remains the real security boundary; frontend route protection is only a user-experience layer.

### Security practices

- Separate JWT secrets for public users and admins.
- Separate token storage keys.
- Role-based authorization on server routes.
- Helmet security headers.
- CORS allowlisting.
- Rate limiting.
- Password hashing with bcryptjs.
- Server-side payment verification.
- Server-side file authorization.
- Sanitization of rich HTML.
- Request IDs for traceability.
- No frontend secrets in Vite variables.

---

## 8. Data Model and MongoDB Design

### Candidate

The `Candidate` model contains:

- A generated unique candidate ID such as `JS-2026-000123`.
- Name, email, phone, verification flags, and password hash.
- Work status and experience certificate information.
- Nested profile data:
  - Headline and about section.
  - Location and availability.
  - Skills and preferred skills.
  - Preferred roles and locations.
  - Salary preferences.
  - Notice period.
  - Alert frequency.
  - Experience history.
  - Education.
  - Certifications.
  - Languages.
  - Projects.
  - Resume URL and filename.
  - Social links.
  - Profile photo.
- Account status and notification preferences.

The unique ID is used in candidate referral lookup and candidate identity flows.

### Recruiter

The `Recruiter` model contains:

- Recruiter login and identity information.
- Full name, email, phone, designation, and password hash.
- Company name, company website, company details, logo, and industry.
- Verification and account status.
- Recruiter settings and profile data.
- Team members and invitation-related data.
- Wallet-related state and recruiter permissions.

Recruiter unique-ID generation was intentionally removed from the current recruiter data design. Company and recruiter information uses fields such as `fullName`, `companyName`, `companyWebsite`, `phone`, and `designation`.

### Job

The `Job` model contains:

- Title, role, category, industry, description, and location.
- Salary and experience level.
- Required skills.
- Rich `descriptionSections` HTML stored separately from flattened description text.
- Recruiter ownership through `postedBy`.
- Application form configuration.
- Job lifecycle status.
- Moderation status and moderation matches.
- Admin closure and previous status values.

Accepted lifecycle statuses include `open`, `closed`, `active`, and `draft` to support both the recruiter posting flow and admin moderation.

The current application form also supports an `externalApplyLink`. When present, candidates are redirected to the recruiter/company link instead of completing internal questions.

### Application

The `Application` model links:

- Candidate.
- Job.
- Recruiter.
- Application status.
- Optional `referredByUniqueId`.
- Timestamps and application timeline dates.
- Interview date/time.
- View counters.
- Matching information such as matched skills and experience match.
- Recruiter notes.
- Submitted custom question answers.

Application statuses include:

- `applied`
- `viewed`
- `shortlisted`
- `interview_scheduled`
- `offered`
- `accepted`
- `rejected`
- `hired`

### Referral

The `Referral` model was added for candidate-to-candidate job referrals. It stores:

- The referrer candidate.
- The referred candidate.
- The job.
- Timestamps.

A compound unique index prevents the same referrer from referring the same candidate for the same job more than once.

### Notification

Notifications can belong to a candidate or recruiter. They contain:

- Recipient.
- Type.
- Title.
- Message.
- Optional related object ID.
- Read state.
- Timestamps.

Types include application-status notifications, messages, job alerts, referrals, and system notifications.

### Payment and wallet models

- `Payment`: gateway order, payment ID, amount, status, purpose, verification, and refund-related information.
- `Wallet`: recruiter balance and transaction records.
- `WalletPlan`: configurable wallet plans.

### Other models

- `Message`: candidate/recruiter conversation messages.
- `OfferLetter`: offer letter uploads and hiring/badge workflow.
- `Dispute`: payment/platform dispute records.
- `JobReopenRequest`: requests to reopen jobs.
- `JobReport`: candidate/admin job reports.
- `HelpCenterReport`: support reports.
- `Admin`: administrator credentials, role, status, and security settings.
- `AdminSession`: admin session tracking and revocation.
- `AdminAuditLog`: high-impact admin action history.
- `AdminNotification`: admin-only notification records.
- `PlatformSettings`: branding and configurable platform behavior.
- `PendingCandidateRegistration`: staged candidate payment/registration data.
- `CandidatePerformanceEvent`: candidate activity/performance events.
- `ChatPreference`: conversation preferences.
- `DeliveryLog`: delivery tracking.

### MongoDB design explanation for interview

I used references for large or independently managed entities such as candidates, recruiters, jobs, applications, and notifications. I used nested subdocuments for profile sections that are usually read and edited together, such as education, experience, and preferences. This balances document locality with manageable relationships. Indexes exist on frequently queried identity fields such as candidate unique IDs and notification recipients.

---

## 9. REST API Organization

### Public route groups

| Prefix | Responsibility |
|---|---|
| `/api/candidate` | Candidate registration, login, profile, search, verification, saved jobs, preferences, and account actions |
| `/api/profile` | Candidate profile sections, resume, profile photo, and related uploads |
| `/api/recruiter` | Recruiter registration, login, company profile, teams, settings, and resume access |
| `/api/jobs` | Job list, detail, creation, update, moderation-related actions, reports, and reopen requests |
| `/api/companies` | Company-related public listing endpoints |
| `/api/applications` | Candidate applications and recruiter applicant management |
| `/api/payments` | Payment order creation and verification |
| `/api/messages` | Conversations, messages, preferences, read state, and replies |
| `/api/otp` | OTP operations |
| `/api/referral` | Referral lookup, creation, and referred-job listing |
| `/api/notifications` | Notification list, read, mark-all-read, and clear-read actions |
| `/api/help-center` | Support reports |
| `/api/platform` | Public platform settings |

### Important endpoint examples

```text
POST   /api/candidate/register/create-order
POST   /api/candidate/register/verify-payment
POST   /api/candidate/login
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

GET    /api/jobs
GET    /api/jobs/:id
GET    /api/jobs/recommended
GET    /api/jobs/suggestions
POST   /api/jobs
GET    /api/jobs/mine/list
PATCH  /api/jobs/:id
PATCH  /api/jobs/:id/close
POST   /api/jobs/:id/reopen-request
POST   /api/jobs/:id/report

POST   /api/applications
GET    /api/applications/mine
GET    /api/applications/recruiter
PATCH  /api/applications/:id/status
DELETE /api/applications/job/:jobId

GET    /api/notifications/mine
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/clear-read

GET    /api/referral/lookup/:uniqueId
POST   /api/referral
GET    /api/referral/mine
```

### Admin API

The admin API is mounted at `/admin-api` and includes:

- Admin login, two-factor verification, session and profile management.
- Dashboard overview and reports.
- Candidate and recruiter search, details, verification, status, notes, documents, analytics, and applications.
- Job listing, status management, deletion, applicant inspection, reports, and reopen-request decisions.
- Payment overview, details, refunds, and wallet management.
- Badge approvals.
- Disputes and support reports.
- Platform settings, payment plans, moderation settings, branding, and security.
- Admin management and audit logs.
- Admin notifications.

---

## 10. Candidate Features and Workflows

### Registration and verification

1. Candidate enters registration information.
2. The backend creates a payment order.
3. Razorpay completes payment.
4. The backend verifies the payment signature server-side.
5. The candidate account becomes available according to the registration flow.
6. Email and phone verification/OTP workflows can be used.
7. The candidate receives or recovers a unique candidate ID.

### Candidate profile

A candidate can manage:

- Basic identity and contact information.
- Headline and about text.
- Resume and resume filename.
- Work experience.
- Education.
- Certifications.
- Projects and portfolio.
- Skills and languages.
- Social links.
- Profile photo.
- Location and work preferences.
- Salary and notice-period preferences.
- Job-alert frequency.

### Job search

Candidates can:

- Search by title, role, category, skill, location, salary, experience level, and date.
- Open a detailed job page.
- View recruiter/company information.
- Save and unsave jobs.
- See recommended jobs.
- See jobs they applied to.
- See referred jobs.
- Use job-detail links to search for similar jobs.

### Internal applications

If a job has no external application link:

1. Candidate clicks Apply.
2. If there are no custom questions, the application is submitted directly.
3. If custom fields exist, the application modal opens.
4. Candidate profile information is displayed from the profile.
5. Candidate answers the custom questions.
6. The frontend submits `{ jobId, answers }`.
7. The backend creates the application and associates the candidate, job, and recruiter.
8. Candidate sees the application as applied.

### External applications

Recruiters can provide an external application URL when creating a job. The behavior is:

1. Recruiter enters an `http` or `https` external application link.
2. The recruiter form clears and disables custom questions.
3. The backend validates the URL and stores it in `applicationForm.externalApplyLink`.
4. Candidate sees the normal `Apply` button.
5. Candidate clicks Apply.
6. A confirmation dialog explains that the application will continue on the company website.
7. Cancel closes the dialog.
8. Apply opens the company URL in a new browser tab.

This avoids presenting two competing application systems for one job.

### Candidate referral feature

A candidate can refer another candidate for a specific job:

1. Candidate opens a job detail page.
2. Candidate clicks `Refer candidate`.
3. A compact modal asks for the other candidate's unique ID.
4. The backend looks up the candidate and returns a safe identity preview.
5. The candidate name is clickable in the preview.
6. Clicking the name fills the input visually while the original unique ID is preserved internally for submission.
7. Self-referral is rejected.
8. Invalid candidate IDs are rejected.
9. Duplicate referrals for the same referrer, candidate, and job are rejected.
10. A `Referral` document is created.
11. The recipient receives a notification titled `You got a referral for a job`.
12. Clicking the notification opens `/candidate/jobs/referred`.
13. The recipient sees referred job cards and can open the normal job detail page.

### Application tracking

Candidates can see statuses such as applied, viewed, shortlisted, interview scheduled, offered, accepted, rejected, and hired. Status updates are generated by recruiter actions and exposed through application APIs and notifications.

### Messaging and notifications

Candidates can:

- Open recruiter conversations.
- Receive new-message notifications.
- Receive application status notifications.
- Receive job preference alerts.
- Receive referral notifications.
- Mark notifications as read.
- Mark all as read.
- Clear read notifications.

---

## 11. Recruiter Features and Workflows

### Recruiter registration

Recruiter registration also uses a payment flow. The backend verifies payment before completing the account flow. Recruiter/company information includes company name, website, company details, contact details, industry, logo, and profile data.

### Job posting

The recruiter Post Job flow collects:

- Job title.
- Role and category.
- Company information.
- Employment type.
- Work mode.
- Openings.
- Location and extra locations.
- Remote or pan-India options.
- Minimum and maximum experience.
- Salary type, minimum, maximum, or not disclosed.
- Skills.
- About company.
- Job summary.
- Roles and responsibilities.
- Required qualifications.
- Preferred qualifications.
- Custom application requirements.
- Optional external application URL.

The form is multi-step and validates the current step before moving forward. Jobs can be published or saved as drafts.

### Rich job descriptions

The recruiter editor creates structured rich-text sections. The backend stores:

- A flattened plain-text `description` used for search and matching.
- A sanitized `descriptionSections` object used for formatted display.

Only expected formatting such as paragraphs, lists, bold, italic, underline, and line breaks is retained. Unsafe HTML and event attributes are removed with `sanitize-html`.

### Custom application questions

Recruiters can add suggested fields or custom fields. Supported field types include:

- Text.
- Textarea.
- Number.
- Radio.
- Checkbox.
- Select.
- Skills.
- Date.
- URL.
- File.

Each field can have a label, field type, options, and required flag. The backend normalizes and validates these fields rather than trusting the browser.

### Applicant management

Recruiters can:

- View applicants for jobs.
- Inspect candidate profiles.
- View application answers.
- Update application statuses.
- Schedule interviews.
- Make offers.
- Track views and resume access.
- Add recruiter notes.
- Move candidates through the hiring lifecycle.

### Resume access and wallet

Resume downloads may require wallet balance or payment. The backend checks recruiter permissions and access conditions before allowing a resume download. Download activity and payment-related records are stored.

### Company teams and invites

Recruiters can invite and manage company team members. Workspace ownership and permissions are used so team members can work within the company's recruiter workspace without bypassing ownership rules.

### Job lifecycle

Recruiters can create, update, publish, save as draft, close, report, and request reopening for jobs. Jobs closed by administrative controls may require an admin-approved reopen request.

---

## 12. Admin Panel

The admin panel is a separate React/Vite application and is not linked from the public app.

### Admin pages and responsibilities

- Dashboard: platform overview and statistics.
- Candidates: list, search, candidate profile, status, verification, applications, activity, notes, analytics, and resume-related actions.
- Recruiters: recruiter list, profile, verification, status, suspension, ban, documents, analytics, wallet adjustment, and notes.
- Jobs: job list, job detail, status, deletion, applicants, reports, and moderation.
- Applications: application-level management.
- Reopen requests: approve or reject recruiter requests.
- Job reports: review candidate reports.
- Payments: payment details, overview, refund operations, and status.
- Wallet payments: wallet and transaction operations.
- Badge approvals: hired-badge workflow.
- Disputes: platform/payment dispute handling.
- Settings: platform configuration, branding, payment plans, moderation, security, and session settings.
- Admin management: superadmin-only administrator management.
- Admin profile: admin profile and security actions.

### Admin layout

`AdminLayout` owns:

- Desktop sidebar.
- Mobile drawer.
- Top search.
- Admin notification center.
- Profile shortcut.
- Logout.
- Nested route content.

### Admin global search

The header can query candidates, recruiters, and jobs concurrently using separate admin endpoints. Results link to the correct admin detail page.

### Admin security model

- Separate base URL `/admin-api`.
- Separate `admin_token` storage key.
- Separate admin JWT secret.
- Admin status checks.
- Optional IP allowlist.
- Superadmin-only routes.
- Admin sessions and revocation.
- Admin audit logs.
- Admin-specific notifications.

---

## 13. Payments

Razorpay payment-sensitive operations follow this pattern:

1. The client requests an order from the backend.
2. The backend creates the order with Razorpay.
3. The client completes checkout.
4. The client sends gateway identifiers back to the backend.
5. The backend verifies the Razorpay signature using the secret key.
6. The backend records payment status and applies the business effect.

Payment use cases include:

- Candidate registration.
- Recruiter registration.
- Resume download access.
- Recruiter wallet recharge.
- Refund-related operations.

Important interview point: the backend never trusts only a client-side success callback. The server verifies the signature and controls the final business state.

Test cases include:

- Successful payment.
- Failed payment.
- Invalid signature.
- Duplicate verification.
- Pending payment.
- Refund state.
- Incorrect amount.

---

## 14. File Uploads and Storage

The platform handles:

- Candidate resumes.
- Profile photos.
- Company images and logos.
- Experience certificates.
- Offer letters.
- Admin images.

Multer handles multipart uploads. Development can use the local `backend/uploads/` fallback. Production can use:

- Cloudinary for image/media files.
- Cloudflare R2 through the AWS S3-compatible client for object storage.

The backend exposes local uploads through `/uploads` during development. Private resume files must not be publicly exposed without authorization. Resume download controllers validate recruiter identity and any wallet/payment requirement.

Production storage must be durable because local files can disappear when deployed to ephemeral infrastructure.

---

## 15. Email, OTP, and SMS

Nodemailer is used for email operations such as:

- Registration and account messages.
- Password reset.
- Notification emails where configured.
- Admin two-factor verification.
- Payment-related communication.

Twilio is used for SMS/phone OTP flows when credentials are configured.

In local development, provider credentials may be missing and the application can use fallback behavior. Production should configure and test the providers explicitly.

---

## 16. Real-Time Architecture

The server creates one raw HTTP server and attaches Socket.IO to it. REST and real-time events therefore share port `5000`.

### Main real-time use cases

- New message delivery.
- Notification delivery.
- Candidate/recruiter chat updates.
- Reconnection handling.
- Room-based user delivery.

The notification service creates a database notification first and then attempts a Socket.IO push. If the socket layer is unavailable, the stored notification remains available for later polling.

The recipient is addressed through a user room such as `user:<recipientId>`.

Frontend components remove Socket.IO listeners during cleanup to prevent duplicate events after navigation or remounting.

---

## 17. Scheduled Jobs

Cron jobs start after the database connection succeeds:

| Job | Purpose |
|---|---|
| Renewal reminder | Processes renewal-related reminders |
| Account suspension | Checks and applies account suspension rules |
| Wallet cleanup | Removes or processes temporary wallet records |
| Job preference alerts | Notifies candidates about matching jobs |

In a multi-instance production deployment, scheduled work must be coordinated so that every logical job runs only once. Otherwise multiple backend instances could send duplicate notifications or process the same records.

---

## 18. Frontend Architecture

### Routing

React Router provides:

- Public pages.
- Candidate protected workspace.
- Recruiter protected workspace.
- Public recruiter/company views where applicable.
- Admin protected routes in the separate admin app.

`ProtectedRoute` validates the authenticated role. `CandidateWorkspaceRoute` provides the candidate workspace layout and outlet. Recruiter routes use role-specific protection.

### API client

The public Axios instance:

- Uses `VITE_API_BASE_URL`.
- Adds the public bearer token.
- Handles authentication errors.
- Clears public session data on invalid sessions or restrictions.

The admin Axios instance:

- Uses `VITE_ADMIN_API_BASE_URL`.
- Reads `admin_token`.
- Adds admin bearer authentication.
- Redirects to admin login on unauthorized responses.

### Reusable components

Important shared components include:

- Candidate navbar.
- Recruiter navbar.
- Notification center.
- Application form and application requirements builder.
- Auth modal and registration forms.
- Company/profile components.
- Admin layout.
- Protected routes.
- Universal footer.

### UI states

The pages handle:

- Loading.
- Empty data.
- API errors.
- Unauthorized access.
- Disabled actions.
- Success messages.
- Modal dialogs.
- Responsive desktop, tablet, and mobile layouts.

---

## 19. Important Implementation Decisions

### Separate admin app

I kept the admin application separate because administrative operations have different authorization, navigation, deployment, and security requirements. It also avoids exposing admin UI code and routes to public users.

### Plain description plus structured sections

The job stores both a plain-text description and structured HTML sections. Plain text is useful for search and matching, while structured sections preserve the recruiter-friendly formatting shown on the job detail page.

### Server-side normalization

Even though the frontend validates form data, the backend normalizes application fields, job data, URLs, and rich text. Browser validation is not sufficient for security or data consistency.

### Dedicated referral collection

Referrals use a dedicated collection rather than overloading applications. A referral is a recommendation, not an application. This allows the recipient to decide whether to apply and preserves a separate referral history.

### External application mode

An external application link disables internal questions because asking candidates to answer internal questions and then redirecting them would create a confusing and duplicated flow.

### Notification service

Notifications are centralized in `notification.service.js` so status changes, messages, job alerts, and referrals can use the same persistence and real-time delivery behavior.

### Request IDs

Request IDs make production troubleshooting easier. A frontend error can be matched to one backend log entry without exposing internal implementation details to the user.

---

## 20. Environment Variables

### Backend

Typical backend variables include:

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=...
PUBLIC_FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=...
JWT_EXPIRES_IN=1h
ADMIN_JWT_SECRET=...
ADMIN_JWT_EXPIRES_IN=30m
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
EMAIL_USER=...
EMAIL_APP_PASSWORD=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

Never commit real secrets.

### Public frontend

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Only variables prefixed with `VITE_` are exposed to browser code. No secret belongs here.

### Admin frontend

```dotenv
VITE_ADMIN_API_BASE_URL=http://localhost:5000/admin-api
```

---

## 21. Local Development Commands

Run each command from its application directory.

### Backend

```powershell
cd backend
npm install
npm run dev
npm start
npm run seed:admin
npm run seed:message-test
```

### Public frontend

```powershell
cd frontend
npm install
npm run dev
npm run build
npm run preview
```

### Admin panel

```powershell
cd admin-panel
npm install
npm run dev
npm run build
npm run preview
```

### Health check

```text
http://localhost:5000/health
```

Expected result:

```json
{"status":"ok"}
```

Important troubleshooting point: the backend must be started from `backend/`, not the repository root, because the root does not contain a `package.json`.

---

## 22. Testing and Verification Strategy

### Fast backend validation

```powershell
cd backend
node --check src/controllers/job.controller.js
node --check src/models/Job.js
```

### Frontend validation

```powershell
cd frontend
npm run build
```

```powershell
cd admin-panel
npm run build
```

### Manual smoke test

1. Start MongoDB.
2. Start backend.
3. Confirm `/health`.
4. Start public frontend.
5. Test candidate registration/login.
6. Test recruiter login and job publishing.
7. Test custom application fields.
8. Test external application link mode.
9. Test candidate apply confirmation and new-tab redirect.
10. Test referral lookup, duplicate prevention, notification, and referred jobs.
11. Test messages and notification read state.
12. Start admin panel.
13. Test admin login, search, job moderation, payments, and settings.
14. Test desktop and mobile viewports.
15. Check browser console and backend logs.

### High-risk test cases

- Expired JWT.
- Invalid JWT.
- Candidate using recruiter route.
- Recruiter using candidate route.
- Suspended or banned account.
- Admin versus superadmin permissions.
- Invalid Razorpay signature.
- Duplicate payment verification.
- Missing email/SMS/storage credentials.
- Invalid external URL.
- Candidate self-referral.
- Duplicate referral.
- Referral for closed job.
- Unauthorized resume download.
- Unsupported file type or oversized upload.
- Socket reconnect and duplicate listeners.
- Multiple cron workers.

### Verification performed during recent work

- Backend files were checked with `node --check`.
- Frontend files were checked using VS Code diagnostics.
- Public frontend production builds were run successfully after major referral and external-application changes.
- The API listener was verified on port `5000` during troubleshooting.

The repository does not currently have one root-level automated test suite. Focused syntax checks, frontend builds, and manual workflow testing are the current verification approach.

---

## 23. Deployment Architecture

### Backend deployment

- Set `NODE_ENV=production`.
- Use strong, separate JWT secrets.
- Use a least-privilege MongoDB account.
- Configure exact production CORS origins.
- Configure Razorpay production keys.
- Configure SMTP, Twilio, and storage providers.
- Serve REST and Socket.IO over HTTPS.
- Proxy WebSocket upgrades correctly.
- Use a process manager with restart policies.
- Keep uploads on durable storage.
- Expose `/health` to the deployment platform.
- Coordinate cron workers.

### Frontend deployment

Build each app independently and deploy the generated `dist/` directory to a static host. Configure history fallback to `index.html` for React Router routes.

### Admin deployment

The admin app should ideally use a protected subdomain, VPN, private network, or IP restriction. The admin frontend must point to `/admin-api`, not `/api`.

---

## 24. Known Limitations and Honest Interview Answers

### No single root start command

There is no root package script that starts all services. Backend, public frontend, and admin panel run independently. A future improvement would be a root workspace script using concurrently or a process manager.

### Limited centralized automated tests

The current repository relies mainly on focused builds, syntax checks, and manual workflows. A future improvement would be Jest/Supertest backend tests and Playwright end-to-end tests for candidate, recruiter, and admin flows.

### Provider fallback behavior

Some development environments allow local fallback when email, Twilio, Cloudflare R2, or other providers are not configured. Production should fail fast or use clearly monitored fallback behavior.

### Upload durability

Local filesystem upload fallback is convenient for development but not appropriate for ephemeral production infrastructure. Production should use durable object storage.

### Cron coordination

Multiple backend replicas need distributed locks or a separate worker architecture to avoid duplicate scheduled work.

### Large frontend bundles

The Vite build can report large chunks. Code splitting and route-level lazy loading would improve initial load performance.

### Future improvements

- Add automated unit, integration, and end-to-end tests.
- Add strict environment validation at startup.
- Add request validation with a schema library.
- Add API documentation/OpenAPI.
- Add structured logging and centralized monitoring.
- Add pagination consistently to all large collections.
- Add distributed locks for cron jobs.
- Add route-level frontend code splitting.
- Add audit coverage for every high-impact admin operation.
- Add accessibility testing and keyboard-focused modal tests.

---

## 25. Interview Explanation: End-to-End Example

### Example: Candidate applies for an internal job

A candidate logs in and opens a job. React Router renders the protected candidate workspace and the Job Detail page. The page loads job data and candidate-specific data through the public Axios instance. The Apply handler checks whether the job is open. If the job has custom application fields, the DynamicApplicationForm opens. Candidate profile information is shown from the profile API, and answers are validated in the component. The frontend sends the job ID and answers to the applications endpoint. The backend authenticates the candidate JWT, validates the job and candidate, creates the Application document, and can create notifications for the recruiter or candidate. The candidate sees the updated application state.

### Example: Candidate applies through a company link

The recruiter enters a valid external URL while posting the job. The frontend clears and disables custom questions. The backend validates the URL protocol and stores it in the job's application form configuration. On the candidate Job Detail page, clicking Apply opens a confirmation modal. Confirming opens the external URL in a new tab. No internal application document is created because the company owns the external application workflow.

### Example: Candidate refers another candidate

The referrer enters a unique candidate ID. The frontend requests a safe candidate preview from the referral endpoint. The backend searches the indexed unique ID without exposing sensitive fields. The referrer selects the name preview. On submit, the backend checks self-referral, candidate existence, job status, and duplicate referral state. It creates a Referral record and a Notification for the recipient. Socket.IO can push the notification immediately, while the database record supports later retrieval. Clicking the notification navigates the recipient to the referred-jobs page.

### Example: Admin changes a recruiter status

The admin signs in through the separate admin app. The admin Axios instance sends the admin token to `/admin-api`. Admin middleware verifies the admin JWT, session, account status, and role. The controller updates the recruiter status, records the appropriate audit information, and the recruiter is prevented from protected operations by account-status middleware.

---

## 26. Strong Interview Talking Points

Use these points when asked what you personally learned or contributed:

- I learned to separate UI authorization from backend authorization and keep the backend as the source of truth.
- I worked with a multi-application architecture where the public app and admin app have separate tokens and API namespaces.
- I used Mongoose references for domain relationships and nested documents for profile data.
- I implemented server-side normalization rather than trusting browser form validation.
- I handled rich text safely by sanitizing HTML before storing it.
- I integrated payment verification rather than accepting client-side success blindly.
- I used Socket.IO for low-latency notification and messaging updates while persisting notifications for reliability.
- I designed explicit empty, loading, error, unauthorized, and success states.
- I made custom application questions flexible through field definitions instead of hardcoding every question.
- I added external apply mode to prevent duplicate application workflows.
- I added candidate referral persistence with a compound unique index to prevent duplicates.
- I used request IDs to connect frontend failures with backend logs.
- I considered production concerns such as durable file storage, CORS, secrets, WebSocket proxying, cron coordination, and route fallback.

---

## 27. Common Interview Questions and Sample Answers

### Why MongoDB?

MongoDB was suitable because the platform contains flexible profile sections, varying application questions, nested experience and education records, and evolving notification metadata. Mongoose provides schema validation and relationships while retaining document flexibility.

### Why JWT?

JWT provides stateless authentication suitable for the REST API. The backend verifies the signature and role on every protected request. Public and admin tokens use separate secrets and storage keys to create a security boundary.

### Why use Socket.IO if notifications are stored in MongoDB?

Socket.IO provides immediate delivery when a user is online. MongoDB persistence makes the notification reliable when the user is offline or reconnects later. The two mechanisms complement each other.

### How do you secure payment operations?

The server creates the order, the browser completes checkout, and the server verifies the provider signature with the secret key. Only after verification does the server apply the business effect. Browser callbacks are never treated as final proof.

### How do you secure file downloads?

The backend authenticates the requester, verifies recruiter ownership/permissions, checks wallet or payment conditions where required, and only then returns or streams the file. A public URL alone is not treated as authorization.

### How do you handle role-based access?

Frontend protected routes improve the user experience, but every sensitive backend route uses token verification and role middleware. Admin routes additionally use admin-specific middleware and sometimes superadmin checks.

### How did you prevent duplicate referrals?

The controller checks for an existing referral and the MongoDB model has a compound unique index on referrer, referred candidate, and job. The controller also handles a duplicate-key error, so concurrent requests are covered at the database level.

### How do you handle external job applications?

The recruiter can provide a validated HTTP/HTTPS external link. The system disables internal questions for that job. Candidates see a normal Apply button, receive a confirmation, and are redirected to the company link in a new tab.

### What would you improve next?

I would add a formal automated test suite, strict startup environment validation, OpenAPI documentation, route-level code splitting, distributed cron locking, structured observability, and durable object storage by default in production.

---

## 28. Short Resume-Style Project Description

**Job Portal - Full-Stack MERN Recruitment Platform**

Built a multi-role recruitment platform using React, Vite, Tailwind CSS, Node.js, Express, MongoDB, Mongoose, JWT, Socket.IO, Razorpay, Nodemailer, Twilio, Cloudinary, and Cloudflare R2. Implemented candidate, recruiter, and admin workflows including authentication, profile/resume management, job posting and search, custom application forms, external company applications, referrals, real-time notifications and messaging, recruiter wallets, payments, resume access, moderation, reports, admin analytics, and scheduled background jobs. Maintained separate public/admin API boundaries, role-based authorization, server-side validation, sanitized rich text, secure payment verification, and responsive UI states.

---

## 29. Final Interview Summary

When explaining the project, start with the product problem, then describe the three application boundaries. Explain the request flow from React to Axios to Express middleware to controller to Mongoose and MongoDB. Mention the security boundary between public and admin users. Give one detailed workflow, such as internal application, external application, or candidate referral. Then discuss one difficult engineering decision, such as server-side payment verification, rich-text sanitization, duplicate referral prevention, or Socket.IO plus persistent notifications. Finish with testing performed and the improvements you would make next.

The strongest concise summary is:

> This project is a production-oriented MERN recruitment platform with separate candidate, recruiter, and admin experiences. I worked across React/Vite frontends, an Express/Mongoose backend, JWT and role-based authorization, payment and upload integrations, real-time Socket.IO communication, background jobs, and responsive workflows such as job applications, external company applications, referrals, notifications, recruiter management, and admin moderation.
