import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const {
  mockPrisma,
  mockGetPaginationParams,
  mockCreatePaginatedResponse,
  mockIsAdminRole,
} = vi.hoisted(() => ({
  mockPrisma: {
    task: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
  mockGetPaginationParams: vi.fn(),
  mockCreatePaginatedResponse: vi.fn(),
  mockIsAdminRole: vi.fn(),
}));

vi.mock('../../config/db.config', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../utils/pagination', () => ({
  getPaginationParams: mockGetPaginationParams,
  createPaginatedResponse: mockCreatePaginatedResponse,
}));

vi.mock('../../utils/roles', () => ({
  isAdminRole: mockIsAdminRole,
}));

import {
  createTask,
  deleteTask,
  dropTask,
  getAllTasks,
  getTaskById,
  takeTask,
  toggleTaskStatus,
  updateTask,
} from '../taskController';

type AuthUser = { userId: number; role: string };

type TestRequest = Partial<Request> & {
  user?: AuthUser;
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, unknown>;
};

type TestResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const createReq = (overrides: Partial<TestRequest> = {}): Request => {
  return {
    params: {},
    query: {},
    body: {},
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
  mockIsAdminRole.mockReturnValue(false);
  mockGetPaginationParams.mockReturnValue({ page: 1, limit: 10, skip: 0 });
});

describe('taskController unit tests', () => {
  describe('getAllTasks', () => {
    it('returns 401 when user is missing', async () => {
      const req = createReq();
      const res = createRes();
      const next = createNext();

      await getAllTasks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 for unsupported roles', async () => {
      const req = createReq({ user: { userId: 2, role: 'READER' } });
      const res = createRes();
      const next = createNext();

      await getAllTasks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns paginated tasks for admin', async () => {
      const req = createReq({
        user: { userId: 1, role: 'ADMIN' },
        query: { search: 'bug', priority: '1', assignedToId: '4' },
      });
      const res = createRes();
      const next = createNext();

      mockIsAdminRole.mockReturnValue(true);
      mockGetPaginationParams.mockReturnValue({ page: 1, limit: 5, skip: 0 });
      mockPrisma.task.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrisma.task.count.mockResolvedValue(1);
      mockCreatePaginatedResponse.mockReturnValue({ data: [{ id: 1 }], meta: { total: 1 } });

      await getAllTasks(req, res, next);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedToId: 4,
            priority: 1,
            title: { contains: 'bug', mode: 'insensitive' },
          }),
          skip: 0,
          take: 5,
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: [{ id: 1 }], meta: { total: 1 } });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await getTaskById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid task id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      await getTaskById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when task is missing', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'ADMIN' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue(null);

      await getTaskById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when writer is not assignee', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue({ id: 2, assignedToId: 9 });

      await getTaskById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. You can only view tasks assigned to you or unassigned tasks.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('createTask', () => {
    it('returns 400 when body is missing', async () => {
      const req = createReq({ body: undefined });
      const res = createRes();
      const next = createNext();

      await createTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Request body is required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when required fields are missing', async () => {
      const req = createReq({ body: { title: 'Title' } });
      const res = createRes();
      const next = createNext();

      await createTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Title and description are required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when priority is invalid', async () => {
      const req = createReq({ body: { title: 'Title', description: 'Desc', priority: 9 } });
      const res = createRes();
      const next = createNext();

      await createTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Priority must be between 0 (Low) and 2 (High)',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when assignee is invalid', async () => {
      const req = createReq({
        body: { title: 'Title', description: 'Desc', assignedToId: 4 },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await createTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User with ID 4 does not exist' });
      expect(next).not.toHaveBeenCalled();
    });

    it('creates task and notification when assigned', async () => {
      const req = createReq({
        body: { title: 'Title', description: 'Desc', assignedToId: 4 },
      });
      const res = createRes();
      const next = createNext();

      mockPrisma.user.findUnique.mockResolvedValue({ id: 4 });
      mockPrisma.task.create.mockResolvedValue({ id: 9, title: 'Title', assignedToId: 4 });

      await createTask(req, res, next);

      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'Title', description: 'Desc', assignedToId: 4 }),
        }),
      );
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ relatedId: 9, userId: 4 }),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 9, title: 'Title', assignedToId: 4 });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await updateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid task id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when task is missing', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue(null);

      await updateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when priority is invalid', async () => {
      const req = createReq({ params: { id: '2' }, body: { priority: 9 } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue({ id: 2, assignedToId: 1 });

      await updateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Priority must be between 0 (Low) and 2 (High)',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when new assignee is invalid', async () => {
      const req = createReq({ params: { id: '2' }, body: { assignedToId: 4 } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue({ id: 2, assignedToId: null });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await updateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User with ID 4 does not exist' });
      expect(next).not.toHaveBeenCalled();
    });

    it('updates task and notifies when assignee changes', async () => {
      const req = createReq({ params: { id: '2' }, body: { assignedToId: 4 } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue({ id: 2, assignedToId: 1 });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 4 });
      mockPrisma.task.update.mockResolvedValue({ id: 2, title: 'Title', assignedToId: 4 });

      await updateTask(req, res, next);

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: expect.objectContaining({ assignedToId: 4 }),
        }),
      );
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 4 }) }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 2, title: 'Title', assignedToId: 4 });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await deleteTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid task id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when task is missing', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue(null);

      await deleteTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deletes task when found', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue({ id: 2 });
      mockPrisma.task.delete.mockResolvedValue({ id: 2 });

      await deleteTask(req, res, next);

      expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 2 });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('toggleTaskStatus', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await toggleTaskStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid task id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      await toggleTaskStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when task is missing', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue(null);

      await toggleTaskStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when user is not assignee', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue({ id: 2, assignedToId: 9, isCompleted: false });

      await toggleTaskStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. You can only update the status of tasks assigned to you.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('toggles task status when assignee', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue({ id: 2, assignedToId: 3, isCompleted: false });
      mockPrisma.task.update.mockResolvedValue({ id: 2, isCompleted: true });

      await toggleTaskStatus(req, res, next);

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { isCompleted: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 2, isCompleted: true });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('takeTask', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await takeTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid task id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      await takeTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when task is missing', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue(null);

      await takeTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when task already assigned', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue({ id: 2, assignedToId: 5 });

      await takeTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task is already assigned' });
      expect(next).not.toHaveBeenCalled();
    });

    it('assigns task to user when unassigned', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue({ id: 2, assignedToId: null });
      mockPrisma.task.update.mockResolvedValue({ id: 2, assignedToId: 3 });

      await takeTask(req, res, next);

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: { assignedToId: 3 },
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 2, assignedToId: 3 });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('dropTask', () => {
    it('returns 400 for invalid id', async () => {
      const req = createReq({ params: { id: 'bad' } });
      const res = createRes();
      const next = createNext();

      await dropTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid task id' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when user is missing', async () => {
      const req = createReq({ params: { id: '2' } });
      const res = createRes();
      const next = createNext();

      await dropTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 when task is missing', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue(null);

      await dropTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when task assigned to someone else', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue({ id: 2, assignedToId: 9 });

      await dropTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. You can only drop tasks assigned to you.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('drops task when assigned to user', async () => {
      const req = createReq({ params: { id: '2' }, user: { userId: 3, role: 'WRITER' } });
      const res = createRes();
      const next = createNext();

      mockPrisma.task.findUnique.mockResolvedValue({ id: 2, assignedToId: 3 });
      mockPrisma.task.update.mockResolvedValue({ id: 2, assignedToId: null });

      await dropTask(req, res, next);

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: { assignedToId: null },
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 2, assignedToId: null });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
