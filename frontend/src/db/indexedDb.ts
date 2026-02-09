/**
 * IndexedDB schema for offline/guest mode.
 * Mirrors API models: ConcertTicket, ConcertExperience, ConcertMemory.
 * Uses Dexie for a simpler API.
 */
import Dexie, { type EntityTable } from "dexie";

/** Local ticket (mirrors ConcertDetails) */
export interface LocalTicket {
  _id: string; // server id when synced, or "local_xxx" when unsynced
  artist: string;
  tour?: string;
  date: string;
  venue?: string;
  seatInfo?: string;
  section?: string;
  setlist?: string;
  youtubePlaylist?: string;
  genre?: string;
  priceCents?: number;
  user?: string;
  /** True if created/edited locally and not yet synced */
  isDirty?: boolean;
  updatedAt?: number;
}

/** Local experience (links ticket to memories) */
export interface LocalExperience {
  _id: string;
  concertTicket: string; // ticket _id
  userId?: string;
  rating?: number;
  isDirty?: boolean;
  updatedAt?: number;
}

/** Local memory (note, photo, or video) */
export interface LocalMemory {
  _id: string;
  experience: string; // experience _id
  type: "note" | "photo" | "video";
  content: string;
  mimeType?: string;
  isDirty?: boolean;
  updatedAt?: number;
}

const DB_NAME = "encore-local";
const DB_VERSION = 1;

export class EncoreDB extends Dexie {
  tickets!: EntityTable<LocalTicket, "_id">;
  experiences!: EntityTable<LocalExperience, "_id">;
  memories!: EntityTable<LocalMemory, "_id">;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      tickets: "_id, date, user, isDirty",
      experiences: "_id, concertTicket, userId, isDirty",
      memories: "_id, experience, isDirty",
    });
  }
}

export const db = new EncoreDB();

/** Generate a temp ID for unsynced items */
export function localId(prefix = "local"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
