/**
 * API Endpoints Configuration
 * 
 * Centralized definition of all API endpoints for easy refactoring
 * and React Native compatibility.
 */

export const API_ENDPOINTS = {
  // Health & Diagnostics
  health: '/api/health',
  diagnostics: {
    email: '/api/diagnostics/email',
  },

  // Listings
  listings: {
    list: '/api/listings',
    polygonSearch: '/api/listings/polygon-search',
    geojson: '/api/listings.geojson',
  },

  // Watchlists
  watchlists: {
    list: '/api/watchlists',
    add: '/api/watchlists',
    remove: '/api/watchlists',
  },

  // Messages
  messages: {
    list: '/api/messages',
    conversations: '/api/messages/conversations',
    unreadCount: '/api/messages/unread-count',
  },

  // Notifications
  notifications: {
    list: '/api/notifications',
    preferences: '/api/notifications/preferences',
    unreadCount: '/api/notifications/unread-count',
  },

  // Saved Searches
  savedSearches: {
    list: '/api/saved-searches',
    create: '/api/saved-searches',
    update: '/api/saved-searches',
    delete: '/api/saved-searches',
  },

  // Analytics
  analytics: {
    dashboard: '/api/analytics',
    export: '/api/analytics/export',
  },

  // AI Usage
  aiUsage: {
    get: '/api/ai-usage',
  },

  // Admin
  admin: {
    users: '/api/admin/users',
    flags: '/api/admin/flags',
    diagnose: '/api/admin/diagnose',
    fixAccount: '/api/admin/fix-account',
  },

  // Billing
  billing: {
    createCheckout: '/api/billing/create-checkout-session',
    portal: '/api/billing/portal',
    webhook: '/api/billing/webhook',
  },

  // AI Analysis
  analyze: {
    property: '/api/analyze',
    structured: '/api/analyze-structured',
  },

  // Geocoding
  geocode: '/api/geocode',

  // Route
  route: '/api/route',

  // Feedback
  feedback: '/api/feedback',

  // Contact Sales
  contactSales: '/api/contact-sales',

  // Transactions
  transactions: {
    list: '/api/transactions',
    confirm: (id: string) => `/api/transactions/${id}/confirm`,
  },

  // Alerts
  alerts: {
    list: '/api/alerts',
    create: '/api/alerts',
  },
} as const;

/**
 * Helper to build endpoint URLs
 */
export function buildEndpoint(path: string, params?: Record<string, string | number>): string {
  let endpoint = path;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      endpoint = endpoint.replace(`:${key}`, String(value));
    });
  }
  
  return endpoint;
}

