// Export the API routers
export { authRouter } from './api/auth-router.js';
export { requireAuth } from './services/session.js';
export { ensureLocalTestAccount } from './services/auth.js';

// Export the Database Schema so other modules know the types (but they can't alter them)
export * as coreSchema from './data/schema.js';

// Export the Types
export type { User, Organization } from './data/schema.js';
