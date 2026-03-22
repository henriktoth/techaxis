import { prisma } from '../config/db.config';

const INTERVAL_MS = 60_000;

/**
 * Starts a scheduled publisher that runs every 60 seconds to check for articles with status "SCHEDULED" and a scheduledAt time in the past. 
 * If such articles are found, their status is updated to "PUBLISHED", publishedAt is set to the current time, and scheduledAt is cleared. 
 * If the article has an associated task, that task is marked as completed. 
 */
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
