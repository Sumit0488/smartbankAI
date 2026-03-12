/**
 * bank.service.js — Bank business logic
 * Source: codegen/schemas/bank.schema.yaml
 *
 * Banks are ADMIN-managed global data.
 * All users (including public) can read and search.
 */

const Bank = require('./bank.model');
const { UserInputError } = require('apollo-server-express');
const { createBankSchema, updateBankSchema, validate } = require('./bank.validation');
const { v4: uuidv4 } = require('uuid');

class BankService {

  // ── Create Bank (Admin) ──────────────────────────────────────────────────────
  async createBank(input) {
    const { error } = validate(input, createBankSchema);
    if (error) throw new UserInputError(error.details.map(d => d.message).join(', '));

    const existing = await Bank.findOne({
      bank_name: { $regex: new RegExp(`^${input.bank_name}$`, 'i') },
    });
    if (existing) throw new UserInputError(`Bank "${input.bank_name}" already exists.`);

    return Bank.create({ ...input, bank_id: uuidv4() });
  }

  // ── Get All Banks (Public) ───────────────────────────────────────────────────
  async getAllBanks() {
    return Bank.find({}).sort({ bank_name: 1 });
  }

  // ── Get By ID (Public) ───────────────────────────────────────────────────────
  async getBankById(id) {
    const bank = await Bank.findById(id);
    if (!bank) throw new UserInputError('Bank not found.');
    return bank;
  }

  // ── Search Banks by Name (Public) ─────────────────────────────────────────────
  async searchBanks(query) {
    if (!query || query.trim().length < 1) {
      throw new UserInputError('Search query must not be empty.');
    }
    return Bank.find({
      bank_name: { $regex: query, $options: 'i' },
    }).sort({ bank_name: 1 });
  }

  // ── Compare Banks (Public) ────────────────────────────────────────────────────
  async compareBanks(ids) {
    if (!ids || ids.length < 2) {
      throw new UserInputError('Provide at least 2 bank IDs to compare.');
    }
    if (ids.length > 5) {
      throw new UserInputError('You can compare at most 5 banks at once.');
    }

    const banks = await Bank.find({ _id: { $in: ids } });
    if (banks.length < 2) {
      throw new UserInputError('Could not find enough banks with the provided IDs.');
    }
    return banks;
  }

  // ── Update Bank (Admin) ──────────────────────────────────────────────────────
  async updateBank(id, input) {
    const { error } = validate(input, updateBankSchema);
    if (error) throw new UserInputError(error.details.map(d => d.message).join(', '));

    const bank = await Bank.findByIdAndUpdate(
      id, { $set: input }, { new: true, runValidators: true }
    );
    if (!bank) throw new UserInputError('Bank not found.');
    return bank;
  }

  // ── Delete Bank (Admin) ──────────────────────────────────────────────────────
  async deleteBank(id) {
    const bank = await Bank.findByIdAndDelete(id);
    if (!bank) throw new UserInputError('Bank not found.');
    return { success: true, message: `Bank "${bank.bank_name}" deleted.` };
  }

  // ── Seed Default Banks (Dev utility) ─────────────────────────────────────────
  async seedDefaultBanks() {
    const count = await Bank.countDocuments();
    if (count > 0) return { seeded: 0, message: 'Banks already seeded.' };

    const defaults = [
      { bank_name: 'SBI', minimum_balance: 0, interest_rate: 2.7, forex_fee: 3.5,
        account_types: 'Savings,Current,Salary', features: 'Zero Balance,YONO App,UPI,Net Banking', rating: 4.0 },
      { bank_name: 'HDFC Bank', minimum_balance: 10000, interest_rate: 3.0, forex_fee: 2.5,
        account_types: 'Savings,Current,Salary,NRI', features: 'SmartWealth,Net Banking,UPI,Debit Card', rating: 4.5 },
      { bank_name: 'ICICI Bank', minimum_balance: 10000, interest_rate: 3.0, forex_fee: 2.5,
        account_types: 'Savings,Current,Salary', features: 'iMobile,UPI,Net Banking,Debit Card', rating: 4.3 },
      { bank_name: 'Kotak Mahindra', minimum_balance: 0, interest_rate: 3.5, forex_fee: 2.0,
        account_types: 'Savings,Current,811 Zero Balance', features: 'Kotak App,UPI,Zero Balance,Net Banking', rating: 4.4 },
      { bank_name: 'Axis Bank', minimum_balance: 10000, interest_rate: 3.0, forex_fee: 2.75,
        account_types: 'Savings,Current,Salary', features: 'Mobile Banking,UPI,Debit Card,Net Banking', rating: 4.2 },
      { bank_name: 'Canara Bank', minimum_balance: 1000, interest_rate: 2.9, forex_fee: 3.0,
        account_types: 'Savings,Current,Salary', features: 'Net Banking,UPI,Mobile Banking', rating: 3.8 },
    ];

    const created = await Bank.insertMany(
      defaults.map(b => ({ ...b, bank_id: uuidv4() }))
    );
    return { seeded: created.length, message: `${created.length} banks seeded successfully.` };
  }
}

module.exports = new BankService();
