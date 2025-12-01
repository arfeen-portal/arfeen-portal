// src/config/searchRoutes.ts

export type SearchRoute = {
  label: string;
  path: string;
  keywords?: string[];
};

export const SEARCH_ROUTES: SearchRoute[] = [
  {
    label: 'Dashboard',
    path: '/',
    keywords: ['home', 'summary'],
  },
  {
    label: 'Ticket Groups',
    path: '/ticket-groups',
    keywords: ['groups', 'tickets', 'inventory'],
  },
  {
    label: 'Ticket Inventory',
    path: '/ticket-groups/inventory',
    keywords: ['seats', 'stock', 'availability'],
  },
  {
    label: 'Umrah Packages',
    path: '/umrah-packages',
    keywords: ['package', 'umrah', 'rooms', 'rates'],
  },
  {
    label: 'Transfers & Vehicles',
    path: '/transfers',
    keywords: ['transport', 'vehicles', 'routes'],
  },
  {
    label: 'Agents & Ledger',
    path: '/agents',
    keywords: ['agent', 'ledger', 'balance', 'account'],
  },
  {
    label: 'Agent Ledger Detail',
    path: '/agents/ledger',
    keywords: ['statement', 'account', 'transactions'],
  },
  {
    label: 'Reports',
    path: '/reports',
    keywords: ['report', 'analytics', 'summary'],
  },
];
