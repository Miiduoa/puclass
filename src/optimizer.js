import {buildSummary, idleMinutesByDay, weeklyLoad} from "./planner.js";

function cartesian(groups, index = 0, acc = [], out = []) {
  if (index === groups.length) {
    out.push([...acc]);
    return out;
  }
  for (const option of groups[index]) {
    acc.push(option);
    cartesian(groups, index + 1, acc, out);
    acc.pop();
  }
  return out;
}

export function scoreSchedule(courses, assignments = [], options = {}) {
  const summary = buildSummary(courses, assignments, options);
  const load = weeklyLoad(courses);
  const idle = idleMinutesByDay(courses);
  const maxDailyMinutes = Math.max(...Object.values(load));
  const totalIdleMinutes = Object.values(idle).reduce((a, b) => a + b, 0);

  const score =
    summary.conflictCount * 100000 +
    summary.impossibleTransitionCount * 10000 +
    summary.tightTransitionCount * 1000 +
    summary.unknownTransitionCount * 250 +
    maxDailyMinutes +
    Math.round(totalIdleMinutes * 0.15);

  return {
    score,
    summary,
    maxDailyMinutes,
    totalIdleMinutes
  };
}

export function chooseBestSections(groups, assignments = [], options = {}) {
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error("groups must contain at least one course choice group");
  }
  const combinations = groups.reduce((product, group) => product * group.length, 1);
  const limit = options.maxCombinations ?? 5000;
  if (combinations > limit) {
    throw new Error(`Too many combinations: ${combinations} > ${limit}`);
  }

  const candidates = cartesian(groups).map(courses => ({
    courses,
    ...scoreSchedule(courses, assignments, options)
  }));
  candidates.sort((a, b) => a.score - b.score);

  const best = candidates[0];
  return {
    combinationsEvaluated: candidates.length,
    score: best.score,
    courses: best.courses,
    summary: best.summary,
    alternatives: candidates.slice(1, 4).map(candidate => ({
      score: candidate.score,
      sections: candidate.courses.map(c => `${c.code}-${c.section ?? "default"}`)
    }))
  };
}
