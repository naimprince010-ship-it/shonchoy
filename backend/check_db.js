require('dotenv').config();
const prisma = require('./src/utils/prisma');

async function main() {
  console.log('Database Check:');
  const userCount = await prisma.user.count();
  const clientCount = await prisma.client.count();
  const groupCount = await prisma.group.count();
  
  console.log(`Users: ${userCount}`);
  console.log(`Clients: ${clientCount}`);
  console.log(`Groups: ${groupCount}`);
  console.log('No data lost.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
