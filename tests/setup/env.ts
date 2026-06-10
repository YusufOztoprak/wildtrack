import dotenv from 'dotenv';
import path from 'path';

// Load .env.test before any app module is imported in test workers.
// dotenv skips keys already present in process.env, so this safely overrides
// anything that a later dotenv.config() call inside src/ would otherwise set.
dotenv.config({ path: path.join(__dirname, '../../.env.test') });
process.env.NODE_ENV = 'test';

// Suppress console.error in tests — expected error-path output from controllers
// and error middleware is noise, not a sign of real problems.
global.console.error = () => {};
