export interface ConcertDetails {
    artist: string;
    tour?: string;
    date: string;
    venue?: string;
    seatInfo?: string;
    _id: string;
  }

export interface ConcertMemory {
  _id: string;
  type: 'note' | 'photo' | 'video';
  content: string;
  mimeType?: string;
}
  