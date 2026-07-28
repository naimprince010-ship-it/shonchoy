const prisma = require('./src/utils/prisma');

async function main() {
  const clients = await prisma.client.findMany({ select: { id: true, name: true, phone: true } });
  const groups = await prisma.group.findMany({ select: { id: true, name: true } });
  const centers = await prisma.center.findMany({ select: { id: true, name: true } });
  const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
  const users = await prisma.user.findMany({ select: { id: true, name: true, phone: true, role: true } });
  const loans = await prisma.loan.findMany({ select: { id: true, client: { select: { name: true } }, principal_amount: true, status: true } });
  const loanProducts = await prisma.loanProduct.findMany({ select: { id: true, name: true, interest_rate: true, default_term_weeks: true } });

  console.log("=== DB SUMMARY ===");
  console.log("Branches:", branches);
  console.log("Centers:", centers);
  console.log("Groups:", groups);
  console.log("Users:", users);
  console.log("Clients:", clients);
  console.log("Loans:", loans.map(l => ({ id: l.id, client: l.client.name, amount: l.principal_amount, status: l.status })));
  console.log("Loan Products:", loanProducts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
