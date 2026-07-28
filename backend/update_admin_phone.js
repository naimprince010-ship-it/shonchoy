require('dotenv').config();
const prisma = require('./src/utils/prisma');

async function main() {
  console.log("Updating ADMIN phone number...");
  const admin = await prisma.user.findFirst({
    where: { phone: '01700000000' }
  });

  if (!admin) {
    console.log("Admin user with phone 01700000000 not found!");
    return;
  }

  const updatedAdmin = await prisma.user.update({
    where: { id: admin.id },
    data: { phone: '01938264923' }
  });

  console.log("Successfully updated admin phone!");
  console.log(`ID: ${updatedAdmin.id}, Name: ${updatedAdmin.name}, New Phone: ${updatedAdmin.phone}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
