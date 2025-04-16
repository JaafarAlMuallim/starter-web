import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { env } from "@/env";

const client = {
  url: env.DB_URL,
  authToken: env.AUTH_TOKEN,
} as const;

export const db = drizzle({
  connection: {
    url: client.url,
    authToken: client.authToken,
  },
  schema,
});
