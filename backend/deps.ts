// Core server framework - Oak (similar to Express for Node.js)
export {
    Application,
    Router,
    Context,
    Status,
    isHttpError,
    helpers,
  } from "https://deno.land/x/oak@v12.6.1/mod.ts";

export type { RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";
  
  // Environment variables (from Deno standard library)
  export {
    load as loadEnv,
  } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
  
  // CORS middleware
  export { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
  
  // Authentication utilities - using standard library SHA-256 for hashing
  export { 
    create as createJwt,
    verify as verifyJwt,
    decode as decodeJwt,
    getNumericDate,
  } from "https://deno.land/x/djwt@v2.9.1/mod.ts";
  
  // Validation
  export {
    validate,
    required,
    isEmail,
    isString,
    isNumber,
    minLength,
    maxLength,
    isDate,
    isBool,
    nullable,
  } from "https://deno.land/x/validasaur@v0.15.0/mod.ts";
  
  // Utility for generating UUIDs
  export { v4 as uuid } from "https://deno.land/std@0.208.0/uuid/mod.ts";
  
  // File system utilities (for logging, etc.)
  export {
    ensureDir,
    ensureFile,
  } from "https://deno.land/std@0.208.0/fs/mod.ts";
  
  // Data formatting utilities
  export {
    format as formatDate,
  } from "https://deno.land/std@0.208.0/datetime/mod.ts";
  
  // Standard utilities
  export {
    delay,
  } from "https://deno.land/std@0.208.0/async/mod.ts";
  
  // Logging utilities
  export {
    getLogger,
    setup as setupLogger,
    LogLevels,
  } from "https://deno.land/std@0.208.0/log/mod.ts";


  export { Client as PostgresClient, PoolClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

  // Note: fetch, Response, Request, and Headers are globally available in Deno
  // and don't need to be imported