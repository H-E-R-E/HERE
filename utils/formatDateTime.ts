import { format } from "date-fns";

export function formatDateTime(dateString: string, timeString: string) {
  try {
    // If date looks like "2025-09-20" and time like "14:30"
    const dateTime = new Date(`${dateString}T${timeString}`);

    if (isNaN(dateTime.getTime())) {
      return `${dateString} ${timeString}`;
    }

    return format(dateTime, "MMMM do, yyyy',' h:mm a");
  } catch (e) {
    return `${dateString} ${timeString}`;
  }
}
