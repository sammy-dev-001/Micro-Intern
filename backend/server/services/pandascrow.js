const crypto = require('crypto');
const axios = require('axios');

class MockPandascrowClient {
  constructor() {
    this.escrows = new Map();
  }

  async createEscrow({ amountKobo, currency = 'NGN', businessAccountId }) {
    const escrowId = `pse_mock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const data = {
      escrowId,
      amountKobo,
      currency,
      businessAccountId,
      status: 'pending_funding',
      createdAt: new Date().toISOString()
    };
    this.escrows.set(escrowId, data);
    return { escrowId, ...data };
  }

  async releaseEscrow({ escrowId, talentAccountId, amountKobo }) {
    const transactionRef = `pst_mock_rel_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const existing = this.escrows.get(escrowId) || {};
    this.escrows.set(escrowId, {
      ...existing,
      status: 'released',
      talentAccountId,
      amountKobo,
      transactionRef,
      releasedAt: new Date().toISOString()
    });
    return { transactionRef, escrowId, status: 'released' };
  }

  async refundEscrow({ escrowId, reason = 'business_cancelled' }) {
    const transactionRef = `pst_mock_ref_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const existing = this.escrows.get(escrowId) || {};
    this.escrows.set(escrowId, {
      ...existing,
      status: 'refunded',
      reason,
      transactionRef,
      refundedAt: new Date().toISOString()
    });
    return { transactionRef, escrowId, status: 'refunded' };
  }

  async getEscrow({ escrowId }) {
    if (this.escrows.has(escrowId)) {
      return this.escrows.get(escrowId);
    }
    return {
      escrowId,
      status: 'pending_funding'
    };
  }
}

class RealPandascrowClient {
  constructor() {
    this.apiUrl = process.env.PANDASCROW_API_URL || 'https://api.pandascrow.com/v1';
    this.secretKey = process.env.PANDASCROW_SECRET_KEY || '';
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async createEscrow({ amountKobo, currency = 'NGN', businessAccountId }) {
    const response = await axios.post(
      `${this.apiUrl}/escrows`,
      {
        amount: amountKobo,
        currency,
        payer_account_id: businessAccountId
      },
      { headers: this.getHeaders() }
    );
    return {
      escrowId: response.data?.data?.id || response.data?.escrow_id,
      ...response.data
    };
  }

  async releaseEscrow({ escrowId, talentAccountId, amountKobo }) {
    const response = await axios.post(
      `${this.apiUrl}/escrows/${escrowId}/release`,
      {
        recipient_account_id: talentAccountId,
        amount: amountKobo
      },
      { headers: this.getHeaders() }
    );
    return {
      transactionRef: response.data?.data?.transaction_ref || response.data?.reference,
      ...response.data
    };
  }

  async refundEscrow({ escrowId, reason }) {
    const response = await axios.post(
      `${this.apiUrl}/escrows/${escrowId}/refund`,
      { reason },
      { headers: this.getHeaders() }
    );
    return {
      transactionRef: response.data?.data?.transaction_ref || response.data?.reference,
      ...response.data
    };
  }

  async getEscrow({ escrowId }) {
    const response = await axios.get(
      `${this.apiUrl}/escrows/${escrowId}`,
      { headers: this.getHeaders() }
    );
    return response.data?.data || response.data;
  }
}

function verifyWebhookSignature(payloadString, signatureHeader) {
  const secret = process.env.PANDASCROW_WEBHOOK_SECRET || 'mock_webhook_secret_key_12345';
  if (!signatureHeader) {
    return false;
  }
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(typeof payloadString === 'string' ? payloadString : JSON.stringify(payloadString))
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signatureHeader, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch (err) {
    // If lengths differ or error occurs
    return false;
  }
}

const isReal = process.env.PANDASCROW_MODE === 'real';
const client = isReal ? new RealPandascrowClient() : new MockPandascrowClient();

module.exports = {
  pandascrow: client,
  verifyWebhookSignature,
  MockPandascrowClient,
  RealPandascrowClient
};
