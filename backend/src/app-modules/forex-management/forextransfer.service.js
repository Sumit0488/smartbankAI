/**
 * forexTransfer.service.js — Forex transfer business logic
 * Source: codegen/schemas/forex.schema.yaml
 *
 * Live rate fetching uses ExchangeRate-API (v6).
 * Set FOREX_API_KEY in backend/.env to enable real rates.
 * Falls back gracefully when API key is absent (test/dev mode).
 */

const ForexTransfer = require('./forextransfer.model');
const { sendForexConfirmation } = require('../../shared/notification');
const { UserInputError, ForbiddenError } = require('apollo-server-express');
const { initiateTransferSchema, updateStatusSchema, validate } = require('./forextransfer.validation');
const { v4: uuidv4 } = require('uuid');

// ── Live Rate Fetcher ─────────────────────────────────────────────────────────

/**
 * Fetch real-time exchange rate from ExchangeRate-API.
 * Falls back to null if API key is not configured.
 * @param {string} from — source currency (e.g. 'INR')
 * @param {string} to   — target currency (e.g. 'USD')
 * @returns {{ from, to, rate } | null}
 */
const fetchLiveRate = async (from, to) => {
  const apiKey = process.env.FOREX_API_KEY;
  const baseUrl = process.env.FOREX_API_URL || 'https://v6.exchangerate-api.com/v6';

  if (!apiKey) {
    // Dev/test fallback: return a static mock rate
    console.warn('[Forex] FOREX_API_KEY not set — using mock exchange rate.');
    const mockRates = {
      'INR_USD': 0.012, 'INR_EUR': 0.011, 'INR_GBP': 0.0095,
      'USD_INR': 83.5,  'EUR_INR': 90.2,  'GBP_INR': 105.4,
      'USD_EUR': 0.92,  'EUR_USD': 1.09,  'USD_GBP': 0.79,
    };
    const key = `${from}_${to}`;
    const rate = mockRates[key] ?? 1.0;
    return { from, to, rate };
  }

  try {
    const res = await fetch(`${baseUrl}/${apiKey}/pair/${from}/${to}`);
    if (!res.ok) throw new Error(`ExchangeRate API responded ${res.status}`);
    const data = await res.json();
    if (data.result !== 'success') throw new Error(data['error-type'] || 'API error');
    return { from, to, rate: data.conversion_rate };
  } catch (err) {
    throw new UserInputError(`Could not fetch exchange rate: ${err.message}`);
  }
};

// ── Service ───────────────────────────────────────────────────────────────────

class ForexTransferService {

  // ── Initiate Transfer ────────────────────────────────────────────────────────
  async initiateTransfer(input, currentUser) {
    const { error } = validate(input, initiateTransferSchema);
    if (error) throw new UserInputError(error.details.map(d => d.message).join(', '));

    if (input.from_currency.toUpperCase() === input.to_currency.toUpperCase()) {
      throw new UserInputError('Source and target currencies must be different.');
    }

    // Auto-compute converted amount
    const converted_amount = parseFloat(
      (input.amount * input.exchange_rate).toFixed(6)
    );

    const transfer = await ForexTransfer.create({
      ...input,
      from_currency: input.from_currency.toUpperCase(),
      to_currency: input.to_currency.toUpperCase(),
      user_id: currentUser.id,
      transfer_id: uuidv4(),
      converted_amount,
      status: 'initiated',
      transferred_at: new Date(),
    });

    // Fire ForexTransferCompleted notification (non-blocking)
    sendForexConfirmation({
      to: currentUser.email,
      name: currentUser.name || currentUser.email,
      fromAmount: input.amount,
      fromCurrency: input.from_currency.toUpperCase(),
      toAmount: converted_amount,
      toCurrency: input.to_currency.toUpperCase(),
    }).catch(err => console.error('[Notification] ForexAlert failed:', err.message));

    return transfer;
  }

  // ── Live Rate Query (no DB write) ─────────────────────────────────────────────
  async getLiveRate(from_currency, to_currency) {
    if (!from_currency || from_currency.length !== 3) {
      throw new UserInputError('from_currency must be a 3-letter ISO code.');
    }
    if (!to_currency || to_currency.length !== 3) {
      throw new UserInputError('to_currency must be a 3-letter ISO code.');
    }
    if (from_currency.toUpperCase() === to_currency.toUpperCase()) {
      throw new UserInputError('Source and target currencies must be different.');
    }
    return fetchLiveRate(from_currency.toUpperCase(), to_currency.toUpperCase());
  }

  // ── Get My Transfers ─────────────────────────────────────────────────────────
  async getMyTransfers(currentUser) {
    return ForexTransfer.find({ user_id: currentUser.id }).sort({ createdAt: -1 });
  }

  // ── Get Transfers By Status ──────────────────────────────────────────────────
  async getTransfersByStatus(userId, status) {
    return ForexTransfer.find({ user_id: userId, status }).sort({ createdAt: -1 });
  }

  // ── Get All Transfers (Admin) ────────────────────────────────────────────────
  async getAllTransfers() {
    return ForexTransfer.find({}).sort({ createdAt: -1 });
  }

  // ── Cancel Transfer ───────────────────────────────────────────────────────────
  async cancelTransfer(id, currentUser) {
    const transfer = await ForexTransfer.findById(id);
    if (!transfer) throw new UserInputError('Transfer not found.');
    if (transfer.user_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('You can only cancel your own transfers.');
    }
    if (transfer.status !== 'initiated') {
      throw new UserInputError('Only initiated transfers can be cancelled.');
    }

    return ForexTransfer.findByIdAndUpdate(
      id, { $set: { status: 'cancelled' } }, { new: true }
    );
  }

  // ── Update Transfer Status (Admin) ────────────────────────────────────────────
  async updateTransferStatus(id, status) {
    const { error } = validate({ status }, updateStatusSchema);
    if (error) throw new UserInputError(error.details[0].message);

    const transfer = await ForexTransfer.findByIdAndUpdate(
      id, { $set: { status } }, { new: true }
    );
    if (!transfer) throw new UserInputError('Transfer not found.');
    return transfer;
  }
}

module.exports = new ForexTransferService();
