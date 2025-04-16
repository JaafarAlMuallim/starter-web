import type { ReadChirp } from "@/server/db/schema";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const run = <TResult>(fn: () => TResult): TResult => fn();

export const groupChirpsByDate = (chirps: ReadChirp[]) => {
  const groupedChirps: {
    [key: string]: ReadChirp[];
  } = {};

  chirps.forEach((chirp) => {
    const date = new Date(chirp.created_at).toLocaleDateString(); // Extract date

    if (!groupedChirps[date]) {
      groupedChirps[date] = []; // Initialize array for the date
    }

    groupedChirps[date].push(chirp); // Add the chirp to the date's array
  });

  return groupedChirps;
};
