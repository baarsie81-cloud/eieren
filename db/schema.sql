CREATE TABLE IF NOT EXISTS app_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  round_day smallint NOT NULL DEFAULT 6 CHECK (round_day BETWEEN 0 AND 6),
  round_title text NOT NULL DEFAULT 'Ronde van zaterdag',
  default_unit_price_cents integer NOT NULL DEFAULT 30 CHECK (default_unit_price_cents >= 0),
  start_address text NOT NULL DEFAULT '',
  return_to_start boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS customers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  address_line text NOT NULL,
  postal_code text NOT NULL,
  city text NOT NULL,
  phone text,
  default_eggs integer NOT NULL DEFAULT 10 CHECK (default_eggs > 0),
  unit_price_cents integer CHECK (unit_price_cents IS NULL OR unit_price_cents >= 0),
  note text,
  route_order integer NOT NULL DEFAULT 0 CHECK (route_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  address_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customers_active_route_idx
  ON customers (is_active DESC, route_order, name);
CREATE INDEX IF NOT EXISTS customers_address_key_idx
  ON customers (address_key);

CREATE TABLE IF NOT EXISTS delivery_rounds (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  round_date date NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'active', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS delivery_rounds_one_active_idx
  ON delivery_rounds ((1)) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS delivery_rounds_date_idx
  ON delivery_rounds (round_date DESC, id DESC);

CREATE TABLE IF NOT EXISTS delivery_stops (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  round_id bigint NOT NULL REFERENCES delivery_rounds(id) ON DELETE CASCADE,
  customer_id bigint REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  address_line text NOT NULL,
  postal_code text NOT NULL,
  city text NOT NULL,
  phone text,
  eggs integer NOT NULL CHECK (eggs > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  note text,
  route_order integer NOT NULL CHECK (route_order >= 0),
  delivered_at timestamptz,
  payment_request_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, customer_id)
);

ALTER TABLE delivery_stops
  ADD COLUMN IF NOT EXISTS payment_request_url text;

CREATE INDEX IF NOT EXISTS delivery_stops_round_route_idx
  ON delivery_stops (round_id, route_order, id);
