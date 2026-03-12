/**
 * card.service.js — Card business logic
 * Source: codegen/schemas/card.schema.yaml
 *
 * Cards are ADMIN-managed global catalog data.
 * All users (including public) can read, search, and filter.
 * Card category enables AI Smart Card Advisor recommendations.
 */

const Card = require('./card.model');
const { UserInputError } = require('apollo-server-express');
const { createCardSchema, updateCardSchema, validate } = require('./card.validation');
const { v4: uuidv4 } = require('uuid');

class CardService {

  // ── Create Card (Admin) ──────────────────────────────────────────────────────
  async createCard(input) {
    const { error } = validate(input, createCardSchema);
    if (error) throw new UserInputError(error.details.map(d => d.message).join(', '));

    const existing = await Card.findOne({
      bank_name: { $regex: new RegExp(`^${input.bank_name}$`, 'i') },
      card_name: { $regex: new RegExp(`^${input.card_name}$`, 'i') },
    });
    if (existing) {
      throw new UserInputError(`Card "${input.card_name}" from "${input.bank_name}" already exists.`);
    }

    return Card.create({ ...input, card_id: uuidv4() });
  }

  // ── Get All Cards (Public) ───────────────────────────────────────────────────
  async getAllCards() {
    return Card.find({}).sort({ bank_name: 1, card_name: 1 });
  }

  // ── Get By ID (Public) ───────────────────────────────────────────────────────
  async getCardById(id) {
    const card = await Card.findById(id);
    if (!card) throw new UserInputError('Card not found.');
    return card;
  }

  // ── Get Cards By Bank (Public) ───────────────────────────────────────────────
  async getCardsByBank(bank_name) {
    return Card.find({
      bank_name: { $regex: bank_name, $options: 'i' },
    }).sort({ card_name: 1 });
  }

  // ── Get Cards By Type (Public) ───────────────────────────────────────────────
  async getCardsByType(card_type) {
    const valid = ['credit', 'debit', 'prepaid'];
    if (!valid.includes(card_type.toLowerCase())) {
      throw new UserInputError(`card_type must be one of: ${valid.join(', ')}`);
    }
    return Card.find({ card_type: card_type.toLowerCase() }).sort({ rating: -1 });
  }

  // ── Get Cards By Category — for AI Smart Card Advisor (Public) ───────────────
  async getCardsByCategory(card_category) {
    const valid = ['shopping', 'travel', 'fuel', 'lifestyle', 'business', 'student', 'basic'];
    if (!valid.includes(card_category.toLowerCase())) {
      throw new UserInputError(`card_category must be one of: ${valid.join(', ')}`);
    }
    return Card.find({ card_category: card_category.toLowerCase() }).sort({ rating: -1 });
  }

  // ── Search Cards (Public) ────────────────────────────────────────────────────
  async searchCards(query) {
    if (!query || query.trim().length < 1) {
      throw new UserInputError('Search query must not be empty.');
    }
    return Card.find({
      $or: [
        { card_name: { $regex: query, $options: 'i' } },
        { bank_name: { $regex: query, $options: 'i' } },
        { benefits: { $regex: query, $options: 'i' } },
      ],
    }).sort({ rating: -1 });
  }

  // ── Update Card (Admin) ──────────────────────────────────────────────────────
  async updateCard(id, input) {
    const { error } = validate(input, updateCardSchema);
    if (error) throw new UserInputError(error.details.map(d => d.message).join(', '));

    const card = await Card.findByIdAndUpdate(
      id, { $set: input }, { new: true, runValidators: true }
    );
    if (!card) throw new UserInputError('Card not found.');
    return card;
  }

  // ── Delete Card (Admin) ──────────────────────────────────────────────────────
  async deleteCard(id) {
    const card = await Card.findByIdAndDelete(id);
    if (!card) throw new UserInputError('Card not found.');
    return { success: true, message: `Card "${card.card_name}" by ${card.bank_name} deleted.` };
  }

  // ── Seed Default Cards (Dev utility) ─────────────────────────────────────────
  async seedDefaultCards() {
    const count = await Card.countDocuments();
    if (count > 0) return { seeded: 0, message: 'Cards already seeded.' };

    const defaults = [
      // HDFC
      { bank_name: 'HDFC Bank', card_name: 'HDFC Regalia', card_type: 'credit', annual_fee: 2500, joining_fee: 2500, cashback_rate: 4, benefits: 'Lounge Access,10X Rewards,Travel Insurance,Golf Access', card_category: 'lifestyle', rating: 4.7 },
      { bank_name: 'HDFC Bank', card_name: 'HDFC Millennia', card_type: 'credit', annual_fee: 1000, joining_fee: 1000, cashback_rate: 5, benefits: '5% Cashback Online,Amazon/Flipkart Offers,Free OTT', card_category: 'shopping', rating: 4.5 },
      { bank_name: 'HDFC Bank', card_name: 'HDFC MoneyBack', card_type: 'credit', annual_fee: 500, joining_fee: 500, cashback_rate: 2, benefits: '2X Points,Fuel Surcharge Waiver,EMI on Click', card_category: 'basic', rating: 3.9 },
      // SBI
      { bank_name: 'SBI', card_name: 'SBI SimplyCLICK', card_type: 'credit', annual_fee: 499, joining_fee: 499, cashback_rate: 10, benefits: '10X Points Online,Amazon Gift Voucher,Fuel Waiver', card_category: 'shopping', rating: 4.4 },
      { bank_name: 'SBI', card_name: 'SBI Elite', card_type: 'credit', annual_fee: 4999, joining_fee: 4999, cashback_rate: 5, benefits: 'Lounge Access,Trident Hotels,Travel Rewards', card_category: 'travel', rating: 4.6 },
      { bank_name: 'SBI', card_name: 'SBI Student Plus', card_type: 'credit', annual_fee: 0, joining_fee: 0, cashback_rate: 1, benefits: 'Zero Annual Fee,Low Income Eligibility,UPI Linked', card_category: 'student', rating: 4.0 },
      // ICICI Bank
      { bank_name: 'ICICI Bank', card_name: 'Amazon Pay ICICI', card_type: 'credit', annual_fee: 0, joining_fee: 0, cashback_rate: 5, benefits: '5% Back on Amazon,2% on Prime,1% Elsewhere,Lifetime Free', card_category: 'shopping', rating: 4.8 },
      { bank_name: 'ICICI Bank', card_name: 'ICICI Sapphiro', card_type: 'credit', annual_fee: 3500, joining_fee: 6500, cashback_rate: 4, benefits: 'Lounge Access,Golf,Travel Insurance,Concierge', card_category: 'lifestyle', rating: 4.5 },
      // Kotak Mahindra
      { bank_name: 'Kotak Mahindra', card_name: 'Kotak 811 Dream Different', card_type: 'credit', annual_fee: 0, joining_fee: 0, cashback_rate: 2, benefits: 'Lifetime Free,1% Cashback,No Min Spend', card_category: 'basic', rating: 4.2 },
      { bank_name: 'Kotak Mahindra', card_name: 'Kotak League Platinum', card_type: 'credit', annual_fee: 499, joining_fee: 499, cashback_rate: 8, benefits: '8X Points on Travel,Free Movie Tickets,Fuel Surcharge Waiver', card_category: 'travel', rating: 4.3 },
      // Axis Bank
      { bank_name: 'Axis Bank', card_name: 'Axis Flipkart', card_type: 'credit', annual_fee: 500, joining_fee: 500, cashback_rate: 5, benefits: '5% Cashback Flipkart,4% Myntra,1.5% Everywhere', card_category: 'shopping', rating: 4.4 },
      { bank_name: 'Axis Bank', card_name: 'Axis Magnus', card_type: 'credit', annual_fee: 10000, joining_fee: 10000, cashback_rate: 6, benefits: '35 Reward Points/₹200,Luxury Lounge,Travel Benefits,Concierge', card_category: 'lifestyle', rating: 4.6 },
    ];

    const created = await Card.insertMany(
      defaults.map(c => ({ ...c, card_id: uuidv4() }))
    );
    return { seeded: created.length, message: `${created.length} cards seeded successfully.` };
  }
}

module.exports = new CardService();
