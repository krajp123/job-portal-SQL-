# Admin Account Unlock Implementation Guide

## Overview
Admin accounts can become locked after 5 failed login attempts. Currently, there is no unlock mechanism, which could leave admins locked out permanently.

## Issue
- **File**: `backend/src/controllers/auth/adminAuth.controller.js`
- **Problem**: Admin lockout after 5 failed attempts, but no way for locked admin to unlock
- **Duration**: 15 minutes (hardcoded)

## Solution: Add Admin Unlock Endpoint

### Step 1: Add Unlock Controller Method
**File**: `backend/src/controllers/auth/adminAuth.controller.js`

Add this function:
```javascript
// POST /admin-api/auth/admin/unlock
// body: { adminId } - only superadmin or the admin themselves can unlock
exports.unlockAdmin = async (req, res) => {
  try {
    const requesterRole = req.user?.role;
    const { adminId } = req.body;

    // Only superadmin or self can unlock
    if (requesterRole !== 'superadmin' && req.user?.id !== adminId) {
      return res.status(403).json({ error: 'Only superadmin can unlock other admins' });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Clear lockout
    admin.failedLoginAttempts = 0;
    admin.lockUntil = undefined;
    await admin.save();

    // Log the unlock action
    await logAdminAction({
      adminId: req.user?.id,
      action: 'ADMIN_UNLOCK',
      targetType: 'Admin',
      targetId: adminId,
      details: `Admin ${admin.email} unlocked by ${req.user?.role}`,
      ip: req.ip,
    });

    res.json({ message: 'Admin account unlocked successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### Step 2: Add Route
**File**: `backend/src/routes/admin.routes.js`

Add this route in the auth section (protected by admin middleware):
```javascript
// Admin account management (superadmin only)
router.post('/auth/admin/unlock', requireAdmin, adminAuthController.unlockAdmin);
```

### Step 3: Update Frontend Admin Panel (Optional)
**File**: `admin-panel/src/pages/AdminManagement.jsx`

Add UI button to unlock locked admins in the admin list view.

---

## Alternative Solution: Automatic Unlock Email

Instead of manual unlock, send a secure unlock link via email:

```javascript
exports.sendUnlockEmail = async (adminEmail) => {
  const unlockToken = crypto.randomBytes(32).toString('hex');
  const admin = await Admin.findOne({ email: adminEmail });
  
  admin.unlockToken = unlockToken;
  admin.unlockTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await admin.save();

  const unlockLink = `https://admin.roledeck.com/unlock?token=${unlockToken}&email=${adminEmail}`;
  
  // Send email with link
  await sendEmail(adminEmail, 'Account Unlock Request', `
    Your admin account is temporarily locked due to failed login attempts.
    Click here to unlock: ${unlockLink}
  `);
};
```

---

## Recommendations

1. **Quick Fix** (Recommended):
   - Use Option 1: Manual unlock endpoint
   - Accessible to superadmin only
   - Add to admin panel UI

2. **Better Security**:
   - Add 2FA/backup codes
   - Allow unlock via email link (Option 2)
   - Log all unlock actions

3. **Future Enhancement**:
   - SMS unlock confirmation
   - WebAuthn/FIDO2 for admin access
   - Audit trail with timestamp + IP

---

## Testing

```javascript
// 1. Make 5 failed login attempts
for (let i = 0; i < 5; i++) {
  await POST /admin-api/auth/login
    { email: 'admin@example.com', password: 'wrong-password' }
}

// 2. Verify account is locked
const admin = await Admin.findOne({ email: 'admin@example.com' });
console.log(admin.lockUntil > Date.now()); // true

// 3. Try correct password (should fail)
await POST /admin-api/auth/login
  { email: 'admin@example.com', password: 'correct-password' }
// Should return 423: Account temporarily locked

// 4. Unlock via endpoint
await POST /admin-api/auth/admin/unlock
  { adminId: admin._id }

// 5. Now login should work
await POST /admin-api/auth/login
  { email: 'admin@example.com', password: 'correct-password' }
```

---

## Priority: MEDIUM-HIGH
**Estimated Time to Implement**: 30 minutes
**Complexity**: Low
**Impact**: Prevents admin account lockout scenario
