import { prisma } from '../config/db.config';

const INTERVAL_MS = 60_000; // Check every 60 seconds

export function startScheduledPublisher() {
    setInterval(async () => {
        try {
            const now = new Date();

            const articles = await prisma.article.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledAt: { lte: now },
                },
            });

            for (const article of articles) {
                await prisma.article.update({
                    where: { id: article.id },
                    data: {
                        status: 'PUBLISHED',
                        publishedAt: now,
                        scheduledAt: null,
                    },
                });

                if (article.taskId) {
                    await prisma.task.update({
                        where: { id: article.taskId },
                        data: { isCompleted: true },
                    });
                }

                console.log(`[Scheduler] Published article #${article.id}: "${article.title}"`);
            }
        } catch (error) {
            console.error('[Scheduler] Error publishing scheduled articles:', error);
        }
    }, INTERVAL_MS);

    console.log('[Scheduler] Scheduled publisher started (checking every 60s)');
}
