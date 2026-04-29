import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Role, ArticleStatus } from '../src/generated/prisma/client';
import { prisma } from '../src/config/db.config';
import slugify from 'slugify';

async function main() {
    console.log('Seeding database...');

    try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Comment", "Favorite", "Notification", "Task", "Article", "Category", "User" RESTART IDENTITY CASCADE;`);
    } catch {
        console.log('Truncate failed, trying deleteMany');
        await prisma.comment.deleteMany();
        await prisma.favorite.deleteMany();
        await prisma.notification.deleteMany();
        await prisma.task.deleteMany();
        await prisma.article.deleteMany();
        await prisma.category.deleteMany();
        await prisma.user.deleteMany();
    }

    const passwordHash = await bcrypt.hash('password', 10);

    const usersData = [
        { name: 'Admin User', email: 'admin@techaxis.com', role: Role.ADMIN },
        { name: 'Writer One', email: 'writer@techaxis.com', role: Role.WRITER },
        { name: 'Writer Two', email: 'writer2@techaxis.com', role: Role.WRITER },
        { name: 'Super Admin', email: 'superadmin@techaxis.com', role: Role.SUPERADMIN },
        { name: 'Reader User', email: 'reader@techaxis.com', role: Role.READER },
    ];

    const users = [];
    for (const userData of usersData) {
        const user = await prisma.user.create({
            data: {
                email: userData.email,
                name: userData.name,
                password_hash: passwordHash,
                role: userData.role,
            },
        });
        users.push(user);
    }
    
    console.log('Users created');

    const categoriesData = [
        { name: 'Product Review' },
        { name: 'Hardware' },
        { name: 'Software' },
        { name: 'AI' },
        { name: 'Other' }
    ];

    const categories: Record<string, number> = {};

    for (const cat of categoriesData) {
        const created = await prisma.category.create({ data: cat });
        categories[cat.name] = created.id;
    }

    console.log('Categories created');

    const loremContent = "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>";
    const loremSummary = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

    const articlesData: {
        title: string;
        category: string;
        status: ArticleStatus;
        isFeatured: boolean;
        authorIndex: number;
    }[] = [

        { title: 'Product Review Article One',   category: 'Product Review', status: ArticleStatus.PUBLISHED, isFeatured: true,  authorIndex: 1 },
        { title: 'Product Review Article Two',   category: 'Product Review', status: ArticleStatus.PUBLISHED, isFeatured: false, authorIndex: 2 },
        { title: 'Product Review Article Three', category: 'Product Review', status: ArticleStatus.DRAFT,     isFeatured: false, authorIndex: 1 },

        { title: 'Hardware Article One', category: 'Hardware', status: ArticleStatus.PUBLISHED, isFeatured: false, authorIndex: 2 },
        { title: 'Hardware Article Two', category: 'Hardware', status: ArticleStatus.PUBLISHED, isFeatured: false, authorIndex: 1 },

        { title: 'Software Article One',   category: 'Software', status: ArticleStatus.PUBLISHED, isFeatured: true,  authorIndex: 1 },
        { title: 'Software Article Two',   category: 'Software', status: ArticleStatus.PUBLISHED, isFeatured: false, authorIndex: 2 },
        { title: 'Software Article Three', category: 'Software', status: ArticleStatus.DRAFT,     isFeatured: false, authorIndex: 2 },

        { title: 'AI Article One', category: 'AI', status: ArticleStatus.PUBLISHED, isFeatured: false, authorIndex: 1 },
        { title: 'AI Article Two', category: 'AI', status: ArticleStatus.REVIEW,    isFeatured: false, authorIndex: 2 },

        { title: 'Other Article One', category: 'Other', status: ArticleStatus.PUBLISHED, isFeatured: false, authorIndex: 1 },
        { title: 'Other Article Two', category: 'Other', status: ArticleStatus.DRAFT,     isFeatured: false, authorIndex: 2 },
    ];

    const createdTasks = [];
    for (let i = 0; i < articlesData.length; i++) {
        const a = articlesData[i];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7 + i);

        const isCompleted = a.status === ArticleStatus.PUBLISHED;

        const task = await prisma.task.create({
            data: {
                title: `Write: ${a.title}`,
                description: loremSummary,
                priority: (i % 3) + 1,
                isCompleted,
                assignedToId: users[a.authorIndex].id,
                dueDate,
            },
        });
        createdTasks.push(task);
    }

    console.log('Tasks created');

    const generateSvgDataUri = (title: string) => {
        const escapedTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
        const svg = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#f8fafc" /><stop offset="100%" stop-color="#1e293b" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#grad)" /><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="32" fill="#475569">${escapedTitle}</text></svg>`;
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    };

    for (let i = 0; i < articlesData.length; i++) {
        const a = articlesData[i];
        const slug = slugify(a.title, { lower: true, strict: true });
        const publishedAt = a.status === ArticleStatus.PUBLISHED ? new Date() : null;

        await prisma.article.create({
            data: {
                title: a.title,
                slug,
                summary: loremSummary,
                content: loremContent,
                status: a.status,
                isFeatured: a.isFeatured,
                thumbnail: generateSvgDataUri(a.title),
                publishedAt,
                authorId: users[a.authorIndex].id,
                categoryId: categories[a.category],
                taskId: createdTasks[i].id,
            },
        });
    }

    console.log('Articles created');
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });