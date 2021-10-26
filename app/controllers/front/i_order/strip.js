webhook obj {
  id: 'evt_3JoqcEJIPg2MUXJX04Fk4no1',
  object: 'event',
  api_version: '2020-08-27',
  created: 1635258422,
  data: {
    object: {
      id: 'pi_3JoqcEJIPg2MUXJX09tnLgQO',
      object: 'payment_intent',
      amount: 2335,
      amount_capturable: 0,
      amount_received: 0,
      application: null,
      application_fee_amount: null,
      canceled_at: null,
      cancellation_reason: null,
      capture_method: 'automatic',
      charges: [Object],
      client_secret: 'pi_3JoqcEJIPg2MUXJX09tnLgQO_secret_wdiEZglVVJUJIVondCqPVCw2K',
      confirmation_method: 'automatic',
      created: 1635258422,
      currency: 'eur',
      customer: null,
      description: null,
      invoice: null,
      last_payment_error: null,
      livemode: false,
      metadata: {},
      next_action: null,
      on_behalf_of: null,
      payment_method: null,
      payment_method_options: [Object],
      payment_method_types: [Array],
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      source: null,
      statement_descriptor: null,
      statement_descriptor_suffix: null,
      status: 'requires_payment_method',
      transfer_data: null,
      transfer_group: null
    }
  },
  livemode: false,
  pending_webhooks: 2,
  request: {
    id: 'req_jHTeTB61pfAuKd',
    idempotency_key: 'fd3ca5a3-da9b-4e5f-8872-60bc1adba006'
  },
  type: 'payment_intent.created'
}


















webhook obj {
  id: 'evt_1JoqceJIPg2MUXJXDmibqRSL',
  object: 'event',
  api_version: '2020-08-27',
  created: 1635258446,
  data: {
    object: {
      id: 'cus_KToFNf0rLQWdl7',
      object: 'customer',
      address: [Object],
      balance: 0,
      created: 1635258446,
      currency: null,
      default_source: null,
      delinquent: false,
      description: null,
      discount: null,
      email: 'test@test.com',
      invoice_prefix: '91FC5522',
      invoice_settings: [Object],
      livemode: false,
      metadata: {},
      name: '424',
      phone: null,
      preferred_locales: [],
      shipping: null,
      tax_exempt: 'none'
    }
  },
  livemode: false,
  pending_webhooks: 2,
  request: {
    id: 'req_Ftnu5fA8rcUADv',
    idempotency_key: '6b934d1a-c49f-4658-989e-91f6c17aad4c'
  },
  type: 'customer.created'
}


webhook obj {
  id: 'evt_3JoqcEJIPg2MUXJX0mSEf2EA',
  object: 'event',
  api_version: '2020-08-27',
  created: 1635258447,
  data: {
    object: {
      id: 'pi_3JoqcEJIPg2MUXJX09tnLgQO',
      object: 'payment_intent',
      amount: 2335,
      amount_capturable: 0,
      amount_received: 2335,
      application: null,
      application_fee_amount: null,
      canceled_at: null,
      cancellation_reason: null,
      capture_method: 'automatic',
      charges: [Object],
      client_secret: 'pi_3JoqcEJIPg2MUXJX09tnLgQO_secret_wdiEZglVVJUJIVondCqPVCw2K',
      confirmation_method: 'automatic',
      created: 1635258422,
      currency: 'eur',
      customer: 'cus_KToFNf0rLQWdl7',
      description: null,
      invoice: null,
      last_payment_error: null,
      livemode: false,
      metadata: {},
      next_action: null,
      on_behalf_of: null,
      payment_method: 'pm_1JoqcbJIPg2MUXJXPzBfzaKi',
      payment_method_options: [Object],
      payment_method_types: [Array],
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      source: null,
      statement_descriptor: null,
      statement_descriptor_suffix: null,
      status: 'succeeded',
      transfer_data: null,
      transfer_group: null
    }
  },
  livemode: false,
  pending_webhooks: 2,
  request: {
    id: 'req_Ftnu5fA8rcUADv',
    idempotency_key: '6b934d1a-c49f-4658-989e-91f6c17aad4c'
  },
  type: 'payment_intent.succeeded'
}


webhook obj {
  id: 'evt_3JoqcEJIPg2MUXJX08xXilz8',
  object: 'event',
  api_version: '2020-08-27',
  created: 1635258447,
  data: {
    object: {
      id: 'ch_3JoqcEJIPg2MUXJX0VD0kShC',
      object: 'charge',
      amount: 2335,
      amount_captured: 2335,
      amount_refunded: 0,
      application: null,
      application_fee: null,
      application_fee_amount: null,
      balance_transaction: 'txn_3JoqcEJIPg2MUXJX0tyGpPbl',
      billing_details: [Object],
      calculated_statement_descriptor: 'UNIONCITYITALY.COM',
      captured: true,
      created: 1635258447,
      currency: 'eur',
      customer: 'cus_KToFNf0rLQWdl7',
      description: null,
      destination: null,
      dispute: null,
      disputed: false,
      failure_code: null,
      failure_message: null,
      fraud_details: {},
      invoice: null,
      livemode: false,
      metadata: {},
      on_behalf_of: null,
      order: null,
      outcome: [Object],
      paid: true,
      payment_intent: 'pi_3JoqcEJIPg2MUXJX09tnLgQO',
      payment_method: 'pm_1JoqcbJIPg2MUXJXPzBfzaKi',
      payment_method_details: [Object],
      receipt_email: null,
      receipt_number: null,
      receipt_url: 'https://pay.stripe.com/receipts/acct_1JdFdAJIPg2MUXJX/ch_3JoqcEJIPg2MUXJX0VD0kShC/rcpt_KToFiCCA3A3rm54MotvfIg9Uosp7LTK',
      refunded: false,
      refunds: [Object],
      review: null,
      shipping: null,
      source: null,
      source_transfer: null,
      statement_descriptor: null,
      statement_descriptor_suffix: null,
      status: 'succeeded',
      transfer_data: null,
      transfer_group: null
    }
  },
  livemode: false,
  pending_webhooks: 2,
  request: {
    id: 'req_Ftnu5fA8rcUADv',
    idempotency_key: '6b934d1a-c49f-4658-989e-91f6c17aad4c'
  },
  type: 'charge.succeeded'
}


webhook obj {
  id: 'evt_1JoqceJIPg2MUXJXpEgme4Ek',
  object: 'event',
  api_version: '2020-08-27',
  created: 1635258448,
  data: {
    object: {
      id: 'cs_test_b1Li3avp5OC2FMuAb3Af6duCpoRHXukXFwDaMYqKZtmuF9D60WM80cGUW8',
      object: 'checkout.session',
      after_expiration: null,
      allow_promotion_codes: null,
      amount_subtotal: 2335,
      amount_total: 2335,
      automatic_tax: [Object],
      billing_address_collection: null,
      cancel_url: 'https://localhost:3000/cancel.html',
      client_reference_id: null,
      consent: null,
      consent_collection: null,
      currency: 'eur',
      customer: 'cus_KToFNf0rLQWdl7',
      customer_details: [Object],
      customer_email: null,
      expires_at: 1635344821,
      livemode: false,
      locale: null,
      metadata: {},
      mode: 'payment',
      payment_intent: 'pi_3JoqcEJIPg2MUXJX09tnLgQO',
      payment_method_options: {},
      payment_method_types: [Array],
      payment_status: 'paid',
      phone_number_collection: [Object],
      recovered_from: null,
      setup_intent: null,
      shipping: null,
      shipping_address_collection: null,
      submit_type: null,
      subscription: null,
      success_url: 'https://localhost:3000/city/MI',
      total_details: [Object],
      url: null
    }
  },
  livemode: false,
  pending_webhooks: 2,
  request: { id: null, idempotency_key: null },
  type: 'checkout.session.completed'
}
