import 'dotenv/config';
import bcrypt from 'bcrypt';
import {Role, ArticleStatus } from '../src/generated/prisma/enums';
import { prisma } from '../src/db';

async function main() {
    console.log('Seeding database...');

    await prisma.task.deleteMany();
    await prisma.article.deleteMany();
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

    await prisma.article.createMany({
        data: [
            {
                title: 'First Article',
                content: 'This is the content of the first article.',
                status: ArticleStatus.PUBLISHED,
                authorId: writer.id,
            },
            {
                title: 'Second Article',
                content: 'This is the content of the second article.',
                status: ArticleStatus.DRAFT,
                authorId: writer.id,
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

}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
    console.log('Seeding completed.');