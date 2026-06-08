export type RecurrenceRule = {
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  interval: number;
  days_of_week?: string[];
  end_date?: string;
  count?: number;
};

export interface AppEvent {
  attendance_profile: "quick" | "standard" | "extended" | "unlimited";
  category: string;
  description: string;
  end_time: string;
  event_fee?: string;
  geofence_radius: number | null;
  latitude: number;
  longitude: number;
  name: string;
  recurrence: RecurrenceRule | null | any;
  start_time: string;
  visibility: "Public" | "Private";
}