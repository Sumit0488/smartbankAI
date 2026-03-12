/**
 * bank.test.js — Jest unit tests for bank-management
 * Source: codegen/schemas/bank.schema.yaml
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Bank = require('./bank.model');
const bankService = require('./bank.service');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Bank.deleteMany({});
});

// Helper — create a bank quickly
const createBank = (overrides = {}) =>
  bankService.createBank({
    bank_name: 'Test Bank',
    minimum_balance: 5000,
    interest_rate: 3.0,
    forex_fee: 2.5,
    rating: 4.0,
    ...overrides,
  });

describe('BankService', () => {

  // ── Create ────────────────────────────────────────────────────────────────────
  test('should create a bank with auto-generated bank_id', async () => {
    const bank = await createBank({ bank_name: 'HDFC Bank' });
    expect(bank.bank_id).toBeDefined();
    expect(bank.bank_name).toBe('HDFC Bank');
    expect(bank.interest_rate).toBe(3.0);
  });

  test('should reject duplicate bank_name (case-insensitive)', async () => {
    await createBank({ bank_name: 'SBI' });
    await expect(createBank({ bank_name: 'sbi' })).rejects.toThrow();
  });

  test('should reject missing bank_name', async () => {
    await expect(
      bankService.createBank({ minimum_balance: 0 })
    ).rejects.toThrow();
  });

  test('should reject interest_rate above 20', async () => {
    await expect(
      createBank({ interest_rate: 25 })
    ).rejects.toThrow();
  });

  // ── Read ──────────────────────────────────────────────────────────────────────
  test('should get all banks sorted by name', async () => {
    await createBank({ bank_name: 'Kotak' });
    await createBank({ bank_name: 'HDFC Bank' });
    await createBank({ bank_name: 'Axis Bank' });

    const banks = await bankService.getAllBanks();
    expect(banks).toHaveLength(3);
    // Should be sorted alphabetically
    expect(banks[0].bank_name).toBe('Axis Bank');
  });

  test('should get bank by ID', async () => {
    const created = await createBank({ bank_name: 'ICICI Bank' });
    const found = await bankService.getBankById(created._id);
    expect(found.bank_name).toBe('ICICI Bank');
  });

  test('should throw for unknown ID', async () => {
    await expect(
      bankService.getBankById(new mongoose.Types.ObjectId())
    ).rejects.toThrow('Bank not found.');
  });

  // ── Search ────────────────────────────────────────────────────────────────────
  test('should search banks by name (case-insensitive)', async () => {
    await createBank({ bank_name: 'State Bank of India' });
    await createBank({ bank_name: 'HDFC Bank' });
    await createBank({ bank_name: 'Indian Bank' });

    // 'india' matches both 'State Bank of India' and 'Indian Bank'
    const results = await bankService.searchBanks('india');
    expect(results).toHaveLength(2);
  });

  test('should return empty array for no search matches', async () => {
    await createBank({ bank_name: 'SBI' });
    const results = await bankService.searchBanks('xyz_nonexistent');
    expect(results).toHaveLength(0);
  });

  // ── Compare ───────────────────────────────────────────────────────────────────
  test('should compare multiple banks by IDs', async () => {
    const b1 = await createBank({ bank_name: 'Bank A' });
    const b2 = await createBank({ bank_name: 'Bank B' });
    const b3 = await createBank({ bank_name: 'Bank C' });

    const result = await bankService.compareBanks([b1._id, b2._id, b3._id]);
    expect(result).toHaveLength(3);
  });

  test('should reject compare with fewer than 2 IDs', async () => {
    const b1 = await createBank({ bank_name: 'Solo Bank' });
    await expect(bankService.compareBanks([b1._id])).rejects.toThrow();
  });

  test('should reject compare with more than 5 IDs', async () => {
    const banks = await Promise.all(
      ['A','B','C','D','E','F'].map(n => createBank({ bank_name: `Bank ${n}` }))
    );
    await expect(
      bankService.compareBanks(banks.map(b => b._id))
    ).rejects.toThrow();
  });

  // ── Update ────────────────────────────────────────────────────────────────────
  test('should update bank fields', async () => {
    const bank = await createBank({ bank_name: 'Old Name Bank' });
    const updated = await bankService.updateBank(bank._id, { interest_rate: 4.5, rating: 4.8 });
    expect(updated.interest_rate).toBe(4.5);
    expect(updated.rating).toBe(4.8);
  });

  // ── Delete ────────────────────────────────────────────────────────────────────
  test('should delete a bank', async () => {
    const bank = await createBank({ bank_name: 'Temp Bank' });
    const result = await bankService.deleteBank(bank._id);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Temp Bank');
  });

  // ── Seed ─────────────────────────────────────────────────────────────────────
  test('should seed default banks', async () => {
    const result = await bankService.seedDefaultBanks();
    expect(result.seeded).toBe(6);
    const all = await bankService.getAllBanks();
    expect(all.some(b => b.bank_name === 'SBI')).toBe(true);
    expect(all.some(b => b.bank_name === 'HDFC Bank')).toBe(true);
  });

  test('should not re-seed if banks already exist', async () => {
    await bankService.seedDefaultBanks();
    const result = await bankService.seedDefaultBanks();
    expect(result.seeded).toBe(0);
  });

});
