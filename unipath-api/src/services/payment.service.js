class PaymentService {
  /**
   * Démarre un paiement abstrait (mock par défaut).
   * Cette couche est conçue pour brancher un provider réel plus tard.
   */
  async initiatePayment({ applicationId, amount, currency = 'XOF', paymentType }) {
    const reference = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      provider: 'MOCK_PROVIDER',
      reference,
      amount,
      currency,
      paymentType,
      applicationId,
      checkoutUrl: null,
      status: 'PENDING',
    };
  }

  /**
   * Simule une confirmation de paiement réussie.
   */
  async confirmPaymentMock({ reference }) {
    return {
      reference,
      status: 'CONFIRMED',
      providerPayload: {
        mode: 'mock',
        confirmedAt: new Date().toISOString(),
      },
    };
  }
}

module.exports = new PaymentService();
