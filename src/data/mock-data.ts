export interface Submission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  missionId: string;
  missionName: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  purchaseDate: string;
  storeName: string;
  totalAmount: number;
  rejectionReason?: string;
  ocrData: {
    detectedStore: string;
    detectedAmount: number;
    detectedDate: string;
    items: { name: string; price: number }[];
    confidence: number;
  };
}

export interface Mission {
  id: string;
  name: string;
  pointsMode: "fixed" | "amount_based";
  pointsReward: number;
  pointsPerEuro: number;
  minAmount: number;
  validityDays: number;
  maxTicketsPerUser: number;
  allowedStores: string[];
}

export const mockMissions: Mission[] = [
  {
    id: "mission-1",
    name: "Achat Lessive Eco",
    pointsMode: "amount_based",
    pointsReward: 50,
    pointsPerEuro: 10,
    minAmount: 5,
    validityDays: 30,
    maxTicketsPerUser: 3,
    allowedStores: ["Carrefour", "Auchan", "Leclerc", "Intermarché"],
  },
  {
    id: "mission-2",
    name: "Produits Bio Frais",
    pointsMode: "fixed",
    pointsReward: 100,
    pointsPerEuro: 1,
    minAmount: 10,
    validityDays: 14,
    maxTicketsPerUser: 2,
    allowedStores: ["Biocoop", "Naturalia", "Carrefour Bio"],
  },
  {
    id: "mission-3",
    name: "Snacks & Boissons",
    pointsMode: "amount_based",
    pointsReward: 30,
    pointsPerEuro: 5,
    minAmount: 3,
    validityDays: 21,
    maxTicketsPerUser: 5,
    allowedStores: ["Monoprix", "Franprix", "Carrefour", "Casino"],
  },
  {
    id: "mission-4",
    name: "Hygiène & Beauté",
    pointsMode: "fixed",
    pointsReward: 75,
    pointsPerEuro: 1,
    minAmount: 8,
    validityDays: 30,
    maxTicketsPerUser: 4,
    allowedStores: ["Sephora", "Marionnaud", "Monoprix", "Leclerc"],
  },
];

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const dateStr = (d: number) => {
  const date = new Date(now.getTime() - d * 86400000);
  return date.toLocaleDateString("fr-FR");
};

export const mockSubmissions: Submission[] = [
  {
    id: "sub-001",
    userId: "user-1",
    userName: "Marie Dupont",
    userEmail: "marie.dupont@email.com",
    missionId: "mission-1",
    missionName: "Achat Lessive Eco",
    status: "pending",
    submittedAt: daysAgo(1),
    purchaseDate: daysAgo(2),
    storeName: "Carrefour",
    totalAmount: 12.5,
    ocrData: {
      detectedStore: "Carrefour Market",
      detectedAmount: 12.5,
      detectedDate: dateStr(2),
      items: [
        { name: "Lessive Eco Planet 1.5L", price: 8.99 },
        { name: "Adoucissant Eco", price: 3.51 },
      ],
      confidence: 0.92,
    },
  },
  {
    id: "sub-002",
    userId: "user-2",
    userName: "Jean Martin",
    userEmail: "jean.martin@email.com",
    missionId: "mission-2",
    missionName: "Produits Bio Frais",
    status: "pending",
    submittedAt: daysAgo(2),
    purchaseDate: daysAgo(3),
    storeName: "Biocoop",
    totalAmount: 23.4,
    ocrData: {
      detectedStore: "Biocoop Centre",
      detectedAmount: 23.4,
      detectedDate: dateStr(3),
      items: [
        { name: "Tomates Bio 500g", price: 3.2 },
        { name: "Yaourt Nature Bio x4", price: 4.5 },
        { name: "Pain Complet Bio", price: 3.7 },
        { name: "Jus Pomme Bio 1L", price: 4.0 },
        { name: "Salade Bio", price: 2.5 },
        { name: "Fromage Chèvre Bio", price: 5.5 },
      ],
      confidence: 0.88,
    },
  },
  {
    id: "sub-003",
    userId: "user-3",
    userName: "Sophie Bernard",
    userEmail: "sophie.bernard@email.com",
    missionId: "mission-3",
    missionName: "Snacks & Boissons",
    status: "pending",
    submittedAt: daysAgo(1),
    purchaseDate: daysAgo(1),
    storeName: "Monoprix",
    totalAmount: 8.7,
    ocrData: {
      detectedStore: "Monoprix Gare",
      detectedAmount: 8.7,
      detectedDate: dateStr(1),
      items: [
        { name: "Chips Artisanales", price: 3.2 },
        { name: "Coca-Cola 33cl", price: 2.0 },
        { name: "Barre Céréales x3", price: 3.5 },
      ],
      confidence: 0.95,
    },
  },
  {
    id: "sub-004",
    userId: "user-1",
    userName: "Marie Dupont",
    userEmail: "marie.dupont@email.com",
    missionId: "mission-1",
    missionName: "Achat Lessive Eco",
    status: "approved",
    submittedAt: daysAgo(5),
    purchaseDate: daysAgo(6),
    storeName: "Auchan",
    totalAmount: 15.0,
    ocrData: {
      detectedStore: "Auchan Supermarché",
      detectedAmount: 15.0,
      detectedDate: dateStr(6),
      items: [
        { name: "Lessive Eco Maison Verte 2L", price: 11.5 },
        { name: "Pastilles Lave-Vaisselle Eco", price: 3.5 },
      ],
      confidence: 0.97,
    },
  },
  {
    id: "sub-005",
    userId: "user-4",
    userName: "Pierre Leroy",
    userEmail: "pierre.leroy@email.com",
    missionId: "mission-4",
    missionName: "Hygiène & Beauté",
    status: "rejected",
    submittedAt: daysAgo(3),
    purchaseDate: daysAgo(4),
    storeName: "Sephora",
    totalAmount: 45.0,
    rejectionReason: "Ticket illisible",
    ocrData: {
      detectedStore: "Sephora",
      detectedAmount: 45.0,
      detectedDate: dateStr(4),
      items: [
        { name: "Crème Hydratante", price: 25.0 },
        { name: "Gel Douche Bio", price: 12.0 },
        { name: "Déodorant Naturel", price: 8.0 },
      ],
      confidence: 0.45,
    },
  },
  {
    id: "sub-006",
    userId: "user-5",
    userName: "Lucie Moreau",
    userEmail: "lucie.moreau@email.com",
    missionId: "mission-2",
    missionName: "Produits Bio Frais",
    status: "pending",
    submittedAt: daysAgo(0),
    purchaseDate: daysAgo(1),
    storeName: "Naturalia",
    totalAmount: 18.9,
    ocrData: {
      detectedStore: "Naturalia",
      detectedAmount: 18.9,
      detectedDate: dateStr(1),
      items: [
        { name: "Bananes Bio 1kg", price: 2.99 },
        { name: "Lait d'Amande Bio", price: 3.5 },
        { name: "Muesli Bio 500g", price: 5.41 },
        { name: "Miel Bio 250g", price: 7.0 },
      ],
      confidence: 0.91,
    },
  },
  {
    id: "sub-007",
    userId: "user-6",
    userName: "Thomas Petit",
    userEmail: "thomas.petit@email.com",
    missionId: "mission-3",
    missionName: "Snacks & Boissons",
    status: "approved",
    submittedAt: daysAgo(7),
    purchaseDate: daysAgo(8),
    storeName: "Franprix",
    totalAmount: 6.5,
    ocrData: {
      detectedStore: "Franprix",
      detectedAmount: 6.5,
      detectedDate: dateStr(8),
      items: [
        { name: "Eau Minérale 1.5L", price: 1.0 },
        { name: "Cookies Chocolat", price: 3.0 },
        { name: "Jus d'Orange 25cl", price: 2.5 },
      ],
      confidence: 0.93,
    },
  },
  {
    id: "sub-008",
    userId: "user-7",
    userName: "Camille Roux",
    userEmail: "camille.roux@email.com",
    missionId: "mission-4",
    missionName: "Hygiène & Beauté",
    status: "pending",
    submittedAt: daysAgo(0),
    purchaseDate: daysAgo(1),
    storeName: "Monoprix",
    totalAmount: 22.0,
    ocrData: {
      detectedStore: "Monoprix",
      detectedAmount: 22.0,
      detectedDate: dateStr(1),
      items: [
        { name: "Shampooing Solide", price: 9.0 },
        { name: "Dentifrice Bio", price: 5.5 },
        { name: "Savon de Marseille", price: 7.5 },
      ],
      confidence: 0.89,
    },
  },
  {
    id: "sub-009",
    userId: "user-8",
    userName: "Nicolas Garnier",
    userEmail: "nicolas.garnier@email.com",
    missionId: "mission-1",
    missionName: "Achat Lessive Eco",
    status: "pending",
    submittedAt: daysAgo(1),
    purchaseDate: daysAgo(45),
    storeName: "Leclerc",
    totalAmount: 3.5,
    ocrData: {
      detectedStore: "Leclerc",
      detectedAmount: 3.5,
      detectedDate: dateStr(45),
      items: [{ name: "Lessive Eco Mini", price: 3.5 }],
      confidence: 0.78,
    },
  },
  {
    id: "sub-010",
    userId: "user-9",
    userName: "Emma Fournier",
    userEmail: "emma.fournier@email.com",
    missionId: "mission-3",
    missionName: "Snacks & Boissons",
    status: "rejected",
    submittedAt: daysAgo(4),
    purchaseDate: daysAgo(5),
    storeName: "Casino",
    totalAmount: 5.2,
    rejectionReason: "Produit non éligible",
    ocrData: {
      detectedStore: "Casino",
      detectedAmount: 5.2,
      detectedDate: dateStr(5),
      items: [
        { name: "Bière Artisanale 33cl", price: 3.2 },
        { name: "Cacahuètes 200g", price: 2.0 },
      ],
      confidence: 0.85,
    },
  },
  {
    id: "sub-011",
    userId: "user-10",
    userName: "Hugo Lambert",
    userEmail: "hugo.lambert@email.com",
    missionId: "mission-2",
    missionName: "Produits Bio Frais",
    status: "approved",
    submittedAt: daysAgo(10),
    purchaseDate: daysAgo(11),
    storeName: "Carrefour Bio",
    totalAmount: 31.0,
    ocrData: {
      detectedStore: "Carrefour Bio",
      detectedAmount: 31.0,
      detectedDate: dateStr(11),
      items: [
        { name: "Poulet Fermier Bio", price: 12.0 },
        { name: "Légumes Ratatouille Bio", price: 8.5 },
        { name: "Riz Complet Bio 1kg", price: 4.5 },
        { name: "Huile d'Olive Bio", price: 6.0 },
      ],
      confidence: 0.96,
    },
  },
  {
    id: "sub-012",
    userId: "user-2",
    userName: "Jean Martin",
    userEmail: "jean.martin@email.com",
    missionId: "mission-1",
    missionName: "Achat Lessive Eco",
    status: "pending",
    submittedAt: daysAgo(0),
    purchaseDate: daysAgo(1),
    storeName: "Intermarché",
    totalAmount: 9.99,
    ocrData: {
      detectedStore: "Intermarché Super",
      detectedAmount: 9.99,
      detectedDate: dateStr(1),
      items: [
        { name: "Lessive Pods Eco x20", price: 6.99 },
        { name: "Javel Eco 1L", price: 3.0 },
      ],
      confidence: 0.87,
    },
  },
  {
    id: "sub-013",
    userId: "user-11",
    userName: "Chloé Dubois",
    userEmail: "chloe.dubois@email.com",
    missionId: "mission-4",
    missionName: "Hygiène & Beauté",
    status: "approved",
    submittedAt: daysAgo(6),
    purchaseDate: daysAgo(7),
    storeName: "Marionnaud",
    totalAmount: 38.5,
    ocrData: {
      detectedStore: "Marionnaud",
      detectedAmount: 38.5,
      detectedDate: dateStr(7),
      items: [
        { name: "Eau de Toilette 50ml", price: 22.0 },
        { name: "Crème Mains", price: 8.5 },
        { name: "Baume à Lèvres", price: 8.0 },
      ],
      confidence: 0.94,
    },
  },
  {
    id: "sub-014",
    userId: "user-12",
    userName: "Antoine Mercier",
    userEmail: "antoine.mercier@email.com",
    missionId: "mission-3",
    missionName: "Snacks & Boissons",
    status: "pending",
    submittedAt: daysAgo(0),
    purchaseDate: daysAgo(0),
    storeName: "Carrefour",
    totalAmount: 11.3,
    ocrData: {
      detectedStore: "Carrefour Express",
      detectedAmount: 11.3,
      detectedDate: dateStr(0),
      items: [
        { name: "Smoothie Mangue 25cl", price: 3.5 },
        { name: "Granola Bar x4", price: 4.3 },
        { name: "Thé Glacé Pêche 50cl", price: 3.5 },
      ],
      confidence: 0.9,
    },
  },
];
