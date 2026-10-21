const test = require("node:test");
const assert = require("node:assert/strict");

require("../grade-utils.js");

const { getGrade, validateCourseFields, calculateGpa } =
  globalThis.GradeMateUtils;

test("grade boundaries follow the configured scale", () => {
  const cases = [
    [100, "A", 5],
    [70, "A", 5],
    [69, "B", 4],
    [60, "B", 4],
    [59, "C", 3],
    [50, "C", 3],
    [49, "D", 2],
    [45, "D", 2],
    [44, "E", 1],
    [40, "E", 1],
    [39, "F", 0],
    [0, "F", 0],
  ];

  for (const [score, expectedGrade, expectedPoints] of cases) {
    assert.deepEqual(getGrade(score), {
      min:
        expectedGrade === "A"
          ? 70
          : expectedGrade === "B"
            ? 60
            : expectedGrade === "C"
              ? 50
              : expectedGrade === "D"
                ? 45
                : expectedGrade === "E"
                  ? 40
                  : 0,
      grade: expectedGrade,
      points: expectedPoints,
    });
  }
});

test("invalid scores do not receive a grade", () => {
  for (const score of [-1, 101, NaN, Infinity, -Infinity]) {
    assert.equal(getGrade(score), null);
  }
});

test("a valid course passes field validation", () => {
  const result = validateCourseFields({
    code: "CHM 201",
    units: "3",
    score: "75",
  });

  assert.equal(result.complete, true);
  assert.deepEqual(result.errors, {
    code: "",
    units: "",
    score: "",
  });
  assert.equal(result.units, 3);
  assert.equal(result.score, 75);
  assert.equal(result.grade.grade, "A");
  assert.equal(result.grade.points, 5);
});

test("missing course fields are rejected", () => {
  const result = validateCourseFields({
    code: " ",
    units: "",
    score: "",
  });

  assert.equal(result.complete, false);
  assert.equal(result.errors.code, "Add a course code.");
  assert.equal(result.errors.units, "Add credit units.");
  assert.equal(result.errors.score, "Add a score.");
  assert.equal(result.grade, null);
});

test("invalid units and scores are rejected", () => {
  for (const units of ["0", "-2", "abc", "Infinity"]) {
    assert.notEqual(
      validateCourseFields({
        code: "CHM 201",
        units,
        score: "75",
      }).errors.units,
      "",
    );
  }

  for (const score of ["-1", "101", "abc", "Infinity"]) {
    assert.notEqual(
      validateCourseFields({
        code: "CHM 201",
        units: "3",
        score,
      }).errors.score,
      "",
    );
  }
});

test("GPA is weighted by credit units", () => {
  const result = calculateGpa([
    { code: "CHM 201", units: "3", score: "75" },
    { code: "CHM 202", units: "1", score: "65" },
  ]);

  assert.equal(result.units, 4);
  assert.equal(result.points, 19);
  assert.equal(result.completeCount, 2);
  assert.equal(result.incompleteCount, 0);
  assert.equal(result.gpa, 4.75);
});

test("incomplete courses are excluded from GPA", () => {
  const result = calculateGpa([
    { code: "CHM 201", units: "3", score: "75" },
    { code: "CHM 202", units: "", score: "" },
  ]);

  assert.equal(result.units, 3);
  assert.equal(result.points, 15);
  assert.equal(result.completeCount, 1);
  assert.equal(result.incompleteCount, 1);
  assert.equal(result.gpa, 5);
});

test("GPA is null when no courses are complete", () => {
  const result = calculateGpa([{ code: "CHM 201", units: "", score: "" }]);

  assert.equal(result.units, 0);
  assert.equal(result.points, 0);
  assert.equal(result.completeCount, 0);
  assert.equal(result.incompleteCount, 1);
  assert.equal(result.gpa, null);
});

test("an empty course list returns an empty summary", () => {
  assert.deepEqual(calculateGpa([]), {
    units: 0,
    points: 0,
    completeCount: 0,
    incompleteCount: 0,
    gpa: null,
  });
});
