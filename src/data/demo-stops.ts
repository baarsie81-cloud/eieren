export type DeliveryStop = {
  id: number;
  customer: string;
  address: string;
  eggs: number;
  amount: number;
  note?: string;
};

export const demoStops: DeliveryStop[] = [
  { id: 1, customer: "Fam. de Vries", address: "Zonnelaan 12", eggs: 3, amount: 1.2 },
  { id: 2, customer: "Fam. Jansen", address: "Molenpad 7", eggs: 2, amount: 0.8 },
  {
    id: 3,
    customer: "Fam. van Dijk",
    address: "Klaverdreef 21",
    eggs: 3,
    amount: 1.2,
    note: "Doosje terug meenemen",
  },
  { id: 4, customer: "Fam. Bakker", address: "Regenboogstraat 4", eggs: 4, amount: 1.6 },
  { id: 5, customer: "Fam. Meijer", address: "Sterrenhof 9", eggs: 2, amount: 0.8 },
  { id: 6, customer: "Fam. Smit", address: "Vlinderweg 18", eggs: 4, amount: 1.6 },
  { id: 7, customer: "Fam. Groen", address: "Lentepad 3", eggs: 3, amount: 1.2 },
  { id: 8, customer: "Fam. Visser", address: "Wolkenlaan 26", eggs: 3, amount: 1.2 },
];
