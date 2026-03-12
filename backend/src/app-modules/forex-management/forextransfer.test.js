/**
 * forexTransfer.test.js — Jest unit tests for forex-management
 * Source: codegen/schemas/forex.schema.yaml
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ForexTransfer = require('./forextransfer.model');
const forexService = require('./forextransfer.service');

let mongoServer;

const mockUser  = { id: 'user-fx-001', email: 'fx@test.com', name: 'FX Trader', role: 'USER' };
const mockAdmin = { id: 'admin-001',   email: 'admin@test.com', name: 'Admin',   role: 'ADMIN' };
const otherUser = { id: 'user-fx-002', email: 'other@test.com', name: 'Other',   role: 'USER' };

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await ForexTransfer.deleteMany({});
});

describe('ForexTransferService', () => {

  const validInput = {
    amount: 10000,          // ₹10,000 INR
    from_currency: 'INR',
    to_currency: 'USD',
    exchange_rate: 0.012,   // 1 INR = 0.012 USD
  };

  // ── Initiate Transfer ─────────────────────────────────────────────────────────
  test('should initiate a forex transfer and auto-compute converted_amount', async () => {
    const transfer = await forexService.initiateTransfer(validInput, mockUser);
    expect(transfer.transfer_id).toBeDefined();
    expect(transfer.user_id).toBe(mockUser.id);
    expect(transfer.status).toBe('initiated');
    expect(transfer.converted_amount).toBeCloseTo(10000 * 0.012, 4); // ≈ 120 USD
  });

  test('converted_amount = amount × exchange_rate', async () => {
    const input = { amount: 50000, from_currency: 'INR', to_currency: 'EUR', exchange_rate: 0.011 };
    const transfer = await forexService.initiateTransfer(input, mockUser);
    expect(transfer.converted_amount).toBeCloseTo(50000 * 0.011, 4);
  });

  test('should reject same-currency transfers', async () => {
    await expect(
      forexService.initiateTransfer({ ...validInput, to_currency: 'INR' }, mockUser)
    ).rejects.toThrow();
  });

  test('should reject amount below minimum', async () => {
    await expect(
      forexService.initiateTransfer({ ...validInput, amount: 0 }, mockUser)
    ).rejects.toThrow();
  });

  test('should uppercase currency codes automatically', async () => {
    const transfer = await forexService.initiateTransfer(
      { ...validInput, from_currency: 'inr', to_currency: 'usd' }, mockUser
    );
    expect(transfer.from_currency).toBe('INR');
    expect(transfer.to_currency).toBe('USD');
  });

  // ── Live Rate Query ───────────────────────────────────────────────────────────
  test('should return a live rate for valid currency pair', async () => {
    const result = await forexService.getLiveRate('INR', 'USD');
    expect(result.from).toBe('INR');
    expect(result.to).toBe('USD');
    expect(result.rate).toBeGreaterThan(0);
  });

  test('should reject same-currency live rate query', async () => {
    await expect(forexService.getLiveRate('USD', 'USD')).rejects.toThrow();
  });

  test('should reject invalid currency code length', async () => {
    await expect(forexService.getLiveRate('USDT', 'INR')).rejects.toThrow();
  });

  // ── Read ──────────────────────────────────────────────────────────────────────
  test('should return only the current user\'s transfers', async () => {
    await forexService.initiateTransfer(validInput, mockUser);
    await forexService.initiateTransfer(
      { ...validInput, from_currency: 'USD', to_currency: 'EUR' }, otherUser
    );
    const transfers = await forexService.getMyTransfers(mockUser);
    expect(transfers).toHaveLength(1);
    expect(transfers[0].user_id).toBe(mockUser.id);
  });

  test('should filter transfers by status', async () => {
    await forexService.initiateTransfer(validInput, mockUser);
    const initiated = await forexService.getTransfersByStatus(mockUser.id, 'initiated');
    expect(initiated).toHaveLength(1);
    const cancelled = await forexService.getTransfersByStatus(mockUser.id, 'cancelled');
    expect(cancelled).toHaveLength(0);
  });

  // ── Cancel ────────────────────────────────────────────────────────────────────
  test('should cancel an initiated transfer', async () => {
    const transfer = await forexService.initiateTransfer(validInput, mockUser);
    const cancelled = await forexService.cancelTransfer(transfer._id, mockUser);
    expect(cancelled.status).toBe('cancelled');
  });

  test('should not cancel another user\'s transfer', async () => {
    const transfer = await forexService.initiateTransfer(validInput, mockUser);
    await expect(forexService.cancelTransfer(transfer._id, otherUser)).rejects.toThrow();
  });

  test('should not cancel an already completed transfer', async () => {
    const transfer = await forexService.initiateTransfer(validInput, mockUser);
    await forexService.updateTransferStatus(transfer._id, 'completed');
    await expect(forexService.cancelTransfer(transfer._id, mockUser)).rejects.toThrow();
  });

  // ── Admin Status Update ───────────────────────────────────────────────────────
  test('admin should mark a transfer as completed', async () => {
    const transfer = await forexService.initiateTransfer(validInput, mockUser);
    const updated = await forexService.updateTransferStatus(transfer._id, 'completed');
    expect(updated.status).toBe('completed');
  });

  test('admin should reject invalid status value', async () => {
    const transfer = await forexService.initiateTransfer(validInput, mockUser);
    await expect(
      forexService.updateTransferStatus(transfer._id, 'wired')
    ).rejects.toThrow();
  });

});
