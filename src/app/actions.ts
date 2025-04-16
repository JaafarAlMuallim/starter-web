"use server";

import { z } from "zod";
import { api } from "@/trpc/server";
import { revalidatePath } from "next/cache";

const chirpSchema = z.object({
  chirp: z
    .string()
    .min(1, "Chirp must be at least 1 character")
    .max(140, "Chirp must be at most 140 characters")
    .trim(),
});

export const chirpAction = async ({ chirp }: z.infer<typeof chirpSchema>) => {
  try {
    await api.chirp.addChirp({ chirp });
    revalidatePath("/");
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};
