import fs from "node:fs";
import {buildSummary} from "./planner.js";
import {chooseBestSections} from "./optimizer.js";
import {toICS} from "./ics.js";

const [file, ...args] = process.argv.slice(2);
if (!file) {
  console.error("Usage: node src/cli.js <payload.json> [--ics schedule.ics]");
  process.exit(2);
}

const payload = JSON.parse(fs.readFileSync(file, "utf8"));
const options = {
  travelMatrix: payload.travelMinutes ?? {},
  bufferMinutes: payload.bufferMinutes ?? 5
};

let courses;
let result;
if (Array.isArray(payload.courseChoices)) {
  result = chooseBestSections(payload.courseChoices, payload.assignments ?? [], options);
  courses = result.courses;
} else {
  courses = payload.courses ?? [];
  result = buildSummary(courses, payload.assignments ?? [], options);
}

console.log(JSON.stringify(result, null, 2));

const icsIndex = args.indexOf("--ics");
if (icsIndex >= 0) {
  const out = args[icsIndex + 1];
  if (!out) throw new Error("--ics requires an output path");
  fs.writeFileSync(out, toICS(courses, payload.calendar ?? {}));
}

const summary = result.summary ?? result;
process.exitCode =
  summary.conflictCount > 0 || summary.impossibleTransitionCount > 0 ? 1 : 0;
