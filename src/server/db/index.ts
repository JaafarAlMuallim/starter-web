import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

if (!process.env.DB_URL) {
  throw new Error("DB_URL is not defined");
}

if (!process.env.AUTH_TOKEN) {
  throw new Error("AUTH_TOKEN is not defined");
}

const client = {
  url: process.env.DB_URL,
  authToken: process.env.AUTH_TOKEN,
} as const;

export const db = drizzle({
  connection: {
    url: client.url,
    authToken: client.authToken,
  },
  schema,
});
