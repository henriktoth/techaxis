import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('../../config/db.config', () => ({
  prisma: mockPrisma,
}));

import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '../notificationController';

type AuthUser = { userId: number; role: string };

type TestRequest = Partial<Request> & {
  user?: AuthUser;
  params: Record<string, string>;
};

type TestResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const createReq = (overrides: Partial<TestRequest> = {}): Request => {
  return {
    params: {},
    ...overrides,
  } as unknown as Request;
};

const createRes = (): TestResponse => {
  const res = {} as TestResponse;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const createNext = (): NextFunction => vi.fn() as unknown as NextFunction;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('notificationController unit tests', () => {
  describe('getNotifications', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      await getNotifications(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns notifications list', async () => {
      const req = createReq({ user: { userId: 2, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.notification.findMany.mockResolvedValue([{ id: 1 }]);

      await getNotifications(req, res, next);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 2 },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const req = createReq({ user: { userId: 2, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();
      const error = new Error('load failed');

      mockPrisma.notification.findMany.mockRejectedValue(error);

      await getNotifications(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUnreadCount', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      await getUnreadCount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns unread count', async () => {
      const req = createReq({ user: { userId: 5, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.notification.count.mockResolvedValue(3);

      await getUnreadCount(req, res, next);

      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 5, isRead: false },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ count: 3 });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await markAsRead(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid notification id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      await markAsRead(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when notification is missing', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 4, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await markAsRead(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when notification belongs to another user', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 4, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.notification.findUnique.mockResolvedValue({ id: 2, userId: 8 });

      await markAsRead(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('marks notification as read', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 4, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.notification.findUnique.mockResolvedValue({ id: 2, userId: 4 });
      mockPrisma.notification.update.mockResolvedValue({ id: 2, isRead: true });

      await markAsRead(req, res, next);

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { isRead: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 2, isRead: true });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      await markAllAsRead(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('marks all notifications as read', async () => {
      const req = createReq({ user: { userId: 6, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.notification.updateMany.mockResolvedValue({ count: 2 });

      await markAllAsRead(req, res, next);

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 6, isRead: false },
        data: { isRead: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'All notifications marked as read' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
