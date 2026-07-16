export type Customer = {
  id: string;
  name: string;
  addressLine: string;
  postalCode: string;
  city: string;
  phone: string;
  defaultEggs: number;
  unitPriceCents: number | null;
  note: string;
  routeOrder: number;
  isActive: boolean;
};

export type AppSettings = {
  roundDay: number;
  roundTitle: string;
  defaultUnitPriceCents: number;
  startAddress: string;
  returnToStart: boolean;
};

export type RoundStatus = "planned" | "active" | "completed";

export type DeliveryRound = {
  id: string;
  roundDate: string;
  title: string;
  status: RoundStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  stopCount: number;
  deliveredCount: number;
};

export type DeliveryStop = {
  id: string;
  roundId: string;
  customerName: string;
  addressLine: string;
  postalCode: string;
  city: string;
  phone: string;
  eggs: number;
  unitPriceCents: number;
  note: string;
  routeOrder: number;
  deliveredAt: string | null;
};

export type RoundWithStops = DeliveryRound & { stops: DeliveryStop[] };

export type ActionState = { ok: boolean; message: string };

