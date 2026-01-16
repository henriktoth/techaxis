import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Role, ArticleStatus } from '../src/generated/prisma/client';
import { prisma } from '../src/config/db.config';

async function main() {
    console.log('Seeding database...');

    // Clear data
    await prisma.task.deleteMany();
    await prisma.article.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({
        data: {
            email: 'admin@techaxis.com',
            name: 'Admin',
            password_hash: await bcrypt.hash('password', 10),
            role: Role.ADMIN,
        },
    });

    const writer = await prisma.user.create({
        data: {
            email: 'writer@techaxis.com',
            name: 'Writer',
            password_hash: await bcrypt.hash('password', 10),
            role: Role.WRITER,
        },
    });
    
    // Create categories
    const catReview = await prisma.category.create({ data: { name: 'Product Review' } });
    const catHardware = await prisma.category.create({ data: { name: 'Hardware' } });
    const catSoftware = await prisma.category.create({ data: { name: 'Software' } });
    const catAI = await prisma.category.create({ data: { name: 'AI' } });
    const catOther = await prisma.category.create({ data: { name: 'Other' } });

    await prisma.article.createMany({
        data: [
            {
                title: 'First Article',
                slug: 'first-article',
                summary: 'Summary of the first article.',
                content: 'This is the content of the first article.',
                status: ArticleStatus.PUBLISHED,
                authorId: writer.id,
                categoryId: catSoftware.id,
            },
            {
                title: 'Second Article',
                slug: 'second-article',
                summary: 'Summary of the second article.',
                content: 'This is the content of the second article.',
                status: ArticleStatus.DRAFT,
                authorId: writer.id,
                categoryId: catHardware.id,
            },
        ],
    });

    await prisma.task.createMany({
        data: [
            {
                title: 'Review First Article',
                description: 'Review the first article for publication.',
                assignedToId: admin.id,
                isCompleted: false,
            },
            {
                title: 'Edit Second Article',
                description: 'Edit the second article before submission.',
                assignedToId: writer.id,
                isCompleted: false,
            },
        ],
    });
    
    console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });