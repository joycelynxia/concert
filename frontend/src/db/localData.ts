/**
 * CRUD helpers for local IndexedDB data.
 * Use when offline or in guest mode.
 */
import { db, localId, type LocalTicket, type LocalExperience, type LocalMemory } from "./indexedDb";

/** --- Tickets --- */
export async function getLocalTickets(): Promise<LocalTicket[]> {
  return db.tickets.orderBy("date").reverse().toArray();
}

export async function getLocalTicket(id: string): Promise<LocalTicket | undefined> {
  return db.tickets.get(id);
}

export async function addLocalTicket(ticket: Omit<LocalTicket, "_id" | "isDirty">): Promise<LocalTicket> {
  const _id = localId("ticket");
  const record: LocalTicket = { ...ticket, _id, isDirty: true, updatedAt: Date.now() };
  await db.tickets.add(record);
  return record;
}

export async function updateLocalTicket(id: string, updates: Partial<LocalTicket>): Promise<void> {
  await db.tickets.update(id, { ...updates, isDirty: true, updatedAt: Date.now() });
}

export async function deleteLocalTicket(id: string): Promise<void> {
  const exp = await db.experiences.where("concertTicket").equals(id).toArray();
  for (const e of exp) {
    await db.memories.where("experience").equals(e._id).delete();
  }
  await db.experiences.where("concertTicket").equals(id).delete();
  await db.tickets.delete(id);
}

/** --- Experiences --- */
export async function getLocalExperiencesByTicket(ticketId: string): Promise<LocalExperience[]> {
  return db.experiences.where("concertTicket").equals(ticketId).toArray();
}

export async function getLocalExperience(id: string): Promise<LocalExperience | undefined> {
  return db.experiences.get(id);
}

export async function addLocalExperience(exp: Omit<LocalExperience, "_id" | "isDirty">): Promise<LocalExperience> {
  const _id = localId("exp");
  const record: LocalExperience = { ...exp, _id, isDirty: true, updatedAt: Date.now() };
  await db.experiences.add(record);
  return record;
}

export async function updateLocalExperience(id: string, updates: Partial<LocalExperience>): Promise<void> {
  await db.experiences.update(id, { ...updates, isDirty: true, updatedAt: Date.now() });
}

export async function deleteLocalExperience(id: string): Promise<void> {
  await db.memories.where("experience").equals(id).delete();
  await db.experiences.delete(id);
}

/** --- Memories --- */
export async function getLocalMemoriesByExperience(expId: string): Promise<LocalMemory[]> {
  return db.memories.where("experience").equals(expId).toArray();
}

export async function addLocalMemory(mem: Omit<LocalMemory, "_id" | "isDirty">): Promise<LocalMemory> {
  const _id = localId("mem");
  const record: LocalMemory = { ...mem, _id, isDirty: true, updatedAt: Date.now() };
  await db.memories.add(record);
  return record;
}

export async function updateLocalMemory(id: string, updates: Partial<LocalMemory>): Promise<void> {
  await db.memories.update(id, { ...updates, isDirty: true, updatedAt: Date.now() });
}

export async function deleteLocalMemory(id: string): Promise<void> {
  await db.memories.delete(id);
}

/** Get all dirty records for sync-on-login */
export async function getDirtyTickets(): Promise<LocalTicket[]> {
  return db.tickets.where("isDirty").equals(1).toArray();
}

export async function getDirtyExperiences(): Promise<LocalExperience[]> {
  return db.experiences.where("isDirty").equals(1).toArray();
}

export async function getDirtyMemories(): Promise<LocalMemory[]> {
  return db.memories.where("isDirty").equals(1).toArray();
}

/** Mark ticket as synced after server upload. Replaces local _id with server _id. */
export async function markTicketSynced(oldId: string, serverId: string): Promise<void> {
  const ticket = await db.tickets.get(oldId);
  if (!ticket) return;
  const updated: LocalTicket = { ...ticket, _id: serverId, isDirty: false, updatedAt: Date.now() };
  await db.tickets.add(updated);
  await db.tickets.delete(oldId);
  const exps = await db.experiences.where("concertTicket").equals(oldId).toArray();
  for (const e of exps) {
    await db.experiences.update(e._id, { concertTicket: serverId, isDirty: false });
  }
}
