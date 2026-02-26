import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Role, ArticleStatus } from '../src/generated/prisma/client';
import { prisma } from '../src/config/db.config';

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
        { name: 'Kovács János', email: 'admin@techaxis.hu', role: Role.ADMIN },
        { name: 'Nagy Éva', email: 'writer@techaxis.hu', role: Role.WRITER },
        { name: 'Tóth Péter', email: 'writer2@techaxis.hu', role: Role.WRITER }
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
    const [adminUser, writer1, writer2] = users;

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

    const articlesData = [
        // Product Review
        {
            title: 'Samsung Galaxy S24 Ultra Review: The AI Powerhouse',
            slug: 'samsung-galaxy-s24-ultra-review',
            summary: 'Samsung\'s latest flagship pushes the boundaries of what a smartphone can do with integrated AI features and a new titanium frame.',
            content: '<p>The Samsung Galaxy S24 Ultra is more than just a spec bump; it represents a significant shift in how we interact with our devices. With the new Galaxy AI features, users can translate calls in real-time, generate summaries of notes, and even edit photos with generative fill.</p><p>Under the hood, the Snapdragon 8 Gen 3 for Galaxy chip delivers meaningful performance gains, especially in gaming and ray tracing. The new flat display is a welcome change for S Pen users, providing a more comfortable writing surface without the accidental touches associated with curved screens.</p>',
            category: 'Product Review',
            thumbnail: 'https://placehold.co/600x400?text=S24+Ultra',
            isFeatured: true
        },
        {
            title: 'Sony WH-1000XM5: Long-term Review',
            slug: 'sony-wh-1000xm5-long-term',
            summary: 'After six months of daily use, do Sony\'s noise-cancelling headphones still hold the crown?',
            content: '<p>The Sony WH-1000XM5 headphones have been on the market for a while now, and they remain a top contender for the best noise-cancelling headphones available. The lightweight design and plush earcups make them comfortable for long listening sessions, although the new non-foldable design might be a dealbreaker for frequent travelers.</p><p>Sound quality is exceptional, with a balanced profile that can be tweaked via the app. The noise cancellation is adaptive and effective, silencing office chatter and commute noise with ease. Battery life continues to impress, easily lasting a full week of moderate use on a single charge.</p>',
            category: 'Product Review',
            thumbnail: 'https://placehold.co/600x400?text=Sony+XM5'
        },

        // Hardware
        {
            title: 'The Future of GPUs: What to Expect from Blackwell',
            slug: 'future-of-gpus-blackwell',
            summary: 'NVIDIA\'s next architecture promises massive leaps in AI performance and efficiency.',
            content: '<p>As we approach the launch of NVIDIA\'s Blackwell architecture, the tech world is buzzing with anticipation. Rumors suggest that the RTX 50 series will not just focus on raw rasterization performance but will double down on AI capabilities, potentially introducing new DLSS features and more efficient path tracing.</p><p>The shift to a chiplet design could allow for higher yields and better scalability. This is crucial as the demand for high-performance computing in AI sectors continues to skyrocket. Gamers can expect significant improvements in power efficiency, which is a much-needed correction after the power-hungry RTX 4090.</p>',
            category: 'Hardware',
            thumbnail: 'https://placehold.co/600x400?text=NVIDIA+Blackwell'
        },
        {
            title: 'Why PCIe 5.0 SSDs Are Finally Worth It',
            slug: 'why-pcie-5-ssds-worth-it',
            summary: 'Prices are dropping and speeds are increasing. Is it time to upgrade your storage?',
            content: '<p>PCIe 5.0 SSDs hit the market with high prices and thermal management issues, but the second generation of drives is solving these problems. With read speeds surpassing 14,000 MB/s, these drives offer near-instant load times for heavy applications and games optimized for DirectStorage.</p><p>For content creators working with 8K video or massive 3D assets, the bandwidth upgrade is noticeable. While everyday users might not feel the difference from a fast PCIe 4.0 drive, the future-proofing and dropping prices make Gen 5 a compelling option for new high-end PC builds in 2026.</p>',
            category: 'Hardware',
            thumbnail: 'https://placehold.co/600x400?text=PCIe+5.0'
        },

        // Software
        {
            title: 'Rust vs Go: Choosing the Right Backend Language in 2026',
            slug: 'rust-vs-go-backend-2026',
            summary: 'A comparative analysis of two of the most popular modern backend languages.',
            content: '<p>The debate between Rust and Go continues to evolve. Go remains the king of simplicity and rapid development, making it the default choice for microservices and cloud-native applications. Its garbage collection and "batteries included" standard library allow teams to ship code fast.</p><p>Rust, on the other hand, offers memory safety without a garbage collector, resulting in predictable performance and lower resource usage. While the learning curve is steeper, the reliability and correctness guarantees make it ideal for critical infrastructure and high-performance systems. In 2026, we are seeing more hybrid approaches where companies use both languages where they shine best.</p>',
            category: 'Software',
            thumbnail: 'https://placehold.co/600x400?text=Rust+vs+Go'
        },
        {
            title: 'The Evolution of React Server Components',
            slug: 'evolution-react-server-components',
            summary: 'How RSCs have changed the way we build web applications over the last few years.',
            content: '<p>React Server Components (RSC) started as a controversial experimental feature but have now matured into a standard way of building React applications. By shifting data fetching and logic to the server, RSCs significantly reduce the bundle size sent to the client, improving initial load performance and SEO.</p><p>Frameworks like Next.js have fully embraced RSCs, but we are now seeing other ecosystems adopting similar patterns. The mental model has shifted from "client-side everything" to a more balanced architecture where the server handles the heavy lifting, and the client focuses on interactivity.</p>',
            category: 'Software',
            thumbnail: 'https://placehold.co/600x400?text=React+RSC'
        },

        // AI
        {
            title: 'Small Language Models: The Next Big Thing',
            slug: 'small-language-models-trend',
            summary: 'Why capability is moving from massive data centers to local devices.',
            content: '<p>While massive models like GPT-5 dominate headlines, a quiet revolution is happening with Small Language Models (SLMs). These models, often with fewer than 10 billion parameters, are optimized to run on consumer hardware, including laptops and even high-end smartphones.</p><p>The benefits are clear: privacy, reduced latency, and lower costs. Companies are realizing they don\'t need a trillion-parameter model to summarize emails or draft responses. Specialized, fine-tuned SLMs are proving that quality data is more important than sheer quantity of parameters.</p>',
            category: 'AI',
            thumbnail: 'https://placehold.co/600x400?text=Small+Language+Models'
        },
        {
            title: 'AI Agents: From Chatbots to Autonomous Workers',
            slug: 'ai-agents-autonomous-workers',
            summary: 'How AI is evolving from passive assistants to proactive agents that can execute complex tasks.',
            content: '<p>We are moving past the era of "prompt and response." The new generation of AI agents can plan, reason, and execute multi-step workflows autonomously. Imagine an AI that doesn\'t just tell you how to book a flight, but actually goes to the website, selects the seat, and enters your payment details.</p><p>This shift requires new frameworks for safety and permission management. As agents gain the ability to interact with the real world via APIs, the potential for productivity gains is immense, but so are the risks of unintended actions. 2026 will be the year of the "Agentic Web".</p>',
            category: 'AI',
            thumbnail: 'https://placehold.co/600x400?text=AI+Agents'
        },

        // Other
        {
            title: 'Digital Detox: Reclaiming Your Attention Span',
            slug: 'digital-detox-reclaiming-attention',
            summary: 'Strategies for staying focused in an economy built on distraction.',
            content: '<p>In a world where every app is fighting for your dopamine, the ability to focus has become a superpower. "Digital Minimalism" isn\'t just a trend; it\'s a survival strategy for mental health. Simple changes like turning off non-human notifications and keeping phones out of the bedroom can have profound effects.</p><p>We are seeing a resurgence of "dumb phones" and offline hobbies as people try to disconnect. The key isn\'t to reject technology entirely, but to use it intentionally rather than compulsively. Your attention is a finite resource—spend it wisely.</p>',
            category: 'Other',
            thumbnail: 'https://placehold.co/600x400?text=Digital+Detox'
        },
        {
            title: 'The Art of Mechanical Keyboards',
            slug: 'art-of-mechanical-keyboards',
            summary: 'Why people are spending hundreds of dollars on custom keyboards.',
            content: '<p>What was once a niche hobby for gamers has exploded into a massive subculture. Building a custom mechanical keyboard is about more than just typing; it\'s about personalization, aesthetics, and the tactile experience. From lubricating switches to choosing the perfect keycap profile, the level of detail is obsessive.</p><p>Group buys, limited artisan keycaps, and custom machined cases have created a thriving market. For many, the keyboard is the primary tool of their trade, and investing in a high-quality instrument makes the hours spent typing just a little bit more enjoyable.</p>',
            category: 'Other',
            thumbnail: 'https://placehold.co/600x400?text=Mechanical+Keyboards'
        }
    ];

    for (const article of articlesData) {

        const randomUser = users[Math.floor(Math.random() * users.length)];

        let status = Math.random() > 0.3 ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT;
        // Use explicit boolean if present, otherwise random
        const isFeatured = ('isFeatured' in article) ? (article as any).isFeatured : (Math.random() > 0.85);

        if (isFeatured) {
            status = ArticleStatus.PUBLISHED;
        }

        const publishedAt = status === ArticleStatus.PUBLISHED ? new Date() : null;
        
        await prisma.article.create({
            data: {
                title: article.title,
                slug: article.slug,
                summary: article.summary,
                content: article.content,
                status: status,
                isFeatured: isFeatured,
                thumbnail: article.thumbnail,
                publishedAt: publishedAt,
                authorId: randomUser.id,
                categoryId: categories[article.category] || categories['Other'],
            }
        });
    }

    console.log('Articles created');

    // Tasks
    const tasksData = [
        { 
            title: 'Write Article: "The Rise of RISC-V"', 
            description: 'Research and write a comprehensive article about the current state of RISC-V architecture and its adoption in consumer electronics.', 
            priority: 2, 
            isCompleted: false,
            assignedTo: writer1 
        },
        { 
            title: 'Edit Draft: "Git Best Practices"', 
            description: 'Review the draft article submitted by the guest author. Check for technical accuracy and formatting.', 
            priority: 3, 
            isCompleted: false,
            assignedTo: adminUser 
        },
        { 
            title: 'Write Article: "JavaScript Frameworks in 2027"', 
            description: 'Execute a survey and write a speculative piece on the future of frontend frameworks.', 
            priority: 1, 
            isCompleted: false,
            assignedTo: writer2 
        },
        { 
            title: 'Update Review: "Best Monitors for Coding"', 
            description: 'The current guide is outdated. Add new models released in Q1 2026 and remove discontinued ones.', 
            priority: 2, 
            isCompleted: true,
            assignedTo: writer1 
        },
        { 
            title: 'Write Article: "Understanding Quantum Computing"', 
            description: 'Create an "Explain Like I\'m 5" guide to the basics of quantum mechanics and computing applications.', 
            priority: 1, 
            isCompleted: false,
            assignedTo: writer2 
        }
    ];

    for (const task of tasksData) {
         const tomorrow = new Date();
         tomorrow.setDate(tomorrow.getDate() + 7);

        await prisma.task.create({
            data: {
                title: task.title,
                description: task.description,
                priority: task.priority,
                isCompleted: task.isCompleted,
                assignedToId: task.assignedTo.id,
                dueDate: tomorrow
            }
        });
    }
    
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