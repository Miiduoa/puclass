import test from "node:test";
import assert from "node:assert/strict";
import {buildSummary, detectConflicts, pressureScore, toMinutes} from "../src/planner.js";

test("converts clock time to minutes", () => {
  assert.equal(toMinutes("09:10"), 550);
});

test("detects only overlapping meetings on the same day", () => {
  const courses = [
    {code:"A",name:"A",meetings:[{day:"Mon",start:"09:00",end:"10:00"}]},
    {code:"B",name:"B",meetings:[{day:"Mon",start:"09:30",end:"11:00"}]},
    {code:"C",name:"C",meetings:[{day:"Tue",start:"09:30",end:"11:00"}]}
  ];
  const conflicts = detectConflicts(courses);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].overlapMinutes, 30);
});

test("builds a stable weekly summary", () => {
  const courses = [{code:"A",name:"A",meetings:[{day:"Mon",start:"09:00",end:"11:00"}]}];
  const result = buildSummary(courses, [{title:"Exam",kind:"exam"}]);
  assert.equal(result.weeklyHours, 2);
  assert.equal(result.busiestDay.day, "Mon");
  assert.equal(result.conflictCount, 0);
});

test("pressure score stays within 0 to 100", () => {
  const courses = [{code:"A",name:"A",meetings:[{day:"Mon",start:"00:00",end:"23:59"}]}];
  assert.ok(pressureScore(courses, Array(30).fill({kind:"exam"})) <= 100);
});
