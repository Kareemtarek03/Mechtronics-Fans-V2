import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: 'superadmin@fanselect.com' }
  });

  if (existingSuperAdmin) {
    console.log('✅ Super admin already exists!');
    console.log('   Email: superadmin@fanselect.com');
    return;
  }

  // Create super admin user
  const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);
  
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@fanselect.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: hashedPassword,
      role: 'super_admin',
      emailVerified: true
    }
  });

  console.log('✅ Super admin created successfully!');
  console.log('   Email: superadmin@fanselect.com');
  console.log('   Password: SuperAdmin@123');
  console.log('   Role: super_admin');
  console.log('');
  console.log('🎉 You can now login with these credentials!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
