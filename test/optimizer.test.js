import test from "node:test";
import assert from "node:assert/strict";
import {chooseBestSections} from "../src/optimizer.js";

test("optimizer avoids a direct time conflict when another section exists", () => {
  const groups = [
    [
      {code:"A",name:"A",section:"1",meetings:[{day:"Mon",start:"09:00",end:"10:00"}]},
      {code:"A",name:"A",section:"2",meetings:[{day:"Tue",start:"09:00",end:"10:00"}]}
    ],
    [
      {code:"B",name:"B",section:"1",meetings:[{day:"Mon",start:"09:30",end:"10:30"}]}
    ]
  ];
  const result = chooseBestSections(groups);
  assert.equal(result.courses[0].section, "2");
  assert.equal(result.summary.conflictCount, 0);
});

test("optimizer rejects an excessive search space", () => {
  const group = Array.from({length: 100}, (_, i) => ({
    code:"A",name:"A",section:String(i),meetings:[{day:"Mon",start:"09:00",end:"10:00"}]
  }));
  assert.throws(() => chooseBestSections([group, group]), /Too many combinations/);
});
