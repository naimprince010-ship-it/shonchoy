const prisma = require('../utils/prisma');
const { buildRoleFilter } = require('../utils/roleHelper');

async function getPortfolioSummary(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build role filters for different entities
    const clientFilter = await buildRoleFilter(userId, userRole, 'client');
    const loanFilter = await buildRoleFilter(userId, userRole, 'loan');
    const scheduleFilter = await buildRoleFilter(userId, userRole, 'schedule');
    const repaymentFilter = await buildRoleFilter(userId, userRole, 'repayment');

    // 1. Total active clients (assuming active means they exist and have an active status if we had one. We don't have status on client, so just count clients)
    // Actually we only count clients who have at least one DISBURSED loan as active? The MVP spec says "Total active clients". 
    // Let's count clients who have at least one DISBURSED loan.
    const activeClients = await prisma.client.count({
      where: {
        ...clientFilter,
        loans: {
          some: { status: 'DISBURSED' }
        }
      }
    });

    // 2. Total disbursed loans (count & amount)
    const disbursedLoansAggr = await prisma.loan.aggregate({
      _count: { id: true },
      _sum: { principal_amount: true },
      where: {
        ...loanFilter,
        status: 'DISBURSED'
      }
    });
    
    const totalDisbursedCount = disbursedLoansAggr._count.id;
    const totalDisbursedAmount = disbursedLoansAggr._sum.principal_amount ? parseFloat(disbursedLoansAggr._sum.principal_amount) : 0;

    // 3. Outstanding Calculation
    // We need all PENDING schedules
    const pendingSchedules = await prisma.loanInstallmentSchedule.findMany({
      where: {
        ...scheduleFilter,
        status: 'PENDING'
      },
      include: {
        repayments: true
      }
    });

    let totalOutstanding = 0;
    let totalOverdueAmount = 0;
    let overdueCount = 0;
    const today = new Date();

    for (const schedule of pendingSchedules) {
      const totalDue = parseFloat(schedule.total_due);
      let paidSoFar = 0;
      for (const rep of schedule.repayments) {
        paidSoFar += parseFloat(rep.amount_paid);
      }
      const scheduleOutstanding = totalDue - paidSoFar;
      
      totalOutstanding += scheduleOutstanding;

      // Check if overdue
      if (new Date(schedule.due_date) < today) {
        totalOverdueAmount += scheduleOutstanding;
        overdueCount += 1;
      }
    }

    // 4. Total Collected
    const collectedAggr = await prisma.loanRepayment.aggregate({
      _sum: { amount_paid: true },
      where: {
        ...repaymentFilter
      }
    });
    const totalCollected = collectedAggr._sum.amount_paid ? parseFloat(collectedAggr._sum.amount_paid) : 0;

    // 5. PAR (Portfolio at Risk)
    // PAR = (totalOverdueAmount / totalOutstanding) * 100 if outstanding > 0
    let par = 0;
    if (totalOutstanding > 0) {
      par = (totalOverdueAmount / totalOutstanding) * 100;
    }

    return res.json({
      data: {
        active_clients: activeClients,
        disbursed_loans_count: totalDisbursedCount,
        disbursed_loans_amount: totalDisbursedAmount,
        total_outstanding: parseFloat(totalOutstanding.toFixed(2)),
        total_collected: parseFloat(totalCollected.toFixed(2)),
        total_overdue_amount: parseFloat(totalOverdueAmount.toFixed(2)),
        total_overdue_count: overdueCount,
        par_percentage: parseFloat(par.toFixed(2))
      }
    });
  } catch (err) {
    console.error('Error fetching portfolio summary:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getDailyCollection(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const dateQuery = req.query.date; // expected format YYYY-MM-DD

    let targetDate = new Date();
    if (dateQuery) {
      targetDate = new Date(dateQuery);
    }
    
    // Set start and end of the day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const repaymentFilter = await buildRoleFilter(userId, userRole, 'repayment');

    const repayments = await prisma.loanRepayment.findMany({
      where: {
        ...repaymentFilter,
        payment_date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        loan: {
          include: {
            client: true
          }
        }
      },
      orderBy: {
        payment_date: 'desc'
      }
    });

    let dailyTotal = 0;
    const formattedData = repayments.map(rep => {
      const amount = parseFloat(rep.amount_paid);
      dailyTotal += amount;
      return {
        repayment_id: rep.id,
        loan_id: rep.loan_id,
        client_name: rep.loan.client.name,
        amount_paid: amount,
        payment_date: rep.payment_date
      };
    });

    return res.json({
      data: {
        date: startOfDay.toLocaleDateString('en-CA'),
        total_collection: dailyTotal,
        repayments: formattedData
      }
    });

  } catch (err) {
    console.error('Error fetching daily collection:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getPortfolioSummary, getDailyCollection };
