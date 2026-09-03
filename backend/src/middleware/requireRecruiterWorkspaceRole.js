const Recruiter = require('../models/Recruiter');

// Owners keep full access. Accepted team members inherit the workspace role
// stored on the owner's teamMembers array; viewers are read-only.
function requireRecruiterWorkspaceRole(permission = 'read') {
  return async (req, res, next) => {
    try {
      const recruiter = await Recruiter.findById(req.user.id)
        .select('email registrationStatus teamMembers')
        .lean();
      if (!recruiter || recruiter.registrationStatus !== 'complete') {
        return res.status(403).json({ error: 'Complete recruiter registration before accessing the workspace.' });
      }

      const membershipOwner = await Recruiter.findOne({
        'teamMembers.email': recruiter.email.toLowerCase(),
        'teamMembers.status': 'active',
        registrationStatus: 'complete',
      }).select('_id teamMembers').lean();
      const membership = membershipOwner?.teamMembers?.find(
        (member) => member.email.toLowerCase() === recruiter.email.toLowerCase() && member.status === 'active'
      );
      const access = membership
        ? { ownerId: membershipOwner._id, role: membership.role, isOwner: false }
        : { ownerId: recruiter._id, role: 'admin', isOwner: true };

      if (permission === 'manageTeam' && !access.isOwner) {
        return res.status(403).json({ error: 'Only the workspace owner can manage team members.' });
      }
      if (permission === 'write' && access.role === 'viewer') {
        return res.status(403).json({ error: 'Viewer access is read-only.' });
      }

      req.recruiterAccess = access;
      req.workspaceOwnerId = access.ownerId;
      next();
    } catch (err) {
      console.error('Recruiter workspace authorization failed:', err);
      res.status(500).json({ error: 'Unable to verify workspace access.' });
    }
  };
}

module.exports = requireRecruiterWorkspaceRole;
