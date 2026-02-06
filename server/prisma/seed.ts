import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Role, ArticleStatus } from '../src/generated/prisma/client';
import { prisma } from '../src/config/db.config';

async function main() {
    console.log('Seeding database...');

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
    
    const catReview = await prisma.category.create({ data: { name: 'Product Review' } });
    const catHardware = await prisma.category.create({ data: { name: 'Hardware' } });
    const catSoftware = await prisma.category.create({ data: { name: 'Software' } });
    const catAI = await prisma.category.create({ data: { name: 'AI' } });
    const catOther = await prisma.category.create({ data: { name: 'Other' } });

    await prisma.article.createMany({
        data: [
            {
                title: 'First Software Article',
                slug: 'first-software-article',
                summary: 'Summary of the first software article.',
                content: '<p>This is the content of the first software article.</p>',
                status: ArticleStatus.PUBLISHED,
                authorId: writer.id,
                categoryId: catSoftware.id,
                publishedAt: new Date(),
                thumbnail: 'https://placehold.co/600x400?text=Software',
                isFeatured: true,
            },
            {
                title: 'First Hardware Article',
                slug: 'first-hardware-article',
                summary: 'Summary of the first hardware article.',
                content: '<p>This is the content of the first hardware article.</p>',
                status: ArticleStatus.PUBLISHED,
                authorId: writer.id,
                categoryId: catHardware.id,
                publishedAt: new Date(),
                thumbnail: 'https://placehold.co/600x400?text=Hardware',
            },
            {
                title: 'First Product Review',
                slug: 'first-product-review',
                summary: 'Summary of the first product review.',
                content: '<p>This is the content of the product review.</p>',
                status: ArticleStatus.PUBLISHED,
                authorId: admin.id,
                categoryId: catReview.id,
                publishedAt: new Date(),
                thumbnail: 'https://placehold.co/600x400?text=Review',
            },
            {
                title: 'First AI Article',
                slug: 'first-ai-article',
                summary: 'Summary of the first AI article.',
                content: '<p>This is the content of the AI article.</p>',
                status: ArticleStatus.PUBLISHED,
                authorId: writer.id,
                categoryId: catAI.id,
                publishedAt: new Date(),
                thumbnail: 'https://placehold.co/600x400?text=AI',
            },
            {
                title: 'First Other Article (Draft)',
                slug: 'first-other-article-draft',
                summary: 'Summary of the draft article.',
                content: '<p>This is the content of the draft article.</p>',
                status: ArticleStatus.DRAFT,
                authorId: writer.id,
                categoryId: catOther.id,
                thumbnail: null,
            },
            {
                title: 'Second Software Article',
                slug: 'second-software-article',
                summary: 'Summary of the second software article.',
                content: '<p>This is the content of the second software article.</p>',
                status: ArticleStatus.PUBLISHED,
                authorId: writer.id,
                categoryId: catSoftware.id,
                publishedAt: new Date(),
                thumbnail: 'https://placehold.co/600x400?text=Software+2',
            },
        ],
    });

    await prisma.task.createMany({
        data: [
            {
                title: 'Review First Software Article',
                description: 'Review the software article for publication.',
                assignedToId: admin.id,
                isCompleted: false,
            },
            {
                title: 'Edit Draft Article',
                description: 'Finish writing the draft article.',
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