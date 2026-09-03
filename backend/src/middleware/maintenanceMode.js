const { getPlatformSettings } = require('../services/platformSettings.service');

async function maintenanceMode(req, res, next) {
  try {
    const settings = await getPlatformSettings();
    if (settings.maintenanceMode) {
      return res.status(503).json({
        error: 'Platform is Under maintenance.',
        code: 'MAINTENANCE_MODE',
      });
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = maintenanceMode;
