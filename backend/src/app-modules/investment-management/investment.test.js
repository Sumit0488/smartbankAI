/**
 * investment.test.js — Jest unit tests for investment-management
 * Source: codegen/schemas/investment.schema.yaml
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Investment = require('./investment.model');
const investmentService = require('./investment.service');

let mongoServer;

const mockUser = { id: 'user-001', email: 'investor@test.com', name: 'Test Investor', role: 'USER' };
const mockAdmin = { id: 'admin-999', email: 'admin@test.com', name: 'Admin', role: 'ADMIN' };
const otherUser = { id: 'user-002', email: 'other@test.com', name: 'Other', role: 'USER' };

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Investment.deleteMany({});
});

describe('InvestmentService', () => {

  const validInput = {
    investment_type: 'mutual_fund',
    amount: 50000,
    expected_return: 12,
  };

  // ── Add ──────────────────────────────────────────────────────────────────────
  test('should add investment with user_id from context', async () => {
    const inv = await investmentService.addInvestment(validInput, mockUser);
    expect(inv.investment_id).toBeDefined();
    expect(inv.user_id).toBe(mockUser.id);
    expect(inv.investment_type).toBe('mutual_fund');
    expect(inv.amount).toBe(50000);
  });

  test('should default current_value to amount if not provided', async () => {
    const inv = await investmentService.addInvestment(validInput, mockUser);
    expect(inv.current_value).toBe(50000);
  });

  test('should default invested_at to today', async () => {
    const inv = await investmentService.addInvestment(validInput, mockUser);
    expect(inv.invested_at).toBeDefined();
  });

  test('should reject investment with amount less than 1', async () => {
    await expect(
      investmentService.addInvestment({ ...validInput, amount: 0 }, mockUser)
    ).rejects.toThrow();
  });

  test('should reject invalid investment_type', async () => {
    await expect(
      investmentService.addInvestment({ ...validInput, investment_type: 'crypto' }, mockUser)
    ).rejects.toThrow();
  });

  // ── Read ─────────────────────────────────────────────────────────────────────
  test('should return only the current user\'s investments', async () => {
    await investmentService.addInvestment(validInput, mockUser);
    await investmentService.addInvestment({ investment_type: 'stock', amount: 10000 }, otherUser);

    const results = await investmentService.getMyInvestments(mockUser);
    expect(results).toHaveLength(1);
    expect(results[0].user_id).toBe(mockUser.id);
  });

  test('should filter investments by type', async () => {
    await investmentService.addInvestment({ investment_type: 'stock', amount: 20000 }, mockUser);
    await investmentService.addInvestment({ investment_type: 'fixed_deposit', amount: 100000 }, mockUser);

    const stocks = await investmentService.getInvestmentsByType(mockUser.id, 'stock');
    expect(stocks).toHaveLength(1);
    expect(stocks[0].investment_type).toBe('stock');
  });

  // ── Portfolio Summary ─────────────────────────────────────────────────────────
  test('should compute portfolio summary correctly', async () => {
    await investmentService.addInvestment({ investment_type: 'stock', amount: 10000, current_value: 12000 }, mockUser);
    await investmentService.addInvestment({ investment_type: 'mutual_fund', amount: 20000, current_value: 22000 }, mockUser);

    const summary = await investmentService.getPortfolioSummary(mockUser);
    expect(summary.totalInvested).toBe(30000);
    expect(summary.currentValue).toBe(34000);
    expect(summary.totalReturn).toBe(4000);
    expect(summary.returnPercentage).toBeCloseTo(13.33, 1);
    expect(summary.activeCount).toBe(2);
  });

  test('portfolio summary should return zero for empty portfolio', async () => {
    const summary = await investmentService.getPortfolioSummary(mockUser);
    expect(summary.totalInvested).toBe(0);
    expect(summary.returnPercentage).toBe(0);
  });

  // ── Update ───────────────────────────────────────────────────────────────────
  test('should update own investment', async () => {
    const inv = await investmentService.addInvestment(validInput, mockUser);
    const updated = await investmentService.updateInvestment(inv._id, { current_value: 60000 }, mockUser);
    expect(updated.current_value).toBe(60000);
  });

  test('should not allow updating another user\'s investment', async () => {
    const inv = await investmentService.addInvestment(validInput, mockUser);
    await expect(
      investmentService.updateInvestment(inv._id, { amount: 999 }, otherUser)
    ).rejects.toThrow();
  });

  test('admin can update any investment', async () => {
    const inv = await investmentService.addInvestment(validInput, mockUser);
    const updated = await investmentService.updateInvestment(inv._id, { status: 'closed' }, mockAdmin);
    expect(updated.status).toBe('closed');
  });

  // ── Delete ───────────────────────────────────────────────────────────────────
  test('should delete own investment', async () => {
    const inv = await investmentService.addInvestment(validInput, mockUser);
    const result = await investmentService.deleteInvestment(inv._id, mockUser);
    expect(result.success).toBe(true);
  });

  test('admin can delete any investment', async () => {
    const inv = await investmentService.addInvestment(validInput, mockUser);
    const result = await investmentService.deleteInvestment(inv._id, mockAdmin);
    expect(result.success).toBe(true);
  });

});
