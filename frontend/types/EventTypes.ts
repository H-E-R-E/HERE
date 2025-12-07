export interface AppEvent {
  attendance_profile: "quick",
  category: string,
  description: string,
  end_time: string,
  geofence_radius: number,
  latitude: number,
  longitude: number,
  name: string,
  recurrence: null,
  start_time: string,
  visibility: "Public" | "Private",
}