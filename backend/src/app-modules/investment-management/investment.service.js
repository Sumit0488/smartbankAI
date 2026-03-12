/**
 * investment.service.js — Investment business logic
 * Source: codegen/schemas/investment.schema.yaml
 */

const Investment = require('./investment.model');
const { UserInputError, ForbiddenError } = require('apollo-server-express');
const { addInvestmentSchema, updateInvestmentSchema, validate } = require('./investment.validation');
const { v4: uuidv4 } = require('uuid');

class InvestmentService {

  // ── Add Investment ───────────────────────────────────────────────────────────
  async addInvestment(input, currentUser) {
    // Validate input BEFORE injecting user_id (Joi rejects unknown fields)
    const { error } = validate(input, addInvestmentSchema);
    if (error) throw new UserInputError(error.details.map(d => d.message).join(', '));

    const data = { ...input, user_id: currentUser.id };

    // Default current_value = invested amount when first added
    if (data.current_value === undefined) {
      data.current_value = data.amount;
    }

    // Default invested_at to today
    if (!data.invested_at) {
      data.invested_at = new Date();
    }

    const investment = await Investment.create({
      ...data,
      investment_id: uuidv4(),
    });

    return investment;
  }

  // ── Get My Investments ───────────────────────────────────────────────────────
  async getMyInvestments(currentUser) {
    return Investment.find({ user_id: currentUser.id }).sort({ createdAt: -1 });
  }

  // ── Get Investments By Type ──────────────────────────────────────────────────
  async getInvestmentsByType(userId, investment_type) {
    return Investment.find({ user_id: userId, investment_type }).sort({ createdAt: -1 });
  }

  // ── Portfolio Summary ────────────────────────────────────────────────────────
  async getPortfolioSummary(currentUser) {
    const investments = await Investment.find({
      user_id: currentUser.id,
      status: 'active',
    });

    const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
    const currentValue = investments.reduce((sum, i) => sum + (i.current_value || i.amount), 0);
    const totalReturn = currentValue - totalInvested;
    const returnPct = totalInvested > 0
      ? parseFloat(((totalReturn / totalInvested) * 100).toFixed(2))
      : 0;

    // Breakdown by type
    const byType = investments.reduce((acc, i) => {
      if (!acc[i.investment_type]) acc[i.investment_type] = { count: 0, invested: 0, currentValue: 0 };
      acc[i.investment_type].count += 1;
      acc[i.investment_type].invested += i.amount;
      acc[i.investment_type].currentValue += i.current_value || i.amount;
      return acc;
    }, {});

    return {
      totalInvested,
      currentValue,
      totalReturn,
      returnPercentage: returnPct,
      activeCount: investments.length,
      byType: JSON.stringify(byType), // GraphQL String field for flexible structure
    };
  }

  // ── Get All Investments (Admin) ──────────────────────────────────────────────
  async getAllInvestments() {
    return Investment.find({}).sort({ createdAt: -1 });
  }

  // ── Update Investment ────────────────────────────────────────────────────────
  async updateInvestment(id, input, currentUser) {
    const { error } = validate(input, updateInvestmentSchema);
    if (error) throw new UserInputError(error.details.map(d => d.message).join(', '));

    const investment = await Investment.findById(id);
    if (!investment) throw new UserInputError('Investment not found.');
    if (investment.user_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('You can only update your own investments.');
    }

    return Investment.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true });
  }

  // ── Delete Investment ────────────────────────────────────────────────────────
  async deleteInvestment(id, currentUser) {
    const investment = await Investment.findById(id);
    if (!investment) throw new UserInputError('Investment not found.');
    if (investment.user_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('You can only delete your own investments.');
    }

    await Investment.findByIdAndDelete(id);
    return { success: true, message: 'Investment deleted successfully.' };
  }
}

module.exports = new InvestmentService();
