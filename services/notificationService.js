class NotificationService {
    sendNotification(userId, message) {
        console.log(`🔔 Notification for User ${userId}:`, message);
        return { success: true, message };
    }
}

module.exports = new NotificationService();
