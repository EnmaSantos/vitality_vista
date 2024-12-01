
// Oak framework for creating the server and handling requests
export { Application, Router, Context } from "https://deno.land/x/oak@v17.1.3/mod.ts";

// MongoDB client for database interactions
export { MongoClient } from "https://deno.land/x/mongo@v0.31.1/mod.ts";

// Dotenv for loading environment variables
export { config } from "https://deno.land/std@0.203.0/dotenv/mod.ts";

// For handling JWT creation and verification (we'll use this later)
export { create, verify, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";