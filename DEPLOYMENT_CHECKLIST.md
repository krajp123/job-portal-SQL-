# Pre-Deployment Checklist & Issues Found

## 🔴 CRITICAL ISSUES (Fix Immediately)

### 1. **Console.log Statements in Production Code**
**Severity**: HIGH - Exposes sensitive information, hurts performance
**Location**: Multiple files
- ✗ `backend/src/services/email.service.js` - Lines: 14, 129, 216, 299, 419, 499, etc.
- ✗ `backend/src/controllers/recruiter.controller.js` - Lines: 130, 472, 611, 637, 723
- ✗ `backend/src/controllers/application.controller.js` - Lines: 381, 409
- ✗ `backend/src/controllers/candidate.controller.js` - Line: 163
- ✗ `backend/src/controllers/admin/adminUsers.controller.js` - Line: 731
- ✗ `backend/src/jobs/accountSuspension.cron.js`, `renewalReminder.cron.js`, `walletCleanup.cron.js`
- ✗ `backend/src/routes/application.routes.js` - Line: 5
- ✗ `admin-panel/src/pages/RecruiterProfile.jsx` - Lines: 844, 930
- ✗ `admin-panel/src/pages/AdminLogin.jsx` - Contains console.error for debugging
- ✗ `frontend/src/pages/recruiter/Settings.jsx` - Lines: 425, 445, 522
- ✗ `frontend/src/pages/RecruiterProfile.jsx` - Line: 308

**Action**: Remove all console.log/console.error statements before production, except critical error logging for monitoring.

---

### 2. **Missing/Test Files That Should Be Removed**
**Severity**: HIGH - Security & cleanup
- ✗ `backend/atlas-direct-test.js` - Test database connection file
- ✗ `backend/atlas-test.js` - Test database connection file
- ✗ `backend/migrateRecruiters.js` - One-time migration script
- ✗ `frontend/temp_parse_applicants.py` - Temporary Python script
- ✗ `LANGUAGES_TEST.md` - Test documentation with console.log examples
- ✗ `RECRUITER_PROFILE_SETUP.md` - Development/setup documentation

**Action**: Remove all test files before deploying to production.

---

### 3. **Email Service Configuration Not Enforced**
**Severity**: HIGH - Features won't work without proper setup
**File**: `backend/src/services/email.service.js` (Lines 1-19)

**Issue**: 
```javascript
if (EMAIL_USER && EMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport(...)
} else {
  console.warn('⚠️ Email is not configured...')
  // Email service just logs instead of sending!
}
```

**Impact**: 
- OTP emails won't send
- Password reset won't work
- Account verification emails won't send
- Registration emails won't send

**Action**: 
- Make email configuration REQUIRED in production (not just optional)
- Either:
  - Add startup validation: `if (NODE_ENV === 'production' && !EMAIL_USER) throw error`
  - Or ensure admin can be notified that email is down

---

### 4. **Missing Environment Variables Documentation**
**Severity**: HIGH - Deployment will fail silently
**Files**: Backend requires these but they're not validated:

```env
# Critical - absolutely required in production
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
NODE_ENV=production
PORT=

# Email configuration (currently warns but continues)
EMAIL_USER=
EMAIL_APP_PASSWORD=

# Payment processing (resume download, registration fees)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# File storage (at least one must be configured)
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_PUBLIC_URL=
# OR
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SMS/Twilio (for OTP if using phone verification)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Frontend environment variables
VITE_API_BASE_URL=
VITE_ADMIN_API_BASE_URL=

# Admin frontend
VITE_ADMIN_API_BASE_URL=
```

**Action**: 
- Create `.env.production.example` with all required variables
- Add startup validation for critical variables
- Document which are optional vs required

---

### 5. **Admin Password Reset Not Fully Implemented**
**Severity**: MEDIUM-HIGH - Admin account lockout scenario
**File**: `backend/src/controllers/admin/adminUsers.controller.js` (Line 731)

**Issue**:
```javascript
console.log(`Reset link for ${recruiter.email}: http://yourapp.com/reset-password/${resetToken}`);
```

- No actual password reset flow for admin accounts
- System logs reset link to console instead of sending email
- Admin can be locked out without recovery

**Action**: 
- Implement proper password reset email for admins
- Remove hardcoded console.log
- Test admin account recovery flow

---

## 🟠 HIGH PRIORITY ISSUES (Fix Before Launch)

### 6. **Resume Download Security - Path Traversal Risk**
**Severity**: MEDIUM-HIGH - Potential security vulnerability
**Files**: 
- `backend/src/controllers/recruiter.controller.js` (Lines 805-825)
- `backend/src/controllers/candidate.controller.js` (Lines 917-937)
- `backend/src/controllers/admin/adminUsers.controller.js` (Lines 1042-1062)

**Issue**: Path is constructed from URL without proper validation:
```javascript
const relativePath = resumeUrl.split('/uploads/')[1] || '';
const localPath = path.join(__dirname, '...', 'uploads', relativePath);
return res.download(localPath, fileName, (err) => {
  // Missing path normalization - could allow ../../ attacks
});
```

**Action**:
```javascript
// Normalize and validate path
const relativePath = resumeUrl.split('/uploads/')[1] || '';
if (relativePath.includes('..')) {
  return res.status(400).json({ error: 'Invalid path' });
}
const normalizedPath = path.normalize(relativePath);
if (!normalizedPath.startsWith(expectedDir)) {
  return res.status(403).json({ error: 'Access denied' });
}
```

---

### 7. **Insufficient Validation on Payment Signature**
**Severity**: MEDIUM-HIGH - Payment fraud risk
**File**: `backend/src/controllers/payment.controller.js` (Lines 65-85)

**Issue**:
```javascript
const devMode = !razorpayInstance && process.env.NODE_ENV !== 'production';

if (!devMode) {
  // Only verify signature if NOT in dev mode
  // But what if Razorpay is misconfigured in production?
}
```

**Problem**: If `razorpayInstance` is undefined in production, it silently accepts invalid payments.

**Action**: 
```javascript
// In production, ALWAYS require signature verification
if (process.env.NODE_ENV === 'production' && !razorpayInstance) {
  throw new Error('Razorpay not configured - cannot process payments');
}
```

---

### 8. **Socket.IO Authentication - Token Not Refreshed**
**Severity**: MEDIUM - Long-lived connections may use expired tokens
**File**: `backend/src/config/socket.js` (Lines 20-28)

**Issue**: 
- Socket.IO verifies token once on connection
- If user's token expires, socket keeps working with old token
- User could access data after account suspension

**Action**: 
- Add periodic token refresh check in Socket.IO
- Or disconnect clients when token expires
- Implement reconnection with new token

---

### 9. **Admin Panel Token Storage - localStorage Not Secure**
**Severity**: MEDIUM - XSS vulnerability exposure
**Files**:
- `admin-panel/src/api/adminAxiosInstance.js`
- `admin-panel/src/context/AdminAuthContext.jsx`

**Issue**: 
```javascript
const token = localStorage.getItem('admin_token'); // Vulnerable to XSS
```

**Action** (if XSS is present):
- Consider httpOnly cookies for admin panel
- Or ensure strict CSP headers
- Sanitize all user inputs (already done in some places, needs audit)

---

### 10. **Missing Global Error Handler**
**Severity**: MEDIUM - Unhandled errors crash API
**File**: `backend/src/app.js`

**Issue**: No global error handling middleware at end of file

**Action**: Add error handler at end of `app.js`:
```javascript
// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});
```

---

## 🟡 MEDIUM PRIORITY ISSUES (Should Fix)

### 11. **Missing CORS Hostname Validation**
**Severity**: MEDIUM
**File**: `backend/src/app.js` (Lines 39-60)

**Issue**: 
```javascript
// Allows any localhost variant but might not handle proxies
const isDevLoopback = process.env.NODE_ENV !== 'production' && isLocalLoopbackOrigin(origin);
```

**Action**: 
- In production, strictly define allowed origins
- Don't rely on hostname checks, use exact URL matching
- Add verification for production URLs

---

### 12. **Race Condition in OTP Verification**
**Severity**: MEDIUM
**Files**: 
- `backend/src/services/verificationStore.service.js`
- Multiple verification controllers

**Issue**: OTP store uses Map (in-memory) - will be lost on restart

**Action**:
- Migrate OTP store to MongoDB with TTL index
- Or add fallback persistence
- Document in-memory nature if intentional for dev

---

### 13. **Admin Account Lockout Without Recovery**
**Severity**: MEDIUM
**File**: `backend/src/controllers/auth/adminAuth.controller.js` (Lines 25-42)

**Issue**: Admin locked for 15 minutes but can't self-recover
- No unlock endpoint
- Only system admin can fix

**Action**: 
- Implement admin unlock endpoint (protected endpoint)
- Add monitoring/alerts for locked admins
- Consider SMS backup codes

---

### 14. **Session Timeout Not Enforced on Frontend**
**Severity**: MEDIUM
**Files**: Frontend context files

**Issue**:
```javascript
// Token stored in localStorage with no expiration check on frontend
const token = localStorage.getItem('token');
// App keeps using it even after JWT_EXPIRES_IN expires
```

**Action**:
- Decode JWT and check expiration on app load
- Implement session timeout warning
- Auto-logout when token expires

---

### 15. **No Request ID Logging for Debugging**
**Severity**: MEDIUM - Hard to trace issues
**File**: `backend/src/app.js`

**Action**: Add request ID middleware:
```javascript
app.use((req, res, next) => {
  req.id = require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});
```

---

### 16. **HTML Email Templates Missing Fallback**
**Severity**: LOW-MEDIUM - Old email clients may not render
**File**: `backend/src/services/email.service.js`

**Issue**: Complex HTML emails without plain text fallback

**Action**: Add plain text version of all HTML emails

---

### 17. **File Upload Virus Scanning Missing**
**Severity**: MEDIUM - Security risk
**Files**: Upload handlers

**Issue**: No virus scanning on resume/image uploads

**Action**: 
- Either integrate ClamAV or equivalent
- Or use cloud service (Cloudinary/R2 scan options)

---

### 18. **Candidate Resume Download Tracking Incomplete**
**Severity**: LOW-MEDIUM - Metrics/auditing
**File**: `backend/src/controllers/recruiter.controller.js`

**Issue**: Resume download creates payment record but may not track who downloaded what

**Action**: Add audit log for resume downloads

---

## 🟢 LOW PRIORITY ISSUES (Nice to Have)

### 19. **Missing API Rate Limit on Signup**
**Severity**: LOW - Spam prevention
**File**: `backend/src/routes/candidate.routes.js`

**Action**: Add rate limiter to registration endpoints

---

### 20. **No Database Index Optimization Review**
**Severity**: LOW - Performance
**Action**: Review critical queries and add indexes for:
- Email lookups (candidates, recruiters, admins)
- Job search (indexed by location, industry, title)
- Application status queries

---

### 21. **Missing API Documentation**
**Severity**: LOW - Developer onboarding
**Action**: Generate API docs using Swagger/OpenAPI

---

### 22. **No Structured Logging**
**Severity**: LOW - Monitoring
**Action**: Consider Winston or similar logging library for:
- Structured logs
- Log levels
- External logging service integration

---

## ✅ DEPLOYMENT READINESS CHECKLIST

### Backend
- [ ] Remove all `console.log` statements
- [ ] Remove test files (atlas-*.js, migrateRecruiters.js)
- [ ] Validate all required environment variables on startup
- [ ] Implement global error handler
- [ ] Fix path traversal in resume downloads
- [ ] Verify Razorpay configuration validation
- [ ] Test Socket.IO with account suspension
- [ ] Implement admin password reset flow
- [ ] Add request ID logging
- [ ] Test payment verification with valid/invalid signatures
- [ ] Ensure all email templates have plain text fallback
- [ ] Database indexes are optimized
- [ ] Cron jobs are scheduled correctly
- [ ] Rate limiters are set for production thresholds

### Frontend
- [ ] Remove `console.log` statements
- [ ] Verify environment variables are set correctly
- [ ] Test localStorage cleanup on logout
- [ ] Implement session timeout warning
- [ ] Test token refresh/expiration flow
- [ ] Test all error pages (404, 500, etc.)
- [ ] Test mobile responsiveness
- [ ] Verify all links work
- [ ] Test keyboard navigation
- [ ] Optimize bundle size

### Admin Panel
- [ ] Remove `console.log` statements
- [ ] Test all admin functions (create, edit, suspend, ban users)
- [ ] Verify 2FA flow works end-to-end
- [ ] Test payment settings
- [ ] Test admin audit logs

### General
- [ ] Set `NODE_ENV=production` in deployment
- [ ] Enable HTTPS everywhere
- [ ] Set secure CORS headers
- [ ] Enable security headers (Helmet - already configured)
- [ ] Database backups configured
- [ ] Error monitoring/tracking configured (Sentry, etc.)
- [ ] Log aggregation configured
- [ ] Monitor disk space for upload folder
- [ ] Test complete signup → payment → job search flow
- [ ] Test admin features
- [ ] Load test with expected concurrent users
- [ ] Test disaster recovery/rollback
- [ ] Security audit of critical flows
- [ ] GDPR compliance review (data retention)

---

## 📋 ADDITIONAL RECOMMENDATIONS

### Security
1. Add rate limiting to password reset (prevent email spam)
2. Implement CAPTCHA on signup
3. Add 2FA to candidate/recruiter accounts (currently only admin)
4. Regular security audits
5. Implement CSP (Content Security Policy) headers
6. Add request signing for critical operations

### Monitoring
1. Set up error tracking (Sentry, Rollbar)
2. Monitor API response times
3. Track failed login attempts
4. Monitor payment success rate
5. Alert on OTP failures
6. Track email delivery rates

### Performance
1. Add database query caching (Redis)
2. Implement API response caching headers
3. Compress images on upload
4. Add CDN for static assets
5. Consider pagination on all list endpoints
6. Add database connection pooling

### Scalability
1. Move OTP store to Redis (for clustering)
2. Move session store to MongoDB (for load balancing)
3. Consider job queue for email sending
4. Implement API versioning
5. Plan for horizontal scaling

---

## 🔧 QUICK WINS (30 minutes each)

1. **Remove all console.log** - Search and replace
2. **Add environment validation** - Add startup check
3. **Remove test files** - Delete unnecessary files
4. **Add global error handler** - Copy/paste middleware
5. **Add request ID logging** - 5-line middleware
6. **Document environment variables** - Create .env.example

---

## 📝 NEXT STEPS

1. **Today**: Fix 🔴 CRITICAL issues
2. **This week**: Fix 🟠 HIGH PRIORITY issues  
3. **Before launch**: Complete ✅ DEPLOYMENT CHECKLIST
4. **Post-launch**: Monitor and implement 🟡 MEDIUM issues

---

Generated: 2026-08-29
Review Status: Comprehensive Full-Stack Analysis Complete
