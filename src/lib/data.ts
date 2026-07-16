import "server-only";

import { getSql } from "./db";
import type { AppSettings, Customer, DeliveryRound, DeliveryStop, RoundWithStops } from "./types";

type Row = Record<string, unknown>;

function stringValue(value: unknown) {
  return value == null ? "" : String(value);
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapCustomer(row: Row): Customer {
  return {
    id: stringValue(row.id),
    name: stringValue(row.name),
    addressLine: stringValue(row.address_line),
    postalCode: stringValue(row.postal_code),
    city: stringValue(row.city),
    phone: stringValue(row.phone),
    defaultEggs: numberValue(row.default_eggs),
    unitPriceCents: row.unit_price_cents == null ? null : numberValue(row.unit_price_cents),
    note: stringValue(row.note),
    routeOrder: numberValue(row.route_order),
    isActive: Boolean(row.is_active),
  };
}

function mapRound(row: Row): DeliveryRound {
  return {
    id: stringValue(row.id),
    roundDate: stringValue(row.round_date),
    title: stringValue(row.title),
    status: row.status as DeliveryRound["status"],
    createdAt: stringValue(row.created_at),
    startedAt: row.started_at == null ? null : stringValue(row.started_at),
    completedAt: row.completed_at == null ? null : stringValue(row.completed_at),
    stopCount: numberValue(row.stop_count),
    deliveredCount: numberValue(row.delivered_count),
  };
}

function mapStop(row: Row): DeliveryStop {
  return {
    id: stringValue(row.id),
    roundId: stringValue(row.round_id),
    customerName: stringValue(row.customer_name),
    addressLine: stringValue(row.address_line),
    postalCode: stringValue(row.postal_code),
    city: stringValue(row.city),
    phone: stringValue(row.phone),
    eggs: numberValue(row.eggs),
    unitPriceCents: numberValue(row.unit_price_cents),
    note: stringValue(row.note),
    routeOrder: numberValue(row.route_order),
    deliveredAt: row.delivered_at == null ? null : stringValue(row.delivered_at),
  };
}

const ROUND_SELECT = `
  SELECT
    r.id::text,
    r.round_date::text,
    r.title,
    r.status,
    r.created_at::text,
    r.started_at::text,
    r.completed_at::text,
    count(s.id)::int AS stop_count,
    count(s.delivered_at)::int AS delivered_count
  FROM delivery_rounds r
  LEFT JOIN delivery_stops s ON s.round_id = r.id
`;

export async function getSettings(): Promise<AppSettings> {
  const sql = getSql();
  const rows = (await sql`
    SELECT round_day, round_title, default_unit_price_cents, start_address, return_to_start
    FROM app_settings WHERE id = 1
  `) as Row[];
  const row = rows[0];
  if (!row) throw new Error("Instellingen ontbreken.");
  return {
    roundDay: numberValue(row.round_day),
    roundTitle: stringValue(row.round_title),
    defaultUnitPriceCents: numberValue(row.default_unit_price_cents),
    startAddress: stringValue(row.start_address),
    returnToStart: Boolean(row.return_to_start),
  };
}

export async function getCustomers(): Promise<Customer[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id::text, name, address_line, postal_code, city, phone, default_eggs,
      unit_price_cents, note, route_order, is_active
    FROM customers
    ORDER BY is_active DESC, route_order, name, id
  `) as Row[];
  return rows.map(mapCustomer);
}

async function getStops(roundId: string): Promise<DeliveryStop[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id::text, round_id::text, customer_name, address_line, postal_code, city,
      phone, eggs, unit_price_cents, note, route_order, delivered_at::text
    FROM delivery_stops
    WHERE round_id = ${roundId}
    ORDER BY route_order, id
  `) as Row[];
  return rows.map(mapStop);
}

export async function getCurrentRound(): Promise<RoundWithStops | null> {
  const sql = getSql();
  const rows = (await sql.query(`${ROUND_SELECT}
    WHERE r.status IN ('active', 'planned')
    GROUP BY r.id
    ORDER BY CASE r.status WHEN 'active' THEN 0 ELSE 1 END, r.round_date, r.id
    LIMIT 1
  `)) as Row[];
  if (!rows[0]) return null;
  const round = mapRound(rows[0]);
  return { ...round, stops: await getStops(round.id) };
}

export async function getRounds(): Promise<DeliveryRound[]> {
  const sql = getSql();
  const rows = (await sql.query(`${ROUND_SELECT}
    GROUP BY r.id
    ORDER BY CASE r.status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END,
      r.round_date DESC, r.id DESC
  `)) as Row[];
  return rows.map(mapRound);
}

export async function getRound(roundId: string): Promise<RoundWithStops | null> {
  const sql = getSql();
  const rows = (await sql.query(`${ROUND_SELECT}
    WHERE r.id = $1
    GROUP BY r.id
  `, [roundId])) as Row[];
  if (!rows[0]) return null;
  const round = mapRound(rows[0]);
  return { ...round, stops: await getStops(round.id) };
}

