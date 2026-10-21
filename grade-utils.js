(function (root, factory) {
  const utils = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = utils;
  } else {
    root.GradeMateUtils = utils;
  }
})(globalThis, function () {
  "use strict";

  const SCALE = [
    { min: 70, grade: "A", points: 5 },
    { min: 60, grade: "B", points: 4 },
    { min: 50, grade: "C", points: 3 },
    { min: 45, grade: "D", points: 2 },
    { min: 40, grade: "E", points: 1 },
    { min: 0, grade: "F", points: 0 },
  ];

  function getGrade(score) {
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return null;
    }

    return SCALE.find((band) => score >= band.min) || null;
  }

  function validateCourseFields(course) {
    const code = String(course?.code ?? "").trim();
    const unitsText = String(course?.units ?? "").trim();
    const scoreText = String(course?.score ?? "").trim();

    const units = Number(unitsText);
    const score = Number(scoreText);

    const errors = {
      code: code ? "" : "Add a course code.",
      units: !unitsText
        ? "Add credit units."
        : !Number.isFinite(units) || units <= 0
          ? "Use a number above 0."
          : "",
      score: !scoreText
        ? "Add a score."
        : !Number.isFinite(score) || score < 0 || score > 100
          ? "Use a score from 0 to 100."
          : "",
    };

    const complete = !errors.code && !errors.units && !errors.score;

    return {
      errors,
      complete,
      units,
      score,
      grade: complete ? getGrade(score) : null,
    };
  }

  function calculateGpa(courses) {
    let units = 0;
    let points = 0;
    let completeCount = 0;

    for (const course of courses) {
      const result = validateCourseFields(course);

      if (!result.complete) continue;

      completeCount += 1;
      units += result.units;
      points += result.units * result.grade.points;
    }

    const incompleteCount = courses.length - completeCount;

    return {
      units,
      points,
      completeCount,
      incompleteCount,
      gpa: completeCount > 0 ? points / units : null,
    };
  }

  return Object.freeze({
    getGrade,
    validateCourseFields,
    calculateGpa,
  });
});
