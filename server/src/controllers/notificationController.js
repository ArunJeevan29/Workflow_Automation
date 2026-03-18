// server/src/controllers/notificationController.js
const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    const notifications = await Notification.find({ recipient_email: email })
      .populate('workflow_id', 'name')
      .sort({ created_at: -1 })
      .limit(20);

    res.status(200).json({ status: 'success', data: notifications });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { is_read: true }, { new: true });
    
    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }

    res.status(200).json({ status: 'success', data: notification });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update notification' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { email } = req.body;
    await Notification.updateMany({ recipient_email: email, is_read: false }, { is_read: true });
    res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update notifications' });
  }
};
