# UNILAG GradeMate — Product Plan

**Status:** Planning  
**Version:** 1.0 draft  
**Product:** Responsive, single-page GPA calculator for UNILAG undergraduate students

## Product purpose

Help a student estimate a semester GPA by entering course codes, credit units, and marks. Show the resulting course grades and weighted GPA, save inputs in that browser, and make score changes easy to explore.

The calculator is an estimate based on student-entered information. It is not an official result, portal integration, or replacement for programme-specific academic guidance.

## Users and jobs

- **Primary:** UNILAG undergraduate who wants to calculate semester GPA without doing the weighted arithmetic manually.
- **Secondary:** Student experimenting with hypothetical marks to understand their possible GPA.

The first release has no sign-in, server, cloud sync, CGPA history, or official-record access.

## MVP scope

### Required

- Add, edit, and remove courses.
- Record course code, positive credit units, and a score from 0 through 100.
- Derive each complete course's letter grade and grade point from one documented grading configuration.
- Calculate credit-unit-weighted semester GPA and show total courses and units.
- Recalculate immediately as inputs change.
- Save course inputs and selected background colour in versioned browser local storage.
- Provide a reset-colour action and a separately confirmed reset-courses action.
- Support keyboard use, visible focus, readable contrast, and phone and desktop layouts.
- Make page-background clicks change colour only when the click is outside interactive controls; allow direct selection from colour swatches.
- Explain estimate, calculation, and local-storage limitations in the interface.

### Excluded from version 1

Accounts, backend or database, cross-device sync, CGPA tracking, student-portal integration, predictions, social features, and lecturer integrations.

## Academic calculation decisions

### Evidence and verification status

UNILAG's **2025 Student Life Cycle Guidelines** state that courses are graded on a 100-mark basis and that course marks receive letter grades and grade points, but do not publish the grade-band table in that document. UNILAG's DLI **2020–2022 Policy Guidelines** publish this 5-point scale:

| Score | Grade | Grade point |
| --- | --- | ---: |
| 70–100 | A | 5 |
| 60–69 | B | 4 |
| 50–59 | C | 3 |
| 45–49 | D | 2 |
| 40–44 | E | 1 |
| 0–39 | F | 0 |

The DLI document is official but its scope is distance learning. A 2021–2024 DLI Management Sciences handbook also states these bands and the weighted-unit calculation. The current university-wide 2025 guideline is less specific. **Therefore use the table as a provisional default, not as a verified rule for every UNILAG programme.** Before describing results as matching official UNILAG calculations, confirm the applicable scale and course treatment with the Directorate of Academic Affairs or relevant faculty. Until confirmed, label it “provisional 5-point scale” and identify the scope of its source.

### Provisional calculation

For complete, included courses:

`GPA = sum(credit units × grade point) / sum(credit units)`

Display to two decimal places. Calculate from unrounded values. A valid score of zero is an F worth zero points; it is not the same as a blank score. An empty course list displays `—`.

### Incomplete and special courses

- An incomplete course is excluded from the provisional GPA, while a visible notice says the result covers complete courses only and may change when entries are finished.
- Do not silently treat a blank score, units, or course code as a valid result. Mark the row incomplete; missing score or units excludes that row. Course code is required before the row is complete.
- Validate score as a finite number from 0 to 100 inclusive, and units as a finite positive number. Permit fractional credit units if students can enter them; confirm whether UNILAG course units are restricted to whole numbers before enforcing integers.
- Allow duplicate course codes but warn the student. Do not merge them automatically.
- Repeats, withdrawals, incomplete official grades, audited/exempted/pass-only courses, and courses excluded from GPA are out of scope for automatic policy handling in v1. Students should omit courses that do not contribute to GPA; the interface must say this plainly. Revisit only after official rules are confirmed.
- Failed grades contribute zero points and their units remain in the denominator in this provisional model.

## Main journey

1. Open the page and restore saved inputs and colour where possible.
2. See a short explanation and an empty state, or the current summary and course list.
3. Add a course and enter its code, units, and score.
4. See validation, derived grade, and updated provisional GPA immediately.
5. Continue editing; changes save automatically in the current browser.
6. Return later in that browser, or reset courses after confirmation. Resetting the background is independent.

## Interface plan

- **Header:** GradeMate name, short description, accessible colour control.
- **Summary:** prominent semester GPA, total units, and course count; incomplete-entry notice when relevant.
- **Course manager:** responsive, clearly labelled rows for course code, units, score, derived grade, and remove action; prominent Add course action.
- **Personalisation:** colour swatches, page-area cycling, and reset-colour control.
- **Footer/help:** scale and weighted formula, provisional/estimate notice, local-only storage explanation, and reset-courses action.
- **First visit:** no sample records; explain how to add the first course.

Visual direction: friendly and colourful, with a calm dashboard hierarchy, clear contrast, restrained transitions, and no reliance on colour alone to communicate grade or error state. Final tokens and exact layout are a design task before implementation.

## Data and failure handling

Persist only a versioned schema containing course IDs, course codes, units, scores, and selected background colour. Derive grades, totals, and GPA at runtime. Do not persist temporary validation or dialog state.

If storage is unavailable or saving fails, keep the current session usable and show a brief notice that changes may not survive refresh. If saved data is malformed or from an unsupported version, recover valid fields where safe; otherwise start empty and explain that saved data could not be restored. Never let parsing or storage errors crash the page.

## Acceptance criteria

- A student can add, edit, and remove one course without affecting other rows.
- Complete inputs display the configured grade and point; boundary scores 0, 39, 40, 44, 45, 49, 50, 59, 60, 69, 70, and 100 map consistently.
- GPA is weighted by units. Example: 3 units at 5 points and 2 units at 4 points gives 4.60.
- A zero score produces a valid F and remains in the denominator; a blank score remains incomplete.
- Invalid scores and units produce clear inline feedback and cannot silently change GPA.
- Incomplete entries are visible and excluded under the provisional rule, with a clear provisional-result notice.
- No complete courses displays `—`; a complete set of failing courses displays `0.00`.
- Changes recalculate immediately and course inputs/colour restore after a normal refresh when storage works.
- Resetting courses requires confirmation. Resetting colour restores the default and leaves courses intact.
- Page clicks outside controls cycle colour; swatches select the chosen colour; controls do not accidentally cycle it.
- Duplicate codes warn without blocking entry. Long codes and many rows remain usable without horizontal page overflow.
- Keyboard users can operate all actions; focus is visible; layouts work on phone and desktop widths.
- The interface states the scale's verification status, estimate status, and local-storage limitations.

## Delivery plan

1. **Policy gate:** seek confirmation of scale applicability, units format, excluded-course rules, repeats, withdrawals, and incomplete results. Keep the current 5-point scale visibly provisional until confirmed.
2. **Design:** settle visual tokens, mobile/desktop layout, empty state, row editing, validation, dialogs, and accessible colour behavior.
3. **Foundation:** create the single-page app structure, data model, validation, calculation functions, and versioned storage boundary.
4. **Core experience:** implement course entry/edit/delete, live grades and summaries, empty/incomplete states, persistence, and independent reset actions.
5. **Polish:** implement colour interactions, responsive behavior, accessibility details, error recovery, and calculation/help copy.
6. **Release review:** walk through every acceptance criterion, verify boundary arithmetic and persistence behavior, and review the final product against the policy confirmation. Testing is a planned release activity; no application code has been started in this planning step.

## Open decisions to resolve

1. Does the published DLI scale apply to the full-time undergraduate programmes this app targets, or are there approved programme-specific variants?
2. Are course units always whole numbers?
3. Which official rules apply to repeated, withdrawn, incomplete, audited/exempted, pass-only, and GPA-excluded courses?
4. Which background palette and default colour should ship?

## Source references

- [UNILAG Student Life Cycle Guidelines (2025)](https://unilag.edu.ng/wp-content/uploads/2025/04/Student-Life-Cycle-GUIDELINES-Hyperlinked.pdf) — university guideline; confirms 100-mark course grading, without publishing the grade bands in its grading section.
- [UNILAG DLI Policy Guidelines 2020–2022](https://dli.unilag.edu.ng/wp-content/uploads/2021/04/DLI_Policy_Guidelines_2020-2022.pdf) — official DLI policy; publishes the provisional 5-point score bands.
- [UNILAG DLI Management Sciences Handbook 2021–2024](https://www.dli.unilag.edu.ng/wp-content/uploads/2021/04/Handbook-Management-Sciences-2021-2024.pdf) — official programme handbook; describes weighted GPA and the same bands for its scope.
