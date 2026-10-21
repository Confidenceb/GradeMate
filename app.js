import { getGrade, validateCourseFields, calculateGpa } from "./grade-utils.js";
(() => {
  "use strict";

  const STORAGE_KEY = "unilag-grademate-v1";
  const SCALE = [
    { min: 70, grade: "A", points: 5 },
    { min: 60, grade: "B", points: 4 },
    { min: 50, grade: "C", points: 3 },
    { min: 45, grade: "D", points: 2 },
    { min: 40, grade: "E", points: 1 },
    { min: 0, grade: "F", points: 0 },
  ];
  const COLOURS = ["sage", "lilac", "peach", "sky", "cream"];
  const COLOUR_VALUES = {
    sage: "#f5f6f2",
    lilac: "#f4f0f7",
    peach: "#faf2eb",
    sky: "#eef5f6",
    cream: "#f8f5e9",
  };
  const state = { courses: [], colour: "sage", storageAvailable: true };

  const courseList = document.querySelector("#course-list");
  const emptyState = document.querySelector("#empty-state");
  const panelFooter = document.querySelector("#panel-footer");
  const notice = document.querySelector("#app-notice");
  const gpaValue = document.querySelector("#gpa-value");
  const gpaNote = document.querySelector("#gpa-note");
  const unitTotal = document.querySelector("#unit-total");
  const courseTotal = document.querySelector("#course-total");
  const courseBadge = document.querySelector("#course-badge");
  const qualityTotal = document.querySelector("#quality-total");
  const meterFill = document.querySelector("#gpa-meter-fill");
  const colourDialog = document.querySelector("#colour-dialog");

  function makeId() {
    return (
      globalThis.crypto?.randomUUID?.() ||
      `course-${Date.now()}-${Math.random().toString(16).slice(2)}`
    );
  }

  function announce(message) {
    notice.textContent = message;
    notice.hidden = !message;
  }

  function safeCourse(candidate) {
    if (!candidate || typeof candidate !== "object") return null;
    return {
      id:
        typeof candidate.id === "string" && candidate.id
          ? candidate.id
          : makeId(),
      code:
        typeof candidate.code === "string" ? candidate.code.slice(0, 60) : "",
      units:
        typeof candidate.units === "string" ||
        typeof candidate.units === "number"
          ? String(candidate.units).slice(0, 12)
          : "",
      score:
        typeof candidate.score === "string" ||
        typeof candidate.score === "number"
          ? String(candidate.score).slice(0, 12)
          : "",
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object")
        throw new Error("Invalid saved data");
      if (Array.isArray(data.courses))
        state.courses = data.courses.map(safeCourse).filter(Boolean);
      if (COLOURS.includes(data.colour)) state.colour = data.colour;
      if (data.version !== 1)
        announce(
          "Some saved data came from an older format. We recovered what we could.",
        );
    } catch {
      state.storageAvailable = false;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* Session remains usable. */
      }
      announce(
        "We couldn’t restore the saved courses, so we opened a fresh workspace.",
      );
      updateStorageLabel();
    }
  }

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          courses: state.courses,
          colour: state.colour,
        }),
      );
      if (!state.storageAvailable) state.storageAvailable = true;
    } catch {
      state.storageAvailable = false;
      updateStorageLabel();
      announce(
        "Your workspace is usable, but this browser could not save changes. They may not survive a refresh.",
      );
    }
  }

  function updateStorageLabel() {
    const pill = document.querySelector(".local-pill");
    if (pill)
      pill.innerHTML = state.storageAvailable
        ? '<span class="status-dot"></span> Saved on this device'
        : '<span class="status-dot status-dot-off"></span> Session only';
  }

  function validation(course) {
    const result = GradeMateUtils.validateCourseFields(course);
    const code = course.code.trim();

    const duplicate =
      code &&
      state.courses.some(
        (other) =>
          other.id !== course.id &&
          other.code.trim().toLocaleUpperCase() === code.toLocaleUpperCase(),
      );

    return { ...result, duplicate };
  }

  function field(label, key, value, placeholder, inputMode, maxLength) {
    const wrapper = document.createElement("label");
    wrapper.className = "field-wrap";
    wrapper.dataset.field = key;
    const title = document.createElement("span");
    title.className = "field-label";
    title.textContent = label;
    const input = document.createElement("input");
    input.type = key === "code" ? "text" : "number";
    input.name = key;
    input.value = value;
    input.placeholder = placeholder;
    input.autocomplete = "off";
    input.setAttribute("aria-label", label);
    input.setAttribute("aria-invalid", "false");
    if (key !== "code") {
      input.inputMode = inputMode;
      input.min = key === "score" ? "0" : "0.01";
      input.max = key === "score" ? "100" : "999";
      input.step = key === "score" ? "1" : "any";
    } else {
      input.maxLength = maxLength;
    }
    const error = document.createElement("span");
    error.className = "field-error";
    error.id = `error-${key}-${makeId()}`;
    input.setAttribute("aria-describedby", error.id);
    wrapper.append(title, input, error);
    return wrapper;
  }

  function renderCourse(course) {
    const row = document.createElement("div");
    row.className = "course-row";
    row.dataset.id = course.id;
    row.append(
      field("Course code", "code", course.code, "e.g. CHM 201", "text", 60),
      field("Credit units", "units", course.units, "e.g. 3", "decimal", 12),
      field("Score / 100", "score", course.score, "e.g. 75", "decimal", 12),
    );

    const grade = document.createElement("div");
    grade.className = "course-grade";
    grade.dataset.grade = "true";
    grade.setAttribute("aria-label", "Calculated grade");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-course";
    remove.setAttribute(
      "aria-label",
      `Remove ${course.code.trim() || "course"}`,
    );
    remove.title = "Remove course";
    remove.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>';
    row.append(grade, remove);
    updateRow(row, course);
    return row;
  }

  function updateRow(row, course) {
    const result = validation(course);
    for (const key of ["code", "units", "score"]) {
      const input = row.querySelector(`[name="${key}"]`);
      const error = row.querySelector(`[data-field="${key}"] .field-error`);
      input.setAttribute("aria-invalid", result.errors[key] ? "true" : "false");
      error.textContent = result.errors[key];
    }
    const codeError = row.querySelector('[data-field="code"] .field-error');
    codeError.classList.toggle(
      "duplicate-warning",
      Boolean(result.duplicate && !result.errors.code),
    );
    if (result.duplicate && !result.errors.code)
      codeError.textContent = "This course code appears more than once.";
    row
      .querySelector(".remove-course")
      .setAttribute("aria-label", `Remove ${course.code.trim() || "course"}`);
    const gradeEl = row.querySelector("[data-grade]");
    gradeEl.replaceChildren();
    if (result.grade) {
      const pill = document.createElement("span");
      pill.className = `grade-pill${result.grade.grade === "F" ? " grade-f" : ""}`;
      pill.textContent = result.grade.grade;
      const point = document.createElement("span");
      point.className = "grade-point";
      point.textContent = `${result.grade.points} pts`;
      gradeEl.append(pill, point);
    } else {
      const pending = document.createElement("span");
      pending.className = "grade-pending";
      pending.textContent = "—";
      gradeEl.append(pending);
    }
  }

  function render() {
    courseList.replaceChildren(...state.courses.map(renderCourse));
    emptyState.hidden = state.courses.length > 0;
    panelFooter.hidden = state.courses.length === 0;
    document.querySelector(".course-head").hidden = state.courses.length === 0;
    refreshSummary();
    syncColours();
  }

  function refreshSummary() {
    const summary = GradeMateUtils.calculateGpa(state.courses);

    const { units, points, completeCount, incompleteCount, gpa } = summary;

    for (const course of state.courses) {
      const row = courseList.querySelector(
        `[data-id="${CSS.escape(course.id)}"]`,
      );

      if (row) updateRow(row, course);
    }

    courseTotal.textContent = String(state.courses.length);
    courseBadge.textContent = String(state.courses.length);
    unitTotal.textContent = formatNumber(units);
    qualityTotal.textContent = formatNumber(points);

    if (completeCount === 0) {
      gpaValue.innerHTML = `—<span>/ 5.00</span>`;
      gpaNote.textContent = state.courses.length
        ? "Finish a course to see your estimate"
        : "Add a course to get started";
      meterFill.style.width = "0%";
    } else {
      gpaValue.innerHTML = `${gpa.toFixed(2)}<span>/ 5.00</span>`;
      gpaNote.textContent = incompleteCount
        ? `Based on ${completeCount} complete ${completeCount === 1 ? "course" : "courses"} · ${incompleteCount} incomplete`
        : `Based on ${completeCount} ${completeCount === 1 ? "course" : "courses"}`;

      meterFill.style.width = `${Math.min(100, Math.max(0, (gpa / 5) * 100))}%`;
    }

    if (!state.storageAvailable) {
      announce(
        "Your workspace is usable, but this browser could not save changes. They may not survive a refresh.",
      );
    } else if (incompleteCount > 0) {
      announce(
        "Incomplete courses are excluded from this provisional GPA. Finish each course entry to include it.",
      );
    } else if (notice.textContent.startsWith("Incomplete courses")) {
      announce("");
    }
  }

  function formatNumber(value) {
    return Number.isInteger(value)
      ? String(value)
      : String(Number(value.toFixed(2)));
  }

  function addCourse() {
    const course = { id: makeId(), code: "", units: "", score: "" };
    state.courses.push(course);
    save();
    render();
    const input = courseList.querySelector(
      `[data-id="${CSS.escape(course.id)}"] [name="code"]`,
    );
    input?.focus();
    input?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function setColour(colour) {
    if (!COLOURS.includes(colour)) return;
    state.colour = colour;
    document.documentElement.style.setProperty(
      "--page-bg",
      COLOUR_VALUES[colour],
    );
    syncColours();
    save();
  }

  function syncColours() {
    document.documentElement.style.setProperty(
      "--page-bg",
      COLOUR_VALUES[state.colour],
    );
    document.querySelectorAll("[data-colour]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.colour === state.colour),
      );
    });
  }

  document.querySelector("#add-course").addEventListener("click", addCourse);
  document.querySelector("#empty-add").addEventListener("click", addCourse);

  courseList.addEventListener("input", (event) => {
    const input = event.target.closest("input");
    if (!input) return;
    const row = input.closest(".course-row");
    const course = state.courses.find((item) => item.id === row.dataset.id);
    if (!course) return;
    course[input.name] = input.value;
    updateRow(row, course);
    refreshSummary();
    save();
  });

  courseList.addEventListener("change", (event) => {
    const input = event.target.closest("input");
    if (!input || input.name === "code") return;
    if (input.value !== "" && Number.isFinite(Number(input.value))) {
      const limit = input.name === "score" ? 100 : 999;
      input.value = String(Math.min(limit, Math.max(0, Number(input.value))));
      const row = input.closest(".course-row");
      const course = state.courses.find((item) => item.id === row.dataset.id);
      if (course) course[input.name] = input.value;
      if (course) updateRow(row, course);
      refreshSummary();
      save();
    }
  });

  courseList.addEventListener("click", (event) => {
    const button = event.target.closest(".remove-course");
    if (!button) return;
    const row = button.closest(".course-row");
    state.courses = state.courses.filter(
      (course) => course.id !== row.dataset.id,
    );
    save();
    render();
  });

  document.querySelector("#reset-courses").addEventListener("click", () => {
    if (
      !state.courses.length ||
      !window.confirm(
        "Remove all courses from this browser? This can’t be undone.",
      )
    )
      return;
    state.courses = [];
    save();
    render();
    announce("All courses have been removed.");
  });

  document.querySelectorAll("[data-colour]").forEach((button) => {
    button.addEventListener("click", () => {
      setColour(button.dataset.colour);
      if (colourDialog.open) colourDialog.close();
    });
  });

  const resetColour = () => setColour("sage");
  document
    .querySelector("#reset-colour")
    .addEventListener("click", resetColour);
  document
    .querySelector("[data-dialog-reset]")
    .addEventListener("click", () => {
      resetColour();
      colourDialog.close();
    });
  document.querySelector("#theme-toggle").addEventListener("click", () => {
    if (typeof colourDialog.showModal === "function") colourDialog.showModal();
    else document.querySelector("#reset-colour").focus();
  });
  document
    .querySelector(".dialog-close")
    .addEventListener("click", () => colourDialog.close());
  colourDialog.addEventListener("click", (event) => {
    if (event.target === colourDialog) colourDialog.close();
  });

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (
      event.target.closest(
        "button, input, select, textarea, a, summary, label, dialog",
      )
    )
      return;
    const current = COLOURS.indexOf(state.colour);
    setColour(COLOURS[(current + 1) % COLOURS.length]);
  });

  load();
  updateStorageLabel();
  syncColours();
  render();
})();
