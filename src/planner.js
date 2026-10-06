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

export function flattenMeetings(courses) {
  return courses.flatMap(course =>
    course.meetings.map(meeting => ({
      course: course.name,
      code: course.code,
      section: course.section ?? null,
      building: meeting.building ?? course.building ?? null,
      ...normalizeMeeting(meeting)
    }))
  );
}

export function detectConflicts(courses) {
  const slots = flattenMeetings(courses);
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

export function getTravelMinutes(fromBuilding, toBuilding, matrix = {}) {
  if (!fromBuilding || !toBuilding || fromBuilding === toBuilding) return 0;
  const direct = matrix?.[fromBuilding]?.[toBuilding];
  const reverse = matrix?.[toBuilding]?.[fromBuilding];
  if (Number.isFinite(direct)) return direct;
  if (Number.isFinite(reverse)) return reverse;
  return null;
}

export function detectTransitions(courses, travelMatrix = {}, bufferMinutes = 5) {
  const byDay = Object.fromEntries(DAY_ORDER.map(day => [day, []]));
  for (const slot of flattenMeetings(courses)) byDay[slot.day].push(slot);

  const transitions = [];
  for (const day of DAY_ORDER) {
    const slots = byDay[day].sort((a, b) => a.startMinutes - b.startMinutes);
    for (let i = 0; i < slots.length - 1; i += 1) {
      const from = slots[i];
      const to = slots[i + 1];
      if (from.endMinutes > to.startMinutes) continue;
      const gapMinutes = to.startMinutes - from.endMinutes;
      const travelMinutes = getTravelMinutes(from.building, to.building, travelMatrix);
      if (travelMinutes === null) {
        transitions.push({
          day,
          from: from.code,
          to: to.code,
          status: "unknown",
          gapMinutes,
          travelMinutes: null,
          requiredMinutes: null
        });
        continue;
      }
      const requiredMinutes = travelMinutes + bufferMinutes;
      const status = gapMinutes < travelMinutes ? "impossible" :
        gapMinutes < requiredMinutes ? "tight" : "ok";
      transitions.push({
        day,
        from: from.code,
        to: to.code,
        status,
        gapMinutes,
        travelMinutes,
        requiredMinutes
      });
    }
  }
  return transitions;
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

export function idleMinutesByDay(courses) {
  const byDay = Object.fromEntries(DAY_ORDER.map(day => [day, []]));
  for (const slot of flattenMeetings(courses)) byDay[slot.day].push(slot);
  const out = {};
  for (const day of DAY_ORDER) {
    const slots = byDay[day].sort((a, b) => a.startMinutes - b.startMinutes);
    let idle = 0;
    for (let i = 0; i < slots.length - 1; i += 1) {
      idle += Math.max(0, slots[i + 1].startMinutes - slots[i].endMinutes);
    }
    out[day] = idle;
  }
  return out;
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

export function buildSummary(courses, assignments = [], options = {}) {
  const conflicts = detectConflicts(courses);
  const load = weeklyLoad(courses);
  const transitions = detectTransitions(
    courses,
    options.travelMatrix ?? {},
    options.bufferMinutes ?? 5
  );
  const busiest = Object.entries(load).sort((a, b) => b[1] - a[1])[0];
  const impossibleTransitions = transitions.filter(x => x.status === "impossible");
  const tightTransitions = transitions.filter(x => x.status === "tight");
  const unknownTransitions = transitions.filter(x => x.status === "unknown");
  return {
    courseCount: courses.length,
    conflictCount: conflicts.length,
    conflicts,
    weeklyHours: Number((Object.values(load).reduce((a, b) => a + b, 0) / 60).toFixed(1)),
    busiestDay: {day: busiest[0], hours: Number((busiest[1] / 60).toFixed(1))},
    pressureScore: pressureScore(courses, assignments),
    impossibleTransitionCount: impossibleTransitions.length,
    tightTransitionCount: tightTransitions.length,
    unknownTransitionCount: unknownTransitions.length,
    transitions
  };
}
