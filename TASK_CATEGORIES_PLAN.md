# Task Categories: Design Plan

Goal: group tasks into Opening / Closing / General so picking them in the
Shift Builder's checklist pickers is faster than scrolling one flat
alphabetical list, and give both the Shift Builder pickers and the
clock-out checklist screen collapsible category sections. This is a
design plan only — no code changes yet.

## Current state

- `GlobalTask` (prisma) is a flat table: `id` + unique `name`. No grouping
  field of any kind.
- Full CRUD already exists: `app/api/tasks/route.ts` (create/rename/delete,
  with rename propagating into every template's `checklistTasks`), and a
  real management screen at `app/components/TasksTab.tsx` (Shift Setup →
  Tasks). Delete also propagates now (removes the name from templates).
- Tasks are picked via one shared component, `TaskChecklistPicker.tsx`,
  used in two places in the Shift Builder: the slide-out panel's "Facility
  Checklist" section, and the Bulk Template Builder tray's "Template
  Facility Checklist" section. It already has search, Select All, and
  inline "+ Add new task" — but the results list is one flat,
  alphabetically-sorted-by-selection list. This is the exact surface the
  user wants grouped.
- Templates reference tasks by **name string**, not ID
  (`ShiftTemplate.checklistTasks: string[]`). A third consumer,
  `TimesheetsTab.tsx`'s `ShiftReportEditor` (the clock-out closing
  checklist), also just renders `assignedTasks` as a flat list of name
  strings with no grouping.

## Design decision: a fixed category enum, not a free-form/custom taxonomy

Recommend a **small fixed list of categories** defined once in code
(`lib/common.ts`, alongside `AVAILABLE_ROLES`) — e.g.:

```ts
export const TASK_CATEGORIES = ['Opening', 'Closing', 'General'] as const;
```

(Dropped "Ongoing" — having both it and "General" as separate buckets was
judged confusing, since they'd overlap in practice. "General" alone
covers both "not opening/closing-specific" and "anything uncategorized,"
and doubles as the safe default for existing/new tasks.)

Why fixed over a free-form/custom-taxonomy (a separate `TaskCategory` table
users could add to): the ask is specifically "easier picking," which a
small, stable, predictable set of buckets solves directly. A user-editable
category table adds a second CRUD surface, a second delete-orphan problem
(same class of bug just fixed for tasks themselves), and lets categories
proliferate into another flat list needing organization. If real usage
later shows the fixed 3 aren't enough (e.g. per-location categories), that
can become a v2 — the schema choice below doesn't block it.

- **Opening** — done at shift start.
- **Closing** — done at shift end (this is most of what exists today,
  based on the Tasks tab's current subtitle "required for facility
  closing").
- **General** — everything else, and the default bucket anything
  uncategorized lands in, so nothing is ever in a broken state.

## Schema change

Add one column to `GlobalTask`:

```prisma
model GlobalTask {
  id       Int    @id @default(autoincrement())
  name     String @unique
  category String @default("General")
}
```

A plain string (not a relation) matches the codebase's existing lightweight
conventions (`checklistTasks` is already a plain string array, not a join
table) and means the migration just backfills every existing row to
`"General"` — zero data loss, nothing to reconcile.

## Phase 1 — Category management (TasksTab)

1. **Add-task form**: add a category `<select>` next to the name input
   (defaults to "General"). `POST /api/tasks` accepts and stores it.
2. **Task list becomes grouped**, not flat: a collapsible section per
   category, in the fixed display order above, each showing its task count
   in the header (e.g. "Closing (8)"). Empty categories can be hidden or
   shown collapsed — hiding is probably cleaner.
3. **Rename row** gains a category `<select>` alongside the name input, so
   re-categorizing an existing task doesn't require delete+recreate.
   `PUT /api/tasks` accepts `category` and updates it.
4. Keep the existing "Used in N templates" badge per task — unchanged.
5. Optional: a small color per category (e.g. Opening=amber, Closing=purple,
   General=slate) reused in step 2's section headers and in Phase 2/3's
   pickers — cheap visual scanning aid, same pattern already used for
   location colors (`getLocationColor` in `lib/common.ts`).

## Phase 2 — Grouped picking (TaskChecklistPicker) — the actual ask

This is the component that matters most, since it's what a manager sees
while building a shift/template.

1. Replace the single flat `sorted` list with **one section per category**:
   category header (name + color dot + count) followed by that category's
   matching tasks, selected-first within each section (keep today's
   selected-first sort per group, just scoped to the group instead of the
   whole list).
2. Search still filters across everything; a category with zero matches
   collapses out of view entirely rather than showing an empty header.
3. Add a **per-category "select all in this section"** toggle next to each
   category header — e.g. click "Closing" to check every Closing task in
   one action. This is likely the single biggest speed win: most shifts
   want "all of Closing" or "all of Opening," not an item-by-item pick.
   The existing global "Select All" stays for the (rarer) all-categories
   case.
4. Inline "+ Add new task" gains the same category `<select>` as Phase 1's
   add form, defaulting to whichever category section the manager searched
   from (best-effort inference), otherwise "General."
5. **Collapsible categories**: each section header (in both this picker and
   Phase 3's clock-out checklist below) is a toggle — click to
   collapse/expand. Start expanded; collapsed state is local component
   state, not persisted across sessions. This is the "collapsible list"
   half of the ask, alongside the grouping itself.

## Phase 3 — Group the runtime clock-out checklist too

`TimesheetsTab.tsx`'s `ShiftReportEditor` (what staff actually fill out at
clock-out) currently renders `assignedTasks` as one flat list
(`app/components/TimesheetsTab.tsx:72`). Give it the same treatment as
Phase 2: one collapsible section per category (Opening → Closing →
General), each with its own progress count, instead of the current single
overall `progressPct`. This is now core to the plan, not a nice-to-have —
staff filling out a long checklist benefit from the same grouping/collapse
a manager gets while building it, and it makes it immediately visible if a
template was miscategorized (e.g. an Opening task showing up on a
closing-heavy shift).

## What does NOT need to change

- `ShiftTemplate.checklistTasks` stays a flat `string[]` of task names —
  category is a property of the *task*, not the assignment, so no
  migration needed there.
- The rename/delete propagation logic in `app/api/tasks/route.ts` is
  unaffected — it already keys off task name, which doesn't change here.
- `TaskChecklistPicker`'s `variant: 'light' | 'dark'` theming stays as-is;
  category color accents layer on top of it, not replace it.

## Suggested execution order

1. Schema migration (`category` column + default backfill to "General").
2. Phase 1 (TasksTab grouping + category picker on add/rename).
3. Phase 2 (TaskChecklistPicker grouping, collapsible sections,
   per-category select-all) — the Shift Builder side of the ask.
4. Phase 3 (clock-out checklist grouping + collapsible sections) — the
   other half of the ask, same pass as Phase 2 since it reuses the same
   grouping logic.

## Verification checklist

- Existing tasks all show up under "General" immediately after migration —
  nothing disappears or errors.
- Creating a task with each category, then filtering/grouping in
  TasksTab, TaskChecklistPicker, and the clock-out checklist, shows it in
  the right section in all three.
- Per-category "select all" in the picker only affects that category's
  tasks, not the whole list.
- Collapsing a category in the picker and in the clock-out checklist
  both work independently and don't affect other sections.
- Search (picker) still works across all categories and collapses empty
  sections.
- Renaming a task's category in TasksTab moves it to the new section
  everywhere without needing a page refresh.
- `npx tsc --noEmit` and `npx next build --webpack` clean.
