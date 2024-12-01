// Oak framework for creating the server and handling requests
export { Application, Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// MongoDB client for database interactions
export { MongoClient, Database } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

// Dotenv for loading environment variables
export { load } from "https://deno.land/std@0.217.0/dotenv/mod.ts";

// For handling JWT creation and verification
export { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";