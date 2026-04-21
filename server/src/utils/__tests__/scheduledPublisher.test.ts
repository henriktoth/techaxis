import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    article: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    task: {
      update: vi.fn(),
    },
  },
}));

vi.mock('../../config/db.config', () => ({
  prisma: mockPrisma,
}));

import { startScheduledPublisher } from '../scheduledPublisher';

describe('startScheduledPublisher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    (console.log as unknown as ReturnType<typeof vi.fn>).mockRestore?.();
    (console.error as unknown as ReturnType<typeof vi.fn>).mockRestore?.();
  });

  it('publishes scheduled articles and completes tasks', async () => {
    const articles = [
      { id: 1, title: 'First', taskId: 10 },
      { id: 2, title: 'Second', taskId: null },
    ];

    mockPrisma.article.findMany.mockResolvedValue(articles);
    mockPrisma.article.update.mockResolvedValue({});
    mockPrisma.task.update.mockResolvedValue({});

    startScheduledPublisher();

    await vi.runOnlyPendingTimersAsync();

    expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
      where: { status: 'SCHEDULED', scheduledAt: { lte: expect.any(Date) } },
    });

    expect(mockPrisma.article.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'PUBLISHED',
          publishedAt: expect.any(Date),
          scheduledAt: null,
        }),
      }),
    );

    expect(mockPrisma.task.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { isCompleted: true },
    });
  });

  it('logs errors when publishing fails', async () => {
    const error = new Error('db failure');
    mockPrisma.article.findMany.mockRejectedValue(error);

    startScheduledPublisher();

    await vi.runOnlyPendingTimersAsync();

    expect(console.error).toHaveBeenCalledWith('[Scheduler] Error publishing scheduled articles:', error);
  });
});
