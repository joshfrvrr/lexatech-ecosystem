// Export the API router
export { obligationsRouter } from './api/obligations-router.js';

// Export the Database Schema (read-only for other modules)
export * as complianceSchema from './data/schema.js';

// Export the Types
export type { Obligation, Evidence } from './data/schema.js';