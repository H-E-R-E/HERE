export interface AppEvent {
  eventType: string;
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  cohosts: string[];
  eventFee: string;
  creator?: string;
  imageUrl?: string | null;
  geoPolygon?: number[][];
  isTrackingAttendance: boolean;
}