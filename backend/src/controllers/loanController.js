const prisma = require('../utils/prisma');

async function createLoanApplication(req, res) {
  try {
    const { client_id, loan_product_id, principal_amount, interest_rate, term_weeks } = req.body;

    if (!client_id || !loan_product_id || !principal_amount) {
      return res.status(400).json({ error: 'client_id, loan_product_id, and principal_amount are required.' });
    }

    // Validate client exists
    const client = await prisma.client.findUnique({ where: { id: parseInt(client_id, 10) } });
    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    // Validate loan product exists and get defaults if missing
    const product = await prisma.loanProduct.findUnique({ where: { id: parseInt(loan_product_id, 10) } });
    if (!product) {
      return res.status(404).json({ error: 'Loan product not found.' });
    }

    const finalInterestRate = interest_rate !== undefined ? interest_rate : product.interest_rate;
    const finalTermWeeks = term_weeks !== undefined ? term_weeks : product.default_term_weeks;
    const interest_method = product.interest_method;

    const loan = await prisma.loan.create({
      data: {
        client_id: parseInt(client_id, 10),
        loan_product_id: parseInt(loan_product_id, 10),
        principal_amount,
        interest_rate: finalInterestRate,
        interest_method,
        term_weeks: finalTermWeeks,
        status: 'PENDING',
      },
    });

    return res.status(201).json({ message: 'Loan application created successfully', data: loan });
  } catch (err) {
    console.error('Error creating loan application:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function approveLoan(req, res) {
  try {
    const { id } = req.params;
    const approved_by = req.user.id; // comes from authMiddleware

    const loan = await prisma.loan.findUnique({ where: { id: parseInt(id, 10) } });
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    if (loan.status !== 'PENDING') {
      return res.status(400).json({ error: `Loan cannot be approved because it is currently ${loan.status}.` });
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loan.id },
      data: {
        status: 'APPROVED',
        approved_by,
      },
    });

    return res.json({ message: 'Loan approved successfully', data: updatedLoan });
  } catch (err) {
    console.error('Error approving loan:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getLoanById(req, res) {
  try {
    const { id } = req.params;
    const loan = await prisma.loan.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        client: true,
        loan_product: true,
        approver: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    return res.json(loan);
  } catch (err) {
    console.error('Error fetching loan:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { createLoanApplication, approveLoan, getLoanById };
