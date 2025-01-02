# Dependencies

This document lists the modules used in the backend application and explains why each module is needed.

## Modules and Their Purposes

### Oak Framework
- **Module:** `oak`
- **URL:** [https://deno.land/x/oak@v12.6.1/mod.ts](https://deno.land/x/oak@v12.6.1/mod.ts)
- **Purpose:** Oak is a middleware framework for Deno's HTTP server, similar to Koa for Node.js. It provides routing, context, and other utilities for building web applications and APIs.

### Dotenv
- **Module:** `dotenv`
- **URL:** [https://deno.land/std@0.217.0/dotenv/mod.ts](https://deno.land/std@0.217.0/dotenv/mod.ts)
- **Purpose:** Dotenv is used to load environment variables from a `.env` file into `Deno.env`. This is useful for managing configuration settings and sensitive information like API keys and database URIs.

### UUID
- **Module:** `uuid`
- **URL:** [https://deno.land/std@0.217.0/uuid/mod.ts](https://deno.land/std@0.217.0/uuid/mod.ts)
- **Purpose:** UUID is used to generate unique identifiers. This can be useful for creating unique tokens, user IDs, and other identifiers.

### Bcrypt
- **Module:** `bcrypt`
- **URL:** [https://deno.land/x/bcrypt@v0.4.1/mod.ts](https://deno.land/x/bcrypt@v0.4.1/mod.ts)
- **Purpose:** Bcrypt is used for hashing passwords securely. It helps protect user passwords by storing hashed versions instead of plain text.

### djwt
- **Module:** `djwt`
- **URL:** [https://deno.land/x/djwt@v2.8/mod.ts](https://deno.land/x/djwt@v2.8/mod.ts)
- **Purpose:** djwt is a library for creating and verifying JSON Web Tokens (JWT). JWTs are used for secure authentication and session management.

### OAuth2 Client
- **Module:** `oauth2_client`
- **URL:** [https://deno.land/x/oauth2_client@v1.1.0/mod.ts](https://deno.land/x/oauth2_client@v1.1.0/mod.ts)
- **Purpose:** OAuth2 Client is used for implementing OAuth2 authentication with third-party providers like Google and Facebook. It handles the OAuth2 flow and token management.

### TOTP
- **Module:** `otpauth`
- **URL:** [https://deno.land/x/otpauth@v2.0.0/mod.ts](https://deno.land/x/otpauth@v2.0.0/mod.ts)
- **Purpose:** TOTP (Time-based One-Time Password) is used for implementing two-factor authentication (2FA). It generates and verifies time-based one-time passwords.

### MongoDB Client
- **Module:** `mongo`
- **URL:** [https://deno.land/x/mongo@v0.31.1/mod.ts](https://deno.land/x/mongo@v0.31.1/mod.ts)
- **Purpose:** MongoDB Client is used for interacting with a MongoDB database. It provides methods for connecting to the database, performing CRUD operations, and managing collections.