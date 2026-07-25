/**
 * Generate Loan Installment Schedule
 * @param {Object} loan - The loan object
 * @param {number} loan.principal_amount
 * @param {number} loan.interest_rate (e.g. 10 for 10%)
 * @param {string} loan.interest_method ('FLAT' or 'REDUCING')
 * @param {number} loan.term_weeks
 * @param {Date|string} loan.disbursement_date
 * @returns {Array} Array of installment objects
 */
function generateInstallmentSchedule(loan) {
  const { principal_amount, interest_rate, interest_method, term_weeks, disbursement_date } = loan;
  
  const principal = parseFloat(principal_amount);
  const rate = parseFloat(interest_rate) / 100; // convert percentage to decimal (e.g., 0.10)
  const weeks = parseInt(term_weeks, 10);
  const startDate = new Date(disbursement_date);
  
  const schedule = [];
  let remainingPrincipal = principal;
  
  if (interest_method === 'FLAT') {
    // Flat Rate Method Calculation
    // Total Interest = Principal * Rate * (Term in Years)
    const totalInterest = principal * rate * (weeks / 52);
    let remainingInterest = totalInterest;
    
    const principalPerWeek = principal / weeks;
    const interestPerWeek = totalInterest / weeks;
    
    for (let i = 1; i <= weeks; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + (i * 7)); // Add 7 days per installment
      
      let pDue = Math.round(principalPerWeek * 100) / 100;
      let iDue = Math.round(interestPerWeek * 100) / 100;
      
      // Adjust the final installment to consume exactly any remaining principal and interest
      if (i === weeks) {
        pDue = Math.round(remainingPrincipal * 100) / 100;
        iDue = Math.round(remainingInterest * 100) / 100;
      }
      
      schedule.push({
        installment_number: i,
        due_date: dueDate,
        principal_due: pDue,
        interest_due: iDue,
        total_due: Math.round((pDue + iDue) * 100) / 100
      });
      
      remainingPrincipal -= pDue;
      remainingInterest -= iDue;
    }
    
  } else if (interest_method === 'REDUCING') {
    // Reducing Balance (Standard Amortization) Method Calculation
    const r = rate / 52; // Weekly interest rate
    
    // Fixed Payment Formula: P = Principal * r * (1+r)^n / ((1+r)^n - 1)
    const fixedPayment = (principal * r * Math.pow(1 + r, weeks)) / (Math.pow(1 + r, weeks) - 1);
    const totalInterest = (fixedPayment * weeks) - principal;
    let remainingInterest = totalInterest;
    
    for (let i = 1; i <= weeks; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + (i * 7));
      
      let interestForWeek = remainingPrincipal * r;
      let principalForWeek = fixedPayment - interestForWeek;
      
      let pDue = Math.round(principalForWeek * 100) / 100;
      let iDue = Math.round(interestForWeek * 100) / 100;
      
      // On the final week, ensure exact payoff of the remaining balance and interest
      if (i === weeks) {
        pDue = Math.round(remainingPrincipal * 100) / 100;
        iDue = Math.round(remainingInterest * 100) / 100;
      }
      
      schedule.push({
        installment_number: i,
        due_date: dueDate,
        principal_due: pDue,
        interest_due: iDue,
        total_due: Math.round((pDue + iDue) * 100) / 100
      });
      
      remainingPrincipal -= pDue;
      remainingInterest -= iDue;
    }
  } else {
    throw new Error(`Unsupported interest method: ${interest_method}`);
  }
  
  return schedule;
}

module.exports = {
  generateInstallmentSchedule
};
