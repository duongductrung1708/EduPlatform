import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../../models/notification.model';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async list(userId: string, limit = 20) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async countUnread(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    return this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId), read: false });
  }

  async create(userId: string, title: string, body: string, meta?: any) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    const doc = await this.notificationModel.create({ userId: new Types.ObjectId(userId), title, body, meta, read: false });
    return doc.toObject();
  }

  async markRead(userId: string, notificationId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new Error('Invalid notification ID format');
    }
    
    await this.notificationModel.updateOne({ _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) }, { $set: { read: true } });
  }

  async markAllRead(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    await this.notificationModel.updateMany({ userId: new Types.ObjectId(userId), read: false }, { $set: { read: true } });
  }

  async remove(userId: string, notificationId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new Error('Invalid notification ID format');
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    await this.notificationModel.deleteOne({ _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) });
  }
}


