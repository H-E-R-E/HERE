export interface AppEvent {
  eventType: string;
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  cohosts: string[];
  eventFee: string;
  creator?: string;
  imageUrl?: string | null;
  geoPolygon?: number[][];
  isTrackingAttendance: boolean;
}