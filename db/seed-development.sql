UPDATE app_settings
SET
  round_day = 6,
  round_title = 'Ronde van zaterdag',
  default_unit_price_cents = 30,
  start_address = 'Dorpsplein 1, 1234 AB Voorbeeldstad',
  return_to_start = true,
  updated_at = now()
WHERE id = 1;

INSERT INTO customers (
  name,
  address_line,
  postal_code,
  city,
  phone,
  default_eggs,
  unit_price_cents,
  note,
  route_order,
  address_key
)
VALUES
  ('Familie De Vries', 'Molenstraat 12', '1234 AB', 'Voorbeeldstad', NULL, 10, NULL, NULL, 1, 'molenstraat12|1234ab'),
  ('Mevrouw Jansen', 'Kerklaan 8', '1234 AC', 'Voorbeeldstad', NULL, 6, 35, 'Aanbellen bij de zijdeur', 2, 'kerklaan8|1234ac'),
  ('Bakkerij Het Haantje', 'Marktplein 3', '1234 AD', 'Voorbeeldstad', NULL, 20, 28, NULL, 3, 'marktplein3|1234ad'),
  ('Familie Smit', 'Lindelaan 27', '1234 AE', 'Voorbeeldstad', NULL, 12, NULL, NULL, 4, 'lindelaan27|1234ae'),
  ('Meneer Van Dijk', 'Schoolstraat 5', '1234 AF', 'Voorbeeldstad', NULL, 10, NULL, 'Doosje bij de voordeur', 5, 'schoolstraat5|1234af');
