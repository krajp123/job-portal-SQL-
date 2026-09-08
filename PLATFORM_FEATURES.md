# Career Route Portal - Complete Feature Catalogue

This document lists the platform features currently available across the public application and the separate admin panel.

## Platform At A Glance

- Full-stack recruitment platform for candidates, recruiters, companies, and administrators.
- Separate Candidate and Recruiter workspaces in the public application.
- Separate Admin Panel for platform operations and moderation.
- Job discovery, job publishing, applications, hiring workflow, communication, referrals, payments, wallets, support, and reporting in one platform.
- Responsive web experience for desktop, tablet, and mobile layouts.
- REST API backed by MongoDB.
- Real-time messaging and notification delivery through Socket.IO.

## Roles And Access

### Public Visitor

- View the home page and platform information.
- Read About, Privacy Policy, Terms and Services, Help Center, FAQ, and Contact pages.
- Search publicly available jobs.
- Open job details and public recruiter/company profiles.
- Submit support or help-center reports.
- Start candidate or recruiter registration.
- Recover a candidate ID.
- Start password recovery.

### Candidate

- Use the complete job-seeker workspace.
- Build and maintain a professional profile.
- Search, save, apply to, and track jobs.
- Receive job recommendations, referrals, alerts, and messages.

### Recruiter

- Use the complete hiring workspace.
- Create and manage company information.
- Publish and manage job postings.
- Review and process applicants.
- Contact candidates and access resumes.
- Manage company members, invitations, wallet, and recruiter settings.

### Admin

- Operate the platform from a dedicated admin application.
- Manage users, jobs, applications, payments, disputes, reports, badges, settings, and security.
- Superadmin-only controls are protected separately from regular admin controls.

## Candidate Features

### Candidate Registration And Account

- Payment-first candidate registration flow.
- Registration order creation through Razorpay.
- Server-side payment verification before account creation/completion.
- Experience certificate upload during registration where required.
- Candidate login.
- Candidate JWT session authentication.
- Account status checks at authentication and protected actions.
- Account suspension and ban enforcement.
- Automatic logout and restriction message when an account is suspended or banned.
- Candidate ID generation and candidate ID recovery.
- Forgot-password OTP flow.
- Password reset through OTP.
- Password reset through reset token.
- Email OTP verification before or during account setup.
- Phone OTP verification before or during account setup.
- Email change OTP verification.
- Phone change OTP verification.
- Change password from account settings.
- Delete candidate account.

### Candidate Profile

- View personal profile.
- Edit basic identity details.
- Edit contact information.
- Edit professional headline.
- Edit About Me / professional summary.
- Edit location.
-
- Add and update language Add and update skills.s.
- Add work experience entries.
- Edit individual experience details.
- Add education entries.
- Edit individual education details.
- Add certifications.
- Add projects.
- Add portfolio information.
- Add social profile links.
- Add professional website links.
- Upload profile picture.
- Replace profile picture.
- Delete profile picture.
- Upload resume.
- Replace resume.
- Download own resume.
- Delete resume.
- Store resume filename and profile resume metadata.
- View profile performance information where available.

### Candidate Preferences

- Set preferred job roles.
- Set preferred categories.
- Set preferred locations.
- Set work-mode preferences.
- Set employment-type preferences.
- Set minimum and maximum salary preferences.
- Set experience preferences.
- Set notice-period preference.
- Set job-alert frequency.
- Configure notification preferences.
- Configure security settings.
- Configure privacy settings.

### Job Discovery

- Browse the complete job listing.
- Search jobs by title.
- Search jobs by role.
- Search jobs by category.
- Search jobs by keyword.
- Filter jobs by skill.
- Filter jobs by location.
- Filter jobs by salary.
- Filter jobs by experience level.
- Filter jobs by employment type.
- Filter jobs by work mode.
- Filter jobs by date or recency.
- Search with public access where permitted.
- Receive search suggestions/autocomplete.
- Open complete job details.
- View job description and structured sections.
- View responsibilities and qualifications.
- View salary information or salary-not-disclosed state.
- View openings, location, work mode, and employment type.
- View company/recruiter information attached to a job.
- Open the recruiter/company profile from a job.
- Find similar jobs from a job detail view.
- Identify featured jobs.
- Save/bookmark a job.
- Remove a saved job.
- View all saved jobs.
- View recommended jobs.
- View jobs already applied to.
- View referred jobs.
- Report a job to platform moderation.

### Applications

- Apply to internal platform jobs.
- Submit an application directly when no questions are configured.
- Open an application form when recruiter questions exist.
- See candidate profile information while applying.
- Answer recruiter-defined application questions.
- Submit text answers.
- Submit textarea answers.
- Submit number answers.
- Submit radio-choice answers.
- Submit checkbox answers.
- Submit select-choice answers.
- Submit skill answers.
- Submit date answers.
- Submit URL answers.
- Submit file answers where configured.
- Respect required and optional question rules.
- Prevent duplicate application submissions where supported.
- Withdraw an application.
- View all personal applications.
- Track application status changes.
- View application timeline/progress route.
- See applied status.
- See viewed status.
- See shortlisted status.
- See interview-scheduled status.
- See offered status.
- See accepted status.
- See rejected status.
- See hired status.
- View application-related notifications.

### External Applications

- Apply to jobs that use a company-owned external application URL.
- See an external-application confirmation step.
- Cancel the external-application action.
- Open the company application page in a new browser tab.
- Use one application mode per job so internal questions and external links do not conflict.

### Candidate Referrals

- Start a referral from a job detail page.
- Enter another candidate's unique ID.
- Look up a candidate by unique ID.
- Preview the matched candidate identity safely.
- Select the previewed candidate while keeping the original ID for submission.
- Prevent self-referrals.
- Reject invalid candidate IDs.
- Prevent duplicate referrals for the same job and candidates.
- Create a job-specific referral.
- View referrals received by the candidate.
- View referrals made by the candidate.
- Open a referred job from the referral list.
- Receive a referral notification.
- Open the referred-jobs area from the notification.

### Candidate Companies And Recruiters

- Browse company listings.
- View top companies where available.
- Open a read-only company profile.
- View public recruiter profile information.
- View company image/logo and company details where provided.
- Contact a recruiter through the messaging workflow where permitted.

### Candidate Messaging And Notifications

- View recruiter conversations.
- Open an individual message thread.
- Reply to a conversation.
- See unread message state.
- Mark a conversation as read.
- Receive real-time message updates.
- Receive application status notifications.
- Receive referral notifications.
- Receive job preference alert notifications.
- Receive other platform activity notifications.
- View the notification center.
- Mark one notification as read.
- Mark all notifications as read.
- Clear read notifications.
- Navigate from a notification to the related job, application, referral, or message.

## Recruiter Features

### Recruiter Registration And Authentication

- Payment-first recruiter registration.
- Create a recruiter registration payment order.
- Verify registration payment server-side.
- Save recruiter registration as a draft.
- Resume an incomplete recruiter registration.
- Upload GST certificate.
- Upload CIN certificate.
- Upload business registration certificate.
- Complete recruiter/company registration after payment verification.
- Recruiter login.
- Recruiter password recovery through OTP.
- Recruiter account status enforcement.
- Recruiter verification status management.
- Recruiter workspace role checks.

### Recruiter And Company Profile

- View recruiter profile.
- Edit recruiter full name.
- Edit phone number.
- Edit designation.
- Edit company name.
- Edit company website.
- Edit company details/about information.
- Edit industry and company profile information.
- Upload company image/logo.
- Replace company image/logo.
- Upload recruiter profile picture.
- Delete recruiter profile picture.
- View a public recruiter profile.
- View company members.
- Configure recruiter settings by section.
- Change recruiter password.
- Manage recruiter security settings.

### Recruiter Dashboard

- View recruiter dashboard overview.
- View job and applicant summary information.
- View hiring activity and workspace shortcuts.
- Open messages from the dashboard.
- Open wallet from the dashboard.
- Open post-job flow from the dashboard.
- Open applicant management from the dashboard.
- Open company profile and recruiter settings.
- View referred candidates where available.

### Job Publishing

- Open a multi-step Post Job form.
- Validate each step before continuing.
- Create a new job.
- Save a job as a draft where supported.
- Publish a job.
- Edit a job.
- Update job content after publishing.
- Close a job.
- Delete a job.
- View all jobs owned by the recruiter/company.
- View job status and lifecycle information.
- Configure job title.
- Configure role.
- Configure job category.
- Configure company information.
- Configure employment type.
- Configure work mode.
- Configure job location.
- Add extra locations.
- Mark a job as remote.
- Mark a job as pan-India where applicable.
- Configure number of openings.
- Configure minimum experience.
- Configure maximum experience.
- Configure salary type.
- Configure minimum salary.
- Configure maximum salary.
- Mark salary as not disclosed.
- Add required skills.
- Add job summary.
- Add company description.
- Add roles and responsibilities.
- Add required qualifications.
- Add preferred qualifications.
- Add structured rich-text description sections.
- Use paragraphs, lists, bold, italic, underline, and line breaks in descriptions.
- Add custom application questions.
- Mark application questions as required or optional.
- Choose text, textarea, number, radio, checkbox, select, skills, date, URL, and file question types.
- Add options for choice-based questions.
- Add an external application URL.
- Validate external HTTP/HTTPS application links.
- Automatically disable internal custom questions when external application mode is selected.
- Request reopening of a closed job.
- View the result of a reopen request.

### Applicant Management

- View applicants across recruiter jobs.
- View applicants for a specific job.
- Search/filter applicant lists where available.
- Open a candidate profile from an application.
- View candidate resume availability.
- View submitted application answers.
- Track when an application was viewed.
- Add recruiter notes where supported.
- Update application status.
- Move candidates through the hiring pipeline.
- Schedule interviews where supported by the applicant workflow.
- Make offers where supported by the hiring workflow.
- Mark candidates as shortlisted.
- Mark candidates as rejected.
- Mark candidates as hired.
- Email/contact a candidate from application management.
- View referred candidates.
- Look up a candidate by unique ID where permitted.

### Offer Letters And Hired Badges

- Upload offer letters where enabled.
- Associate offer-letter activity with the hiring workflow.
- Submit hired-badge requests for review.
- View badge approval state.
- Receive admin decisions on badge requests.

### Resume Access

- Check whether a candidate resume is available.
- Download a candidate resume when access is authorized.
- Use wallet-controlled resume access.
- Pay for resume access where required.
- View previously downloaded resumes.
- Download a previously purchased resume.
- Remove a downloaded-resume record where allowed.
- Track resume download and payment activity.

### Recruiter Wallet And Payments

- View wallet balance summary.
- View wallet transactions.
- Open an individual wallet transaction.
- Start wallet recharge.
- Verify wallet recharge payment.
- Use Razorpay payment orders.
- View payment status and transaction history.
- Use wallet balance for eligible recruiter services.
- Receive low-balance or wallet-related notifications where configured.

### Company Teams And Invitations

- View company team members.
- Invite a team member by email.
- View pending invitations.
- Accept a company invitation.
- Decline a company invitation.
- Remove a team member.
- Change a team member's workspace role.
- Apply read, write, and team-management permissions.
- Keep team actions scoped to the recruiter's company workspace.

### Recruiter Messaging And Notifications

- Start a conversation with a candidate.
- View recruiter conversations.
- Open a candidate message thread.
- Reply to messages.
- Mark message threads as read.
- Configure candidate chat preference where permitted.
- Receive real-time messages.
- Receive applicant activity notifications.
- Receive application status or hiring notifications.
- Receive referral notifications relevant to recruiter jobs.
- View recruiter notifications.
- Mark one notification as read.
- Mark all notifications as read.
- Clear read notifications.

## Admin Panel Features

The Admin Panel is a separate application with its own login, routes, API base path, token storage, and authorization rules.

### Admin Authentication And Security

- Dedicated admin login page.
- Separate admin JWT authentication.
- Separate admin token storage.
- Email-based two-factor verification where configured.
- Admin session listing.
- Revoke an admin session.
- View current admin profile.
- Update admin profile.
- Change admin password.
- Enable or update admin two-factor settings.
- Upload admin profile picture.
- Remove admin profile picture.
- Unlock an admin account where permitted.
- Enforce admin status checks.
- Optional admin IP allowlist.
- Admin API rate limiting.
- Session timeout configuration.
- Superadmin-only access for high-impact operations.

### Admin Dashboard And Search

- View platform overview statistics.
- View recent platform activity.
- View dashboard reports.
- View admin notifications.
- Mark one admin notification as read.
- Mark all admin notifications as read.
- Clear admin notifications.
- Search candidates globally.
- Search recruiters globally.
- Search jobs globally.
- Run concurrent global search across user and job data.
- Open the appropriate detail page from search results.

### Candidate Administration

- List candidates.
- Search and paginate candidates.
- Open candidate details.
- Review candidate applications.
- View candidate analytics.
- View candidate activity history.
- View candidate notes.
- Add candidate notes.
- Download candidate resume.
- Verify or update candidate verification status.
- Send a candidate password-reset instruction.
- Change candidate account status.
- Suspend or reactivate candidate access where supported.
- Review candidate profile and account information.

### Recruiter Administration

- List recruiters.
- Search recruiters by name.
- Search recruiters by email.
- Search recruiters by company.
- Search recruiters by phone.
- Paginate recruiter results.
- Open recruiter details.
- Approve recruiter verification.
- Reject recruiter verification.
- Update recruiter status.
- Suspend recruiter account.
- Activate recruiter account.
- Ban recruiter account.
- Reset recruiter password.
- Review recruiter documents.
- Update individual document status.
- Add or update recruiter admin notes.
- View recruiter analytics.
- Adjust recruiter wallet balance.
- Create recruiter wallet payment orders.
- Verify recruiter wallet payments.

### Job And Application Administration

- List all jobs.
- Search and paginate jobs.
- Open job details.
- View job applicants.
- List platform applications.
- Change job status.
- Delete a job.
- Review job reports.
- Delete moderation reports where authorized.
- List job reopen requests.
- Approve a job reopen request.
- Reject a job reopen request.
- Review job lifecycle and moderation data.

### Payment And Finance Administration

- View payment overview.
- List platform payments.
- Open payment details.
- Monitor payment status.
- Start a refund.
- Update refund status.
- Review wallet payment activity.
- Configure payment settings.
- Configure Razorpay key settings.
- View payment plans.
- Create payment plans.
- Update payment plans.
- Delete payment plans.

### Badge And Hiring Administration

- View pending hired-badge approvals.
- Approve a hired badge.
- Reject a hired badge.
- Review offer-letter-linked badge requests.

### Disputes And Moderation

- List disputes.
- Open dispute details.
- Resolve disputes.
- List job moderation reports.
- Review job reports.
- Delete job reports where authorized.
- Review help-center/support reports.
- Delete support reports where authorized.
- Configure moderation settings.
- Apply platform-level job moderation controls.

### Platform Settings And Branding

- View platform settings.
- Update platform settings.
- Upload platform/admin logo.
- Configure public-facing branding values where supported.
- Configure payment settings.
- Configure payment plans.
- Configure moderation settings.
- Configure admin session timeout.
- Review security audit data.
- Export security audit data.

### Admin Management

Superadmins can:

- List administrators.
- Create administrator accounts.
- Update administrator accounts.
- Reset another administrator's password.
- Review administrator audit records.

## Communication And Notification Features

- Persistent user notifications stored in the platform.
- Real-time Socket.IO message delivery.
- Real-time notification updates where configured.
- Candidate-to-recruiter conversations.
- Thread-level read state.
- Notification read state.
- Mark-one and mark-all read actions.
- Clear-read notification actions.
- Application status notifications.
- Referral notifications.
- Job preference alerts.
- Recruiter applicant activity alerts.
- Admin activity notifications.
- Email delivery for account actions, password resets, notifications, and admin two-factor flows.
- SMS delivery for phone OTP flows when Twilio is configured.

## Payments And Paid Services

- Candidate registration payment.
- Recruiter registration payment.
- Recruiter wallet recharge.
- Paid resume download/access flow.
- Razorpay order creation.
- Server-side Razorpay signature/payment verification.
- Payment records with gateway identifiers and status.
- Wallet transaction records.
- Admin payment overview.
- Admin payment detail view.
- Admin refund workflow.
- Configurable payment plans.
- Configurable service pricing through platform settings.

## File And Media Features

- Candidate resume upload, download, replacement, and deletion.
- Candidate profile-picture upload and deletion.
- Recruiter profile-picture upload and deletion.
- Company image/logo upload.
- Admin profile-picture upload and deletion.
- Platform logo upload.
- Experience certificate upload.
- GST, CIN, and business registration document uploads.
- Offer-letter uploads where enabled.
- Application file-question uploads where configured.
- Cloudinary media storage support.
- Cloudflare R2/S3-compatible storage support.
- Local upload fallback for development or configured deployments.
- Protected resume download access.

## Security And Reliability Features

- JWT authentication for public users.
- Separate JWT authentication for administrators.
- Role-based access control.
- Recruiter workspace permission control.
- Candidate and recruiter account-status enforcement.
- Superadmin authorization checks.
- Password hashing with bcrypt.
- OTP-based verification.
- Rate limiting for sensitive APIs.
- Helmet security headers.
- Controlled CORS origins.
- Request IDs for tracing API requests.
- Sanitization of recruiter-authored rich job descriptions.
- Server-side validation and normalization of job/application data.
- Protected payment verification.
- Protected resume access.
- Admin audit logging.
- Optional admin IP restrictions.
- Maintenance-mode support.
- Centralized API error handling.
- Health-check endpoint for service monitoring.

## Automated And Background Features

- Job preference alert scheduler.
- Job renewal reminder scheduler.
- Account suspension processing scheduler.
- Wallet cleanup scheduler.
- Automatic notification generation for important platform events.
- Database-backed persistence for users, jobs, applications, payments, wallets, messages, notifications, disputes, reports, and audit records.

## Public Information And Support

- Home page.
- About page.
- Contact Support page.
- Help Center.
- FAQ route.
- Privacy Policy page.
- Terms and Services page.
- Support/help-center report submission.
- Universal footer navigation.
- Public recruiter profile page.
- Public company discovery pages.

## Feature Availability Notes

- Some features depend on the user's role and account permissions.
- Some paid features require Razorpay configuration and successful payment verification.
- Email features require SMTP/email configuration.
- SMS OTP features require Twilio configuration.
- Cloud media features depend on Cloudinary, Cloudflare R2, or the configured upload storage.
- Admin features are available only in the separate Admin Panel.
- Superadmin-only settings and administrator-management actions are not available to ordinary admins.
- External application links send candidates to the recruiter's website instead of creating an internal application.
- Job reopening may require admin approval after a job has been closed by administrative controls.
- The exact visibility of optional controls can depend on platform settings, account status, verification state, and workspace permissions.
