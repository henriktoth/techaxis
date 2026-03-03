import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Role, ArticleStatus } from '../src/generated/prisma/client';
import { prisma } from '../src/config/db.config';
import slugify from 'slugify';

async function main() {
    console.log('Seeding database...');

    try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Task", "Article", "Category", "User" RESTART IDENTITY CASCADE;`);
    } catch {
        console.log('Truncate failed, trying deleteMany');
        await prisma.task.deleteMany();
        await prisma.article.deleteMany();
        await prisma.category.deleteMany();
        await prisma.user.deleteMany();
    }

    const passwordHash = await bcrypt.hash('password', 10);

    const usersData = [
        { name: 'Admin User', email: 'admin@techaxis.com', role: Role.ADMIN },
        { name: 'Writer One', email: 'writer@techaxis.com', role: Role.WRITER },
        { name: 'Writer Two', email: 'writer2@techaxis.com', role: Role.WRITER }
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

    const loremIpsumParagraph = "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>";
    const loremIpsumSummary = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

    for (const categoryName of Object.keys(categories)) {
        for (let i = 1; i <= 5; i++) {
            const title = `${categoryName} Article ${i}`;
            const slugBase = slugify(title, { lower: true, strict: true });
            
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const categoryId = categories[categoryName];


            let status = Math.random() > 0.3 ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT;
            const isFeatured = Math.random() > 0.85;
            
            if (isFeatured) {
                status = ArticleStatus.PUBLISHED;
            }

            const publishedAt = status === ArticleStatus.PUBLISHED ? new Date() : null;
            
            await prisma.article.create({
                data: {
                    title: title,
                    slug: `${slugBase}-${i}`,
                    summary: loremIpsumSummary,
                    content: loremIpsumParagraph,
                    status: status,
                    isFeatured: isFeatured,
                    thumbnail: `https://placehold.co/600x400?text=${encodeURIComponent(title)}`,
                    publishedAt: publishedAt,
                    authorId: randomUser.id,
                    categoryId: categoryId,
                }
            });
        }
    }

    console.log('Articles created');

    for (let i = 1; i <= 10; i++) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 7);
        
        const assignedUser = users[Math.floor(Math.random() * users.length)];

        await prisma.task.create({
            data: {
                title: `Task ${i}`,
                description: loremIpsumSummary,
                priority: Math.floor(Math.random() * 3) + 1,
                isCompleted: Math.random() > 0.5,
                assignedToId: assignedUser.id,
                dueDate: tomorrow
            }
        });
    }
    
    console.log('Tasks created');
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