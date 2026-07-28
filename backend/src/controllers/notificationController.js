const prisma = require('../utils/prisma');
const { buildRoleFilter } = require('../utils/roleHelper');

async function getNotifications(req, res) {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const today = new Date();
    
    // Overdue Notifications
    const scheduleFilter = await buildRoleFilter(userId, userRole, 'schedule');
    const overdueInstallments = await prisma.loanInstallmentSchedule.findMany({
      where: {
        ...scheduleFilter,
        due_date: { lt: today },
        status: 'PENDING'
      },
      include: {
        loan: {
          include: { client: true }
        }
      }
    });

    const formattedOverdue = overdueInstallments.map(inst => ({
      id: `overdue_${inst.id}`,
      type: 'OVERDUE',
      message: `Installment overdue for client ${inst.loan.client.name}`,
      loan_id: inst.loan_id,
      amount: inst.total_due,
      date: inst.due_date
    }));

    // Pending Approval Notifications
    let formattedPending = [];
    if (userRole === 'ADMIN' || userRole === 'BRANCH_MANAGER') {
      const loanFilter = await buildRoleFilter(userId, userRole, 'loan');
      const pendingLoans = await prisma.loan.findMany({
        where: {
          ...loanFilter,
          status: 'PENDING'
        },
        include: { client: true }
      });

      formattedPending = pendingLoans.map(loan => ({
        id: `pending_${loan.id}`,
        type: 'PENDING_APPROVAL',
        message: `Loan application pending for client ${loan.client.name}`,
        loan_id: loan.id,
        amount: loan.principal_amount,
        date: loan.created_at
      }));
    }

    return res.json({
      total: formattedOverdue.length + formattedPending.length,
      overdue: formattedOverdue,
      pending_approvals: formattedPending
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getNotifications };
