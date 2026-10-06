import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSummary,
  detectConflicts,
  detectTransitions,
  getTravelMinutes,
  pressureScore,
  toMinutes
} from "../src/planner.js";

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

test("travel matrix is symmetric when only one direction is provided", () => {
  const matrix = {Main: {RenYuan: 12}};
  assert.equal(getTravelMinutes("RenYuan", "Main", matrix), 12);
});

test("marks an impossible building transition", () => {
  const courses = [
    {code:"A",name:"A",meetings:[{day:"Mon",start:"09:00",end:"10:00",building:"Main"}]},
    {code:"B",name:"B",meetings:[{day:"Mon",start:"10:05",end:"11:00",building:"RenYuan"}]}
  ];
  const transitions = detectTransitions(courses, {Main:{RenYuan:12}}, 5);
  assert.equal(transitions[0].status, "impossible");
});

test("marks a tight but possible transition when buffer is missing", () => {
  const courses = [
    {code:"A",name:"A",meetings:[{day:"Mon",start:"09:00",end:"10:00",building:"Main"}]},
    {code:"B",name:"B",meetings:[{day:"Mon",start:"10:12",end:"11:00",building:"RenYuan"}]}
  ];
  const transitions = detectTransitions(courses, {Main:{RenYuan:12}}, 5);
  assert.equal(transitions[0].status, "tight");
});

test("build summary exposes transition risk", () => {
  const courses = [
    {code:"A",name:"A",meetings:[{day:"Mon",start:"09:00",end:"10:00",building:"Main"}]},
    {code:"B",name:"B",meetings:[{day:"Mon",start:"10:05",end:"11:00",building:"RenYuan"}]}
  ];
  const result = buildSummary(courses, [], {travelMatrix:{Main:{RenYuan:12}}});
  assert.equal(result.conflictCount, 0);
  assert.equal(result.impossibleTransitionCount, 1);
});

test("pressure score stays within 0 to 100", () => {
  const courses = [{code:"A",name:"A",meetings:[{day:"Mon",start:"00:00",end:"23:59"}]}];
  assert.ok(pressureScore(courses, Array(30).fill({kind:"exam"})) <= 100);
});
