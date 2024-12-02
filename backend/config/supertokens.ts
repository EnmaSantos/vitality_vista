// FILE: config/supertokens.ts

import { init, load } from "../deps.ts";

// Load environment variables
await load({ export: true });

const SUPERTOKENS_CONNECTION_URI = Deno.env.get("SUPERTOKENS_CONNECTION_URI");
const SUPERTOKENS_API_KEY = Deno.env.get("SUPERTOKENS_API_KEY");

if (!SUPERTOKENS_CONNECTION_URI || !SUPERTOKENS_API_KEY) {
  throw new Error("SuperTokens connection URI or API key is not defined in the environment variables");
}

init({
  appInfo: {
    appName: "Vitality Vista",
    apiDomain: "http://localhost:8000",
    websiteDomain: "http://localhost:3000",
    apiBasePath: "/auth",
  },
  supertokens: {
    connectionURI: SUPERTOKENS_CONNECTION_URI,
    apiKey: SUPERTOKENS_API_KEY,
  },
  recipeList: [
    {
      recipeId: "thirdpartyemailpassword",
      providers: [
        // List of social login providers
        {
          id: "google",
          clientId: "YOUR_GOOGLE_CLIENT_ID",
          clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
        },
        {
          id: "facebook",
          clientId: "YOUR_FACEBOOK_CLIENT_ID",
          clientSecret: "YOUR_FACEBOOK_CLIENT_SECRET",
        },
      ],
    },
  ],
});