import test from "node:test";
import assert from "node:assert/strict";
import {toICS} from "../src/ics.js";

test("exports a recurring timezone-aware calendar event", () => {
  const courses = [
    {
      code:"IM301",
      name:"Data Analytics",
      section:"A",
      meetings:[{day:"Mon",start:"09:10",end:"11:00",building:"Main"}]
    }
  ];
  const ics = toICS(courses, {startDate:"2026-09-14",weeks:18,tzid:"Asia/Taipei"});
  assert.match(ics, /DTSTART;TZID=Asia\/Taipei:20260914T091000/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;COUNT=18/);
  assert.match(ics, /LOCATION:Main/);
});
