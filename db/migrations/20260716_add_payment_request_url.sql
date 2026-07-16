ALTER TABLE delivery_stops
  ADD COLUMN IF NOT EXISTS payment_request_url text;
