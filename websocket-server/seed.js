import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Create a default user
  const user = await prisma.user.upsert({
    where: { clerkId: 'default-user' },
    update: {},
    create: {
      clerkId: 'default-user',
      name: 'Default User',
      email: 'default@example.com',
    },
  });
  
  console.log('Created default user:', user);
  
  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: 'Sample Project',
      userId: user.id,
      files: {
        create: {
          name: 'main.js',
          language: 'javascript',
          content: 'console.log("Hello World");',
        },
      },
    },
  });
  
  console.log('Created sample project:', project);
  
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
