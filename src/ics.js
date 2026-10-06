const DAY_INDEX = {Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6};

function pad(value) {
  return String(value).padStart(2, "0");
}

function firstOccurrence(startDate, day) {
  const [year, month, date] = startDate.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, date));
  const offset = (DAY_INDEX[day] - start.getUTCDay() + 7) % 7;
  start.setUTCDate(start.getUTCDate() + offset);
  return `${start.getUTCFullYear()}${pad(start.getUTCMonth() + 1)}${pad(start.getUTCDate())}`;
}

function escapeText(value = "") {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;")
    .replaceAll("\n", "\\n");
}

export function toICS(courses, options = {}) {
  const startDate = options.startDate ?? "2026-09-14";
  const weeks = options.weeks ?? 18;
  const tzid = options.tzid ?? "Asia/Taipei";
  if (weeks < 1 || weeks > 30) throw new Error("weeks must be between 1 and 30");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PUClass//Schedule Feasibility Engine//EN",
    "CALSCALE:GREGORIAN"
  ];

  for (const course of courses) {
    course.meetings.forEach((meeting, index) => {
      const date = firstOccurrence(startDate, meeting.day);
      const dtStart = `${date}T${meeting.start.replace(":", "")}00`;
      const dtEnd = `${date}T${meeting.end.replace(":", "")}00`;
      const uid = `${course.code}-${course.section ?? "default"}-${index}@puclass.local`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `SUMMARY:${escapeText(course.name)}`,
        `DESCRIPTION:${escapeText(`${course.code}${course.section ? ` · ${course.section}` : ""}`)}`,
        meeting.building || course.building ? `LOCATION:${escapeText(meeting.building ?? course.building)}` : "",
        `DTSTART;TZID=${tzid}:${dtStart}`,
        `DTEND;TZID=${tzid}:${dtEnd}`,
        `RRULE:FREQ=WEEKLY;COUNT=${weeks}`,
        "END:VEVENT"
      );
    });
  }

  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n") + "\r\n";
}
