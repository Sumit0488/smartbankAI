/**
 * card.test.js — Jest unit tests for card-management
 * Source: codegen/schemas/card.schema.yaml
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Card = require('./card.model');
const cardService = require('./card.service');

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
  await Card.deleteMany({});
});

// Helper — create a card quickly
const makeCard = (overrides = {}) =>
  cardService.createCard({
    bank_name: 'HDFC Bank',
    card_name: 'HDFC Test Card',
    card_type: 'credit',
    annual_fee: 1000,
    cashback_rate: 3,
    card_category: 'shopping',
    rating: 4.0,
    ...overrides,
  });

describe('CardService', () => {

  // ── Create ────────────────────────────────────────────────────────────────────
  test('should create a card with auto-generated card_id', async () => {
    const card = await makeCard({ card_name: 'Regalia' });
    expect(card.card_id).toBeDefined();
    expect(card.bank_name).toBe('HDFC Bank');
    expect(card.card_name).toBe('Regalia');
  });

  test('should reject duplicate bank_name + card_name pair', async () => {
    await makeCard({ bank_name: 'SBI', card_name: 'SimplyCLICK' });
    await expect(
      makeCard({ bank_name: 'SBI', card_name: 'SimplyCLICK' })
    ).rejects.toThrow();
  });

  test('should allow same card_name from different banks', async () => {
    await makeCard({ bank_name: 'SBI', card_name: 'Platinum Card' });
    const card2 = await makeCard({ bank_name: 'HDFC Bank', card_name: 'Platinum Card' });
    expect(card2.bank_name).toBe('HDFC Bank');
  });

  test('should reject missing bank_name', async () => {
    await expect(
      cardService.createCard({ card_name: 'Test' })
    ).rejects.toThrow();
  });

  test('should reject cashback_rate above 100', async () => {
    await expect(makeCard({ cashback_rate: 150 })).rejects.toThrow();
  });

  test('should reject invalid card_category', async () => {
    await expect(makeCard({ card_category: 'crypto' })).rejects.toThrow();
  });

  // ── Read ──────────────────────────────────────────────────────────────────────
  test('should get all cards sorted by bank then card name', async () => {
    await makeCard({ bank_name: 'SBI', card_name: 'Elite' });
    await makeCard({ bank_name: 'HDFC Bank', card_name: 'Regalia' });
    await makeCard({ bank_name: 'HDFC Bank', card_name: 'Millennia' });

    const cards = await cardService.getAllCards();
    expect(cards).toHaveLength(3);
    expect(cards[0].bank_name).toBe('HDFC Bank');
    expect(cards[0].card_name).toBe('Millennia'); // sorted within bank
  });

  test('should get card by ID', async () => {
    const created = await makeCard({ card_name: 'UniqueCard' });
    const found = await cardService.getCardById(created._id);
    expect(found.card_name).toBe('UniqueCard');
  });

  // ── Filter By Bank ────────────────────────────────────────────────────────────
  test('should filter cards by bank name (case-insensitive)', async () => {
    await makeCard({ bank_name: 'HDFC Bank', card_name: 'Card A' });
    await makeCard({ bank_name: 'SBI', card_name: 'Card B' });
    await makeCard({ bank_name: 'HDFC Bank', card_name: 'Card C' });

    const results = await cardService.getCardsByBank('hdfc');
    expect(results).toHaveLength(2);
    results.forEach(c => expect(c.bank_name).toBe('HDFC Bank'));
  });

  // ── Filter By Type ────────────────────────────────────────────────────────────
  test('should filter cards by type', async () => {
    await makeCard({ card_type: 'credit', card_name: 'Credit One' });
    await makeCard({ card_type: 'debit', card_name: 'Debit One' });
    await makeCard({ card_type: 'credit', card_name: 'Credit Two' });

    const credits = await cardService.getCardsByType('credit');
    expect(credits).toHaveLength(2);
    credits.forEach(c => expect(c.card_type).toBe('credit'));
  });

  test('should reject invalid card_type filter', async () => {
    await expect(cardService.getCardsByType('loyalty')).rejects.toThrow();
  });

  // ── Filter By Category (AI Advisor) ──────────────────────────────────────────
  test('should get cards by category sorted by rating desc', async () => {
    await makeCard({ card_category: 'travel', card_name: 'Travel A', rating: 3.5 });
    await makeCard({ card_category: 'travel', card_name: 'Travel B', rating: 4.8 });
    await makeCard({ card_category: 'shopping', card_name: 'Shop A' });

    const travel = await cardService.getCardsByCategory('travel');
    expect(travel).toHaveLength(2);
    expect(travel[0].rating).toBe(4.8); // highest rated first
  });

  test('should reject invalid card_category filter', async () => {
    await expect(cardService.getCardsByCategory('gaming')).rejects.toThrow();
  });

  // ── Search ────────────────────────────────────────────────────────────────────
  test('should search across card_name, bank_name, and benefits', async () => {
    await makeCard({ card_name: 'Amazon Pay Card', bank_name: 'ICICI Bank' });
    await makeCard({ card_name: 'Regalia', bank_name: 'HDFC Bank', benefits: 'Amazon Gift Voucher' });
    await makeCard({ card_name: 'Elite', bank_name: 'SBI' });

    const results = await cardService.searchCards('amazon');
    expect(results).toHaveLength(2); // matches card_name and benefits
  });

  // ── Update ────────────────────────────────────────────────────────────────────
  test('should update card fields', async () => {
    const card = await makeCard();
    const updated = await cardService.updateCard(card._id, { annual_fee: 2500, rating: 4.8 });
    expect(updated.annual_fee).toBe(2500);
    expect(updated.rating).toBe(4.8);
  });

  // ── Delete ────────────────────────────────────────────────────────────────────
  test('should delete a card', async () => {
    const card = await makeCard({ card_name: 'Temp Card' });
    const result = await cardService.deleteCard(card._id);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Temp Card');
  });

  // ── Seed ─────────────────────────────────────────────────────────────────────
  test('should seed 12 default cards', async () => {
    const result = await cardService.seedDefaultCards();
    expect(result.seeded).toBe(12);
    const all = await cardService.getAllCards();
    expect(all.some(c => c.card_name === 'Amazon Pay ICICI')).toBe(true);
    expect(all.some(c => c.card_name === 'HDFC Regalia')).toBe(true);
  });

  test('should not re-seed if cards already exist', async () => {
    await cardService.seedDefaultCards();
    const result = await cardService.seedDefaultCards();
    expect(result.seeded).toBe(0);
  });

});
