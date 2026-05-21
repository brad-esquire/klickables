-- Allow attributing a payment_event (esp. postage_cost) to a specific account.
-- When set, the money ledger pulls the outflow from that account instead of Stripe.

ALTER TABLE payment_events ADD COLUMN paid_from_account_id uuid REFERENCES money_accounts(id);
