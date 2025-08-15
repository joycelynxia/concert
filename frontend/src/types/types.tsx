export interface ConcertDetails {
    artist: string;
    tour?: string;
    date: string;
    venue?: string;
    seatInfo?: string;
    section?: string;
    setlist?: string;
    priceCents?: number;
    genre?: string;
    _id: string;
  }

export interface ConcertMemory {
  _id: string;
  type: 'note' | 'photo' | 'video';
  content: string;
  mimeType?: string;
}
  
export interface PreferredSection {
  sectionName: string; 
  lastNotifiedPrice? : number;
}
export interface EventWatcher {
  _id: string;
  email: string;
  eventName: string;
  eventUrl: string;
  preferredSections: PreferredSection[]; // e.g., ["Floor", "Balcony"]
  maxPricePerTicket: number;
  numTickets: number;
  createdAt?: Date;
  lastCheckedAt?: Date;
  lastNotifiedPrice?: number;
}