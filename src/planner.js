const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function toMinutes(hhmm) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) throw new Error(`Invalid time: ${hhmm}`);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error(`Invalid time: ${hhmm}`);
  return hour * 60 + minute;
}

export function normalizeMeeting(meeting) {
  if (!DAY_ORDER.includes(meeting.day)) throw new Error(`Invalid day: ${meeting.day}`);
  const start = toMinutes(meeting.start);
  const end = toMinutes(meeting.end);
  if (end <= start) throw new Error(`End must be after start: ${meeting.start}-${meeting.end}`);
  return {...meeting, startMinutes: start, endMinutes: end};
}

export function detectConflicts(courses) {
  const slots = courses.flatMap(course =>
    course.meetings.map(meeting => ({
      course: course.name,
      code: course.code,
      ...normalizeMeeting(meeting)
    }))
  );

  const conflicts = [];
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      const a = slots[i];
      const b = slots[j];
      if (a.code === b.code || a.day !== b.day) continue;
      const overlaps = a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
      if (overlaps) {
        conflicts.push({
          day: a.day,
          courses: [a.code, b.code],
          overlapMinutes: Math.min(a.endMinutes, b.endMinutes) - Math.max(a.startMinutes, b.startMinutes)
        });
      }
    }
  }
  return conflicts.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
}

export function weeklyLoad(courses) {
  const summary = Object.fromEntries(DAY_ORDER.map(day => [day, 0]));
  for (const course of courses) {
    for (const raw of course.meetings) {
      const meeting = normalizeMeeting(raw);
      summary[meeting.day] += meeting.endMinutes - meeting.startMinutes;
    }
  }
  return summary;
}

export function pressureScore(courses, assignments = []) {
  const minutes = weeklyLoad(courses);
  const classHours = Object.values(minutes).reduce((sum, value) => sum + value, 0) / 60;
  const weightedAssignments = assignments.reduce((sum, item) => {
    const weight = item.kind === "exam" ? 3 : item.kind === "project" ? 2 : 1;
    return sum + weight;
  }, 0);
  const raw = classHours * 2.1 + weightedAssignments * 4;
  return Math.min(100, Math.round(raw));
}

export function buildSummary(courses, assignments = []) {
  const conflicts = detectConflicts(courses);
  const load = weeklyLoad(courses);
  const busiest = Object.entries(load).sort((a, b) => b[1] - a[1])[0];
  return {
    courseCount: courses.length,
    conflictCount: conflicts.length,
    conflicts,
    weeklyHours: Number((Object.values(load).reduce((a, b) => a + b, 0) / 60).toFixed(1)),
    busiestDay: {day: busiest[0], hours: Number((busiest[1] / 60).toFixed(1))},
    pressureScore: pressureScore(courses, assignments)
  };
}
