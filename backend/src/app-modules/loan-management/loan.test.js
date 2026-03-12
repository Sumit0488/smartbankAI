/**
 * loan.test.js — Jest unit tests for loan-management
 * Source: codegen/schemas/loan.schema.yaml
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Loan = require('./loan.model');
const loanService = require('./loan.service');

let mongoServer;

const mockUser = { id: 'user-loan-001', email: 'user@test.com', name: 'Loan Tester', role: 'USER' };
const mockAdmin = { id: 'admin-001', email: 'admin@test.com', name: 'Admin', role: 'ADMIN' };
const otherUser = { id: 'user-other-002', email: 'other@test.com', name: 'Other', role: 'USER' };

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Loan.deleteMany({});
});

describe('LoanService', () => {

  const validInput = {
    loan_type: 'personal',
    loan_amount: 100000,
    interest_rate: 12,
    tenure: 24,
    bank_name: 'HDFC',
  };

  // ── EMI Calculator ────────────────────────────────────────────────────────────
  test('should calculate EMI correctly for standard loan', async () => {
    // ₹1,00,000 @ 12% p.a. for 24 months — expected EMI ≈ ₹4,707
    const result = await loanService.getLoanEMI(100000, 12, 24);
    expect(result.emi).toBeCloseTo(4707, 0);
    expect(result.totalPayable).toBeCloseTo(result.emi * 24, 0);
    expect(result.totalInterest).toBeCloseTo(result.totalPayable - 100000, 0);
  });

  test('should calculate EMI correctly for 0% interest rate', async () => {
    const result = await loanService.getLoanEMI(120000, 0, 12);
    expect(result.emi).toBe(10000);
    expect(result.totalInterest).toBe(0);
  });

  // ── Apply Loan ────────────────────────────────────────────────────────────────
  test('should apply a loan and auto-compute EMI fields', async () => {
    const loan = await loanService.applyLoan(validInput, mockUser);
    expect(loan.loan_id).toBeDefined();
    expect(loan.user_id).toBe(mockUser.id);
    expect(loan.status).toBe('pending');
    expect(loan.emi).toBeGreaterThan(0);
    expect(loan.total_payable).toBeGreaterThan(loan.loan_amount);
    expect(loan.total_interest).toBeGreaterThan(0);
  });

  test('should reject loan with amount below minimum', async () => {
    await expect(
      loanService.applyLoan({ ...validInput, loan_amount: 500 }, mockUser)
    ).rejects.toThrow();
  });

  test('should reject loan with invalid loan_type', async () => {
    await expect(
      loanService.applyLoan({ ...validInput, loan_type: 'crypto' }, mockUser)
    ).rejects.toThrow();
  });

  // ── Read ──────────────────────────────────────────────────────────────────────
  test('should return only current user\'s loans', async () => {
    await loanService.applyLoan(validInput, mockUser);
    await loanService.applyLoan({ ...validInput, loan_type: 'home' }, otherUser);

    const loans = await loanService.getMyLoans(mockUser);
    expect(loans).toHaveLength(1);
    expect(loans[0].user_id).toBe(mockUser.id);
  });

  test('should filter loans by status', async () => {
    await loanService.applyLoan(validInput, mockUser);
    const pending = await loanService.getLoansByStatus(mockUser.id, 'pending');
    expect(pending).toHaveLength(1);
    expect(pending[0].status).toBe('pending');
    const approved = await loanService.getLoansByStatus(mockUser.id, 'approved');
    expect(approved).toHaveLength(0);
  });

  // ── Update ────────────────────────────────────────────────────────────────────
  test('should update loan and recompute EMI', async () => {
    const loan = await loanService.applyLoan(validInput, mockUser);
    const oldEMI = loan.emi;
    const updated = await loanService.updateLoan(loan._id, { tenure: 36 }, mockUser);
    // Longer tenure → lower EMI
    expect(updated.emi).toBeLessThan(oldEMI);
  });

  test('should not update another user\'s loan', async () => {
    const loan = await loanService.applyLoan(validInput, mockUser);
    await expect(
      loanService.updateLoan(loan._id, { bank_name: 'SBI' }, otherUser)
    ).rejects.toThrow();
  });

  // ── Status Update (Admin) ─────────────────────────────────────────────────────
  test('admin should approve a loan', async () => {
    const loan = await loanService.applyLoan(validInput, mockUser);
    const updated = await loanService.updateLoanStatus(loan._id, 'approved');
    expect(updated.status).toBe('approved');
  });

  test('should reject invalid status transition', async () => {
    await expect(
      loanService.updateLoanStatus(new mongoose.Types.ObjectId(), 'flying')
    ).rejects.toThrow();
  });

  // ── Delete ────────────────────────────────────────────────────────────────────
  test('should withdraw a pending loan', async () => {
    const loan = await loanService.applyLoan(validInput, mockUser);
    const result = await loanService.deleteLoan(loan._id, mockUser);
    expect(result.success).toBe(true);
  });

  test('should not withdraw an approved loan', async () => {
    const loan = await loanService.applyLoan(validInput, mockUser);
    await loanService.updateLoanStatus(loan._id, 'approved');
    await expect(loanService.deleteLoan(loan._id, mockUser)).rejects.toThrow();
  });

  test('admin can delete any pending loan', async () => {
    const loan = await loanService.applyLoan(validInput, mockUser);
    const result = await loanService.deleteLoan(loan._id, mockAdmin);
    expect(result.success).toBe(true);
  });

});
