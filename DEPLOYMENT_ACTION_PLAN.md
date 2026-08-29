# Critical Deployment Action Plan - Priority 1

## 🎯 DO THIS TODAY (Next 2 Hours)

### 1. Remove All Console Logs from Production Code
**Files to fix (71 total console.log statements found)**:

```
Backend:
- backend/src/services/email.service.js (7 logs)
- backend/src/controllers/recruiter.controller.js (7 logs)
- backend/src/controllers/application.controller.js (3 logs)
- backend/src/controllers/candidate.controller.js (2 logs)
- backend/src/jobs/accountSuspension.cron.js (2 logs)
- backend/src/jobs/renewalReminder.cron.js (2 logs)
- backend/src/jobs/walletCleanup.cron.js (2 logs)
- backend/src/routes/application.routes.js (1 log)
- backend/src/controllers/admin/adminUsers.controller.js (1 log)
- backend/src/config/db.js (3 logs)

Frontend:
- admin-panel/src/pages/RecruiterProfile.jsx (2 logs)
- admin-panel/src/api/adminAxiosInstance.js (1 warning)
- admin-panel/src/pages/AdminLayout.jsx (1 error)
- admin-panel/src/pages/AdminLogin.jsx (1 error)
- frontend/src/pages/recruiter/Settings.jsx (3 logs)
- frontend/src/pages/RecruiterProfile.jsx (1 log)
```

**Command to find remaining logs** (for verification):
```bash
# Find all console logs
grep -r "console\.\(log\|error\|warn\)" backend/src --include="*.js" | grep -v node_modules
grep -r "console\.\(log\|error\|warn\)" frontend/src --include="*.jsx" | grep -v node_modules
grep -r "console\.\(log\|error\|warn\)" admin-panel/src --include="*.jsx" | grep -v node_modules
```

---

### 2. Delete Test/Development Files
```
backend/atlas-direct-test.js      ❌ DELETE
backend/atlas-test.js             ❌ DELETE
backend/migrateRecruiters.js      ❌ DELETE
frontend/temp_parse_applicants.py ❌ DELETE
LANGUAGES_TEST.md                 ❌ DELETE
RECRUITER_PROFILE_SETUP.md        ❌ DELETE (or move to docs/)
```

**Command**:
```bash
cd backend
rm atlas-direct-test.js atlas-test.js migrateRecruiters.js

cd ../frontend
rm temp_parse_applicants.py

cd ..
rm LANGUAGES_TEST.md
# Keep RECRUITER_PROFILE_SETUP.md but move to docs or mark as internal
```

---

### 3. Create .env.production.example
Create file: `backend/.env.production.example`

```env
# CRITICAL - Application
PORT=5000
NODE_ENV=production

# CRITICAL - Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/job-portal

# CRITICAL - Authentication
JWT_SECRET=your-very-long-random-secret-key-min-32-chars
JWT_EXPIRES_IN=1h
ADMIN_JWT_SECRET=your-very-long-random-admin-secret-min-32-chars
ADMIN_JWT_EXPIRES_IN=2h

# CRITICAL - Email Configuration
EMAIL_USER=noreply@roledeck.com
EMAIL_APP_PASSWORD=your-gmail-app-password

# CRITICAL - Payment Processing (Razorpay)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx

# File Storage (choose ONE)
# Option A: Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID=xxxxxxxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxxxxxxx
CLOUDFLARE_R2_BUCKET_NAME=job-portal-prod
CLOUDFLARE_R2_PUBLIC_URL=https://cdn.roledeck.com

# Option B: Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx

# OPTIONAL but recommended - SMS Verification
TWILIO_ACCOUNT_SID=xxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Frontend URLs
PUBLIC_FRONTEND_URL=https://roledeck.com
ADMIN_FRONTEND_URL=https://admin.roledeck.com

# OPTIONAL - Performance & Monitoring
REDIS_URL=redis://user:pass@localhost:6379
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
LOG_LEVEL=error
```

---

### 4. Add Startup Environment Validation
Create/update: `backend/src/config/startup.js`

```javascript
function validateEnvironment() {
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
    'NODE_ENV',
    'PORT',
  ];

  const isProduction = process.env.NODE_ENV === 'production';
  
  // Email is REQUIRED in production
  if (isProduction) {
    required.push('EMAIL_USER', 'EMAIL_APP_PASSWORD');
    required.push('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET');
  }

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }

  // Warn about optional but important vars
  const recommended = [
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'TWILIO_ACCOUNT_SID',
  ];
  
  const missingOptional = recommended.filter(key => !process.env[key]);
  if (missingOptional.length > 0 && isProduction) {
    console.warn('⚠️  Missing recommended environment variables:');
    missingOptional.forEach(key => console.warn(`   - ${key} (file storage or SMS won't work)`));
  }

  console.log('✅ All required environment variables configured');
}

module.exports = { validateEnvironment };
```

Then in `backend/server.js`, add at the top:
```javascript
const { validateEnvironment } = require('./src/config/startup');
validateEnvironment(); // Before anything else

require('dotenv').config();
// ... rest of server.js
```

---

### 5. Add Global Error Handler
Update: `backend/src/app.js`

Add at the **very end**, after all routes:

```javascript
// ---- Global error handling (must be last) ----
app.use((err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  
  // Don't expose error details in production
  const errorResponse = {
    error: isProduction ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  res.status(err.status || 500).json(errorResponse);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;
```

---

## 🎯 DO THIS WEEK (Next 3 Days)

### 6. Fix Critical Security Issues

#### Fix A: Path Traversal in Resume Download
File: `backend/src/controllers/recruiter.controller.js` (around line 805)

Replace:
```javascript
const relativePath = resumeUrl.split('/uploads/')[1] || '';
const localPath = path.join(__dirname, '..', '..', 'uploads', relativePath);
return res.download(localPath, fileName, (err) => {
```

With:
```javascript
const relativePath = resumeUrl.split('/uploads/')[1] || '';

// Security: Validate path to prevent traversal attacks
if (!relativePath || relativePath.includes('..') || relativePath.includes('/')) {
  return res.status(400).json({ error: 'Invalid path' });
}

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const localPath = path.join(uploadsDir, relativePath);
const normalizedPath = path.normalize(localPath);

// Ensure path is within uploads directory
if (!normalizedPath.startsWith(uploadsDir)) {
  return res.status(403).json({ error: 'Access denied' });
}

return res.download(normalizedPath, fileName, (err) => {
```

Do the same for `candidate.controller.js` and `admin/adminUsers.controller.js`.

---

#### Fix B: Enforce Email Configuration in Production
File: `backend/src/services/email.service.js`

Replace:
```javascript
let transporter = null;
if (EMAIL_USER && EMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({...})
  console.log('✅ Email service initialized...')
} else {
  console.warn('⚠️ Email is not configured...')
}
```

With:
```javascript
let transporter = null;

if (process.env.NODE_ENV === 'production' && (!EMAIL_USER || !EMAIL_APP_PASSWORD)) {
  throw new Error('Email configuration is required in production (EMAIL_USER and EMAIL_APP_PASSWORD)');
}

if (EMAIL_USER && EMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_APP_PASSWORD,
    },
  });
} else if (process.env.NODE_ENV !== 'production') {
  console.log('💡 Email is not configured. OTP emails will be logged instead.');
}
```

---

#### Fix C: Require Payment Signature Verification in Production
File: `backend/src/controllers/payment.controller.js` (around line 67)

Replace:
```javascript
const devMode = !razorpayInstance && process.env.NODE_ENV !== 'production';

if (!devMode) {
  // verify signature
}
```

With:
```javascript
// In production, NEVER skip signature verification
if (process.env.NODE_ENV === 'production' && !razorpayInstance) {
  return res.status(500).json({ error: 'Payment processor not configured' });
}

const isDevMode = !razorpayInstance && process.env.NODE_ENV !== 'production';

if (!isDevMode) {
  // verify signature
}
```

---

### 7. Implement Session Timeout on Frontend
File: `frontend/src/context/AuthContext.jsx`

Add this function to check token expiration:

```javascript
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const expiration = payload.exp * 1000; // Convert to ms
    
    return Date.now() >= expiration;
  } catch {
    return true;
  }
}

// In your useEffect that checks login:
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token && isTokenExpired(token)) {
    logout(); // Auto-logout if expired
  }
}, []);
```

---

### 8. Test Complete Flows

**Candidate Registration Flow**:
- [ ] Sign up with email
- [ ] Verify email OTP
- [ ] Complete profile
- [ ] Upload resume
- [ ] Make payment (test mode)
- [ ] Search jobs
- [ ] Apply to job
- [ ] Check application status

**Recruiter Registration Flow**:
- [ ] Sign up
- [ ] Verify company documents
- [ ] Make payment
- [ ] Post a job
- [ ] Review applications
- [ ] Download resume
- [ ] Send message to candidate

**Admin Flow**:
- [ ] Admin login
- [ ] 2FA verification
- [ ] View candidates/recruiters
- [ ] Suspend account
- [ ] Reactivate account
- [ ] Update settings
- [ ] View reports

**Payment Flow**:
- [ ] Initiate payment
- [ ] Complete Razorpay flow
- [ ] Verify signature
- [ ] Update account status

---

## 📋 VERIFICATION CHECKLIST

Before going live, run these tests:

```bash
# 1. Check no console logs in production code
grep -r "console\.\(log\|error\|warn\)" backend/src --include="*.js" 2>/dev/null | wc -l
# Should output: 0

# 2. Check environment validation
npm start
# Should show: "✅ All required environment variables configured"
# Or: "❌ Missing required environment variables" (and fail if in production)

# 3. Check error handler is registered
curl -X GET http://localhost:5000/nonexistent
# Should get proper error JSON, not stack trace

# 4. Test email service
# Check backend logs when signup is attempted
# Should NOT say "Email is not configured"

# 5. Test payment verification
# Attempt invalid payment signature
# Should reject with 400 error

# 6. Test session expiration
# Log in, wait for JWT expiration
# Should auto-logout
```

---

## 🚀 DEPLOYMENT COMMAND CHECKLIST

```bash
# 1. Export environment variables (or use .env file)
export NODE_ENV=production
export MONGO_URI="mongodb+srv://..."
export JWT_SECRET="your-secret..."
# ... all other variables

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../admin-panel && npm install

# 3. Build frontends
cd frontend && npm run build
cd ../admin-panel && npm run build

# 4. Run database migrations if any
cd backend
# (none currently, but check seedAdmin.js if needed)

# 5. Start server
npm start

# 6. Verify health
curl http://localhost:5000/health
# Should return: { "status": "ok" }

# 7. Test admin login
curl -X POST http://localhost:5000/admin-api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

---

## 📞 SUPPORT CONTACT POINTS

Create these before launch:

```env
# Add to .env
SUPPORT_EMAIL=support@roledeck.com
SUPPORT_PHONE=+1-XXX-XXX-XXXX
SECURITY_EMAIL=security@roledeck.com
```

And add links in footer/help pages.

---

## ✅ SIGN-OFF

Once complete, ensure:
- [ ] All console.logs removed
- [ ] All test files deleted
- [ ] Environment variables documented and validated
- [ ] Global error handler in place
- [ ] Security fixes applied
- [ ] Complete flow testing done
- [ ] Performance testing done (load test)
- [ ] Backup and rollback plan in place
- [ ] Monitoring/logging configured
- [ ] Security audit completed

**Ready for Production ✅**
