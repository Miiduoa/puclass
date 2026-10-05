import fs from "node:fs";
import {buildSummary} from "./planner.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node src/cli.js <courses.json>");
  process.exit(2);
}

const payload = JSON.parse(fs.readFileSync(file, "utf8"));
const summary = buildSummary(payload.courses ?? [], payload.assignments ?? []);
console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.conflictCount > 0 ? 1 : 0;
