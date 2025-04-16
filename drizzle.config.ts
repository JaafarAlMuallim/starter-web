import { type Config } from "drizzle-kit";

import { env } from "@/env";

console.log(env.DB_URL);
console.log(env.AUTH_TOKEN);

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: env.DB_URL,
    authToken: env.AUTH_TOKEN,
  },
} satisfies Config;
