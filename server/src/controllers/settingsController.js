// server/controllers/settingsController.js
const Settings = require('../models/Settings');

const getGlobalSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({}); // Creates default document
  }
  return settings;
};

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await getGlobalSettings();
    res.status(200).json({ status: 'success', data: settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await getGlobalSettings();
    
    // Update fields
    const { workspaceName, maxIterations, retryLimit, defaultRuleBehavior, notifyOnFail, notifyOnComplete } = req.body;
    
    if (workspaceName !== undefined) settings.workspaceName = workspaceName;
    if (maxIterations !== undefined) settings.maxIterations = maxIterations;
    if (retryLimit !== undefined) settings.retryLimit = retryLimit;
    if (defaultRuleBehavior !== undefined) settings.defaultRuleBehavior = defaultRuleBehavior;
    if (notifyOnFail !== undefined) settings.notifyOnFail = notifyOnFail;
    if (notifyOnComplete !== undefined) settings.notifyOnComplete = notifyOnComplete;

    await settings.save();

    res.status(200).json({ status: 'success', message: 'Settings updated successfully', data: settings });
  } catch (error) {
    next(error);
  }
};