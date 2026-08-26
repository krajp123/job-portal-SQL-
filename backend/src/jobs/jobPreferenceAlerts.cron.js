const cron = require('node-cron');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const { createNotification } = require('../services/notification.service');

function scheduleJobPreferenceAlerts() {
  cron.schedule('0 9 * * *', async () => {
    try {
      const candidates = await Candidate.find({
        accountStatus: 'active',
        'profile.alertFrequency': { $in: ['daily', 'weekly'] },
      }).select('_id profile');
      const jobs = await Job.find({ status: 'open', createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }).select('title role location skillsRequired createdAt').lean();
      for (const candidate of candidates) {
        const profile = candidate.profile || {};
        const cutoff = profile.alertFrequency === 'daily' ? Date.now() - 24 * 60 * 60 * 1000 : Date.now() - 7 * 24 * 60 * 60 * 1000;
        const roles = (profile.preferredRoles || []).map((value) => String(value).toLowerCase());
        const locations = (profile.preferredLocations || []).map((value) => String(value).toLowerCase());
        const skills = (profile.preferredSkills || []).map((value) => String(value).toLowerCase());
        const matches = jobs.filter((job) => new Date(job.createdAt).getTime() >= cutoff && (
          roles.some((role) => `${job.title} ${job.role || ''}`.toLowerCase().includes(role)) ||
          locations.some((location) => String(job.location || '').toLowerCase().includes(location)) ||
          skills.some((skill) => (job.skillsRequired || []).some((jobSkill) => String(jobSkill).toLowerCase().includes(skill)))
        ));
        if (!matches.length) continue;
        const job = matches[0];
        const exists = await Notification.exists({ candidate: candidate._id, type: 'job_alert', relatedId: job._id });
        if (!exists) await createNotification({ candidate: candidate._id, type: 'job_alert', title: 'Jobs matching your preferences', message: `${matches.length} new job${matches.length === 1 ? '' : 's'} match your preferences.`, relatedId: job._id });
      }
    } catch (error) {
      console.error('Scheduled job preference alerts failed:', error.message);
    }
  });
}

module.exports = scheduleJobPreferenceAlerts;