const prisma = require('../utils/prisma');
const { logActivity } = require('../utils/auditLogger');

async function deposit(req, res) {
  const { savings_account_id, amount } = req.body;
  const recorded_by = req.user.id;

  if (!savings_account_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid savings_account_id and positive amount are required.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current account
      const account = await tx.savingsAccount.findUnique({
        where: { id: parseInt(savings_account_id, 10) },
      });

      if (!account) {
        throw new Error('Savings account not found');
      }

      // 2. Create the transaction record
      const transaction = await tx.savingsTransaction.create({
        data: {
          savings_account_id: account.id,
          type: 'DEPOSIT',
          amount,
          recorded_by,
        },
      });

      // 3. Update balance
      const updatedAccount = await tx.savingsAccount.update({
        where: { id: account.id },
        data: {
          balance: { increment: amount },
        },
      });

      // 4. (Optional MVP extra) Also record in CashTransaction
      await tx.cashTransaction.create({
        data: {
          type: 'CASH_IN',
          category: 'SAVINGS_DEPOSIT',
          amount,
          related_savings_id: account.id,
          recorded_by,
        },
      });

      return { transaction, updatedAccount };
    });

    await logActivity(req.user.id, req.user.name, 'SAVINGS_DEPOSITED', 'SavingsAccount', result.updatedAccount.id, { amount });

    return res.status(201).json({ message: 'Deposit successful', data: result });
  } catch (err) {
    console.error('Deposit error:', err);
    if (err.message === 'Savings account not found') {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function withdraw(req, res) {
  const { savings_account_id, amount } = req.body;
  const recorded_by = req.user.id;

  if (!savings_account_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid savings_account_id and positive amount are required.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current account to check balance
      const account = await tx.savingsAccount.findUnique({
        where: { id: parseInt(savings_account_id, 10) },
      });

      if (!account) {
        throw new Error('Savings account not found');
      }

      // We need to parse Decimal to float for comparison, or just compare directly.
      if (Number(account.balance) < amount) {
        throw new Error('Insufficient balance');
      }

      // 2. Create the transaction record
      const transaction = await tx.savingsTransaction.create({
        data: {
          savings_account_id: account.id,
          type: 'WITHDRAWAL',
          amount,
          recorded_by,
        },
      });

      // 3. Update balance
      const updatedAccount = await tx.savingsAccount.update({
        where: { id: account.id },
        data: {
          balance: { decrement: amount },
        },
      });

      // 4. Record in CashTransaction
      await tx.cashTransaction.create({
        data: {
          type: 'CASH_OUT',
          category: 'SAVINGS_WITHDRAWAL',
          amount,
          related_savings_id: account.id,
          recorded_by,
        },
      });

      return { transaction, updatedAccount };
    });

    await logActivity(req.user.id, req.user.name, 'SAVINGS_WITHDRAWN', 'SavingsAccount', result.updatedAccount.id, { amount });

    return res.status(201).json({ message: 'Withdrawal successful', data: result });
  } catch (err) {
    console.error('Withdraw error:', err);
    if (err.message === 'Insufficient balance' || err.message === 'Savings account not found') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getClientTransactions(req, res) {
  try {
    const { clientId } = req.params;
    
    // Find the savings account for this client
    const account = await prisma.savingsAccount.findUnique({
      where: { client_id: parseInt(clientId, 10) },
    });

    if (!account) {
      return res.status(404).json({ error: 'Savings account not found for this client.' });
    }

    const transactions = await prisma.savingsTransaction.findMany({
      where: { savings_account_id: account.id },
      orderBy: { transaction_date: 'desc' },
      include: {
        user: { select: { name: true } } // who recorded it
      }
    });

    return res.json({ account, transactions });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getAllSavings(req, res) {
  try {
    const { role, id, branch_id } = req.user;
    
    // Base filter: only ACTIVE clients
    let where = {
      client: {
        status: 'ACTIVE'
      }
    };

    // Role-based filtering
    if (role === 'FIELD_OFFICER') {
      where.client.group = { center: { field_officer_id: id } };
    } else if (role === 'BRANCH_MANAGER') {
      where.client.group = { center: { branch_id: branch_id } };
    }

    const savingsAccounts = await prisma.savingsAccount.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, phone: true }
        },
        transactions: {
          orderBy: { transaction_date: 'desc' },
          take: 1,
          select: { transaction_date: true }
        }
      },
      orderBy: { client: { name: 'asc' } }
    });

    res.json(savingsAccounts);
  } catch (err) {
    console.error('Error fetching all savings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { deposit, withdraw, getClientTransactions, getAllSavings };
