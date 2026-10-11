import { Types } from 'mongoose';
import { Notification } from '../../models/Notification';
import { AuthUser } from '../../middleware/auth.middleware';

export class NotificationService {
  public static async getNotifications(companyId: string, authUser: AuthUser) {
    const compObjectId = new Types.ObjectId(companyId);
    const userObjectId = new Types.ObjectId(authUser.userId);

    const query: Record<string, any> = {
      companyId: compObjectId,
      $or: [
        { recipientId: userObjectId },
        { recipientRole: authUser.role },
        { recipientRole: 'ALL' },
      ],
    };

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(30).lean(),
      Notification.countDocuments({ ...query, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  }

  public static async markAsRead(companyId: string, notificationId: string, authUser: AuthUser) {
    const notif = await Notification.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        companyId: new Types.ObjectId(companyId),
      },
      {
        $set: { isRead: true, readAt: new Date() },
      },
      { new: true }
    );
    return notif;
  }

  public static async markAllAsRead(companyId: string, authUser: AuthUser) {
    const compObjectId = new Types.ObjectId(companyId);
    const userObjectId = new Types.ObjectId(authUser.userId);

    await Notification.updateMany(
      {
        companyId: compObjectId,
        isRead: false,
        $or: [
          { recipientId: userObjectId },
          { recipientRole: authUser.role },
          { recipientRole: 'ALL' },
        ],
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    return { success: true };
  }
}
