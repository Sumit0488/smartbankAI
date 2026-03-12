/**
 * loan.service.js — Loan business logic with EMI calculator
 * Source: codegen/schemas/loan.schema.yaml
 */

const Loan = require('./loan.model');
const { sendLoanAlert } = require('../../shared/notification');
const { UserInputError, ForbiddenError } = require('apollo-server-express');
const { applyLoanSchema, updateLoanSchema, updateStatusSchema, validate } = require('./loan.validation');
const { v4: uuidv4 } = require('uuid');

// ── EMI Calculator (standard reducing-balance formula) ────────────────────────
/**
 * Calculate monthly EMI.
 * Formula: EMI = P × r × (1+r)^n / ((1+r)^n − 1)
 * @param {number} principal     — loan amount in INR
 * @param {number} annualRate    — annual interest rate in %
 * @param {number} tenureMonths  — tenure in months
 * @returns {{ emi, totalPayable, totalInterest }}
 */
const calculateEMI = (principal, annualRate, tenureMonths) => {
  if (annualRate === 0) {
    const emi = parseFloat((principal / tenureMonths).toFixed(2));
    return { emi, totalPayable: principal, totalInterest: 0 };
  }

  const r = annualRate / (12 * 100); // monthly interest rate
  const n = tenureMonths;
  const emi = parseFloat(
    (principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)).toFixed(2)
  );
  const totalPayable = parseFloat((emi * n).toFixed(2));
  const totalInterest = parseFloat((totalPayable - principal).toFixed(2));

  return { emi, totalPayable, totalInterest };
};

class LoanService {

  // ── Apply Loan ───────────────────────────────────────────────────────────────
  async applyLoan(input, currentUser) {
    const { error } = validate(input, applyLoanSchema);
    if (error) throw new UserInputError(error.details.map(d => d.message).join(', '));

    // Auto-compute EMI figures
    const { emi, totalPayable, totalInterest } = calculateEMI(
      input.loan_amount,
      input.interest_rate,
      input.tenure
    );

    const loan = await Loan.create({
      ...input,
      user_id: currentUser.id,
      loan_id: uuidv4(),
      emi,
      total_payable: totalPayable,
      total_interest: totalInterest,
      status: 'pending',
      applied_at: new Date(),
    });

    // Fire LoanApplied email notification (non-blocking)
    sendLoanAlert({
      to: currentUser.email,
      name: currentUser.name || currentUser.email,
      loanType: input.loan_type,
      amount: input.loan_amount,
    }).catch(err => console.error('[Notification] LoanAlert failed:', err.message));

    return loan;
  }

  // ── Get My Loans ─────────────────────────────────────────────────────────────
  async getMyLoans(currentUser) {
    return Loan.find({ user_id: currentUser.id }).sort({ createdAt: -1 });
  }

  // ── Get Loans By Status ───────────────────────────────────────────────────────
  async getLoansByStatus(userId, status) {
    return Loan.find({ user_id: userId, status }).sort({ createdAt: -1 });
  }

  // ── EMI Query (no DB write — pure calculation) ────────────────────────────────
  async getLoanEMI(loan_amount, interest_rate, tenure) {
    if (!loan_amount || loan_amount < 1) throw new UserInputError('Invalid loan amount.');
    if (interest_rate < 0 || interest_rate > 100) throw new UserInputError('Interest rate must be between 0 and 100.');
    if (tenure < 1) throw new UserInputError('Tenure must be at least 1 month.');

    return calculateEMI(loan_amount, interest_rate, tenure);
  }

  // ── Get All Loans (Admin) ─────────────────────────────────────────────────────
  async getAllLoans() {
    return Loan.find({}).sort({ createdAt: -1 });
  }

  // ── Update Loan ───────────────────────────────────────────────────────────────
  async updateLoan(id, input, currentUser) {
    const { error } = validate(input, updateLoanSchema);
    if (error) throw new UserInputError(error.details.map(d => d.message).join(', '));

    const loan = await Loan.findById(id);
    if (!loan) throw new UserInputError('Loan not found.');
    if (loan.user_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('You can only update your own loans.');
    }
    if (loan.status !== 'pending') {
      throw new UserInputError('Only pending loan applications can be updated.');
    }

    // Recompute EMI if financial fields changed
    const newAmount = input.loan_amount ?? loan.loan_amount;
    const newRate = input.interest_rate ?? loan.interest_rate;
    const newTenure = input.tenure ?? loan.tenure;
    const { emi, totalPayable, totalInterest } = calculateEMI(newAmount, newRate, newTenure);

    return Loan.findByIdAndUpdate(
      id,
      { $set: { ...input, emi, total_payable: totalPayable, total_interest: totalInterest } },
      { new: true, runValidators: true }
    );
  }

  // ── Update Loan Status (Admin) ────────────────────────────────────────────────
  async updateLoanStatus(id, status) {
    const { error } = validate({ status }, updateStatusSchema);
    if (error) throw new UserInputError(error.details[0].message);

    const loan = await Loan.findByIdAndUpdate(
      id, { $set: { status } }, { new: true }
    );
    if (!loan) throw new UserInputError('Loan not found.');
    return loan;
  }

  // ── Delete Loan ───────────────────────────────────────────────────────────────
  async deleteLoan(id, currentUser) {
    const loan = await Loan.findById(id);
    if (!loan) throw new UserInputError('Loan not found.');
    if (loan.user_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('You can only withdraw your own loan applications.');
    }
    if (loan.status !== 'pending') {
      throw new UserInputError('Only pending loan applications can be withdrawn.');
    }

    await Loan.findByIdAndDelete(id);
    return { success: true, message: 'Loan application withdrawn successfully.' };
  }
}

module.exports = new LoanService();
