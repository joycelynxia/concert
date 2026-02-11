/**
 * Sync local (IndexedDB) tickets to the server when user logs in or registers.
 * POST each ticket; backend auto-creates the experience. Sync notes to each experience.
 */
import { API_BASE } from "../config/api";
import {
  getLocalTickets,
  getLocalExperiencesByTicket,
  getLocalMemoriesByExperience,
  deleteLocalTicket,
} from "./localData";
import type { LocalTicket } from "./indexedDb";

export async function syncLocalTicketsToServer(token: string): Promise<{ synced: number; failed: number }> {
  const tickets = await getLocalTickets();
  if (tickets.length === 0) return { synced: 0, failed: 0 };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  let synced = 0;
  let failed = 0;

  for (const ticket of tickets) {
    try {
      const body = toApiTicket(ticket);
      const res = await fetch(`${API_BASE}/api/concerts/ticket`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        failed++;
        continue;
      }

      const data = await res.json();
      const serverTicketId = data.concert?._id;
      if (serverTicketId) {
        const exps = await getLocalExperiencesByTicket(ticket._id);
        for (const exp of exps) {
          const mems = await getLocalMemoriesByExperience(exp._id);
          const noteMem = mems.find((m) => m.type === "note");
          if (noteMem?.content?.trim()) {
            const fd = new FormData();
            fd.append("note", noteMem.content);
            await fetch(`${API_BASE}/api/upload/${serverTicketId}`, {
              method: "POST",
              headers,
              body: fd,
            });
          }
        }
      }

      await deleteLocalTicket(ticket._id);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

function toApiTicket(t: LocalTicket): Record<string, unknown> {
  return {
    artist: t.artist,
    tour: t.tour,
    date: t.date,
    venue: t.venue,
    seatInfo: t.seatInfo,
    section: t.section,
    setlist: t.setlist,
    youtubePlaylist: t.youtubePlaylist,
    genre: t.genre,
    priceCents: t.priceCents,
  };
}
