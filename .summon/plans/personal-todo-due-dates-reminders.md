---
status: pending
title: Personal Todo App with Due Dates and Reminders
---

## Context

The project is currently empty — no `package.json`, no `src/`, no Vite or router config exist yet. Phase 0 therefore establishes the scaffold; every later phase builds on it.

Scope is a single-person, single-device todo app. Persistence is browser local storage only — no accounts, no login, no backend. The headline feature set is **due dates and reminders**.

Out of scope (do not build): categories/projects, priority levels, subtasks, notes/attachments, recurring tasks, stats/history.

---

## Phase 0 — Project scaffold

1. Initialise the project with npm and create `package.json` with ESM (`"type": "module"`) and scripts for `dev`, `build`, and `preview`. Dependencies: `react`, `react-dom`, `@tanstack/react-router`. Dev dependencies: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@tailwindcss/vite`, `tailwindcss`, `@tanstack/router-plugin`.
   *Outcome:* dependency manifest in place, installable with `npm install`.

2. Create `vite.config.ts` registering, in order, the TanStack Router plugin from `@tanstack/router-plugin/vite` (configured for file-based routes in `src/routes`), the React plugin, and the Tailwind plugin from `@tailwindcss/vite`. Add a resolve alias mapping `@/` to `src/`.
   *Outcome:* `npm run dev` serves the app; route tree generates automatically.

3. Create `tsconfig.json` (and `tsconfig.node.json` if needed) with strict mode on, `moduleResolution` set to bundler, JSX set to `react-jsx`, and `paths` mapping `@/*` to `src/*` so the alias resolves in the editor too.
   *Outcome:* type-checking and alias imports work.

4. Create `index.html` at the project root with a root div and a module script pointing at `src/main.tsx`. Add viewport meta configured for mobile so the layout is responsive from the start.
   *Outcome:* app entry point exists.

5. Create `src/styles/global.css` whose first line is exactly `@import "tailwindcss";`. Add only a small set of base layer rules below it (default background/text colour, comfortable line height, smooth focus outlines).
   *Outcome:* the single stylesheet for the app.

6. Create `src/main.tsx` that imports `@/styles/global.css` exactly once, creates the router from the generated `src/routeTree.gen.ts`, and renders `RouterProvider` into the root element inside `StrictMode`. Never hand-write or edit `src/routeTree.gen.ts`.
   *Outcome:* app boots with routing and Tailwind active.

7. Create `src/routes/__root.tsx` as the app shell: a max-width centred column, a header showing the app title, a persistent bottom-or-top nav placeholder for the views, and an `Outlet`.
   *Outcome:* shell renders on every route.

8. Create `src/routes/index.tsx` as a temporary placeholder so the app renders something at `/`.
   *Outcome:* Phase 0 ends with a running, empty-but-styled app.

---

## Phase 1 — Data model and persistence

9. Create `src/types/task.ts` defining the `Task` shape: `id` (string), `title` (string), `completed` (boolean), `createdAt` (ISO string), `dueAt` (ISO string or null — null means no due date), `hasTime` (boolean — false means the due date is date-only and should be treated as end-of-day), and `reminderFiredAt` (ISO string or null — records that a reminder already fired so it does not repeat). Also export a `DueStatus` union: `none | overdue | today | soon | later`.
   *Outcome:* one canonical task type consumed everywhere.

10. Create `src/lib/storage.ts` with a single storage key constant, a schema-version constant, a `loadTasks` function, and a `saveTasks` function. `loadTasks` must be fully defensive: wrap `localStorage` access in try/catch (private-mode and quota errors), return an empty array when the key is missing, return an empty array when `JSON.parse` throws, and when parsing succeeds validate that the payload is an array and filter out any entry that fails a per-task type guard. Unknown or missing optional fields (`dueAt`, `hasTime`, `reminderFiredAt`) get sane defaults rather than causing a discard.
    *Outcome:* malformed or absent storage never crashes the app; the worst case is an empty list.

11. Add a `isTask` type guard and a `normaliseTask` helper in `src/lib/storage.ts` (or a sibling `src/lib/taskSchema.ts` if the file grows past comfortable size) used by `loadTasks`.
    *Outcome:* validation logic is testable and reused.

12. Create `src/lib/date.ts` with pure date helpers built on native `Date` and `Intl` (no date library): start-of-day, end-of-day, is-same-day, `getDueStatus(task, now)` returning a `DueStatus`, a human-readable relative due label ("Overdue by 2h", "Today at 18:00", "Tomorrow", "Fri 12 Jun"), and a formatter for the datetime-local input value.
    *Outcome:* all due-date reasoning lives in one place, keeping components dumb.

13. Create `src/hooks/useTasks.ts` as the single source of truth for task state: initialise from `loadTasks`, expose the task array plus `addTask`, `updateTask`, `toggleTask`, `deleteTask`, and `markReminderFired`, and persist to storage via an effect on every change. Generate ids with `crypto.randomUUID()`.
    *Outcome:* one hook owning all mutations and persistence.

14. Create `src/lib/tasksContext.tsx` exposing a React context provider wrapping `useTasks` plus a `useTaskStore` consumer hook, and mount the provider in `src/routes/__root.tsx`. This avoids a third-party state library while letting every route and the reminder engine share one list.
    *Outcome:* shared task state across all routes; refresh preserves tasks.

---

## Phase 2 — Core task CRUD

15. Create `src/components/QuickAddForm.tsx`: a single always-visible text input with a submit button, autofocused on mount. Enter submits and immediately re-focuses the input for rapid entry; Escape clears the field. Blank or whitespace-only titles are rejected without an error dialog. Include an optional due-date control (added fully in Phase 3) as a collapsed affordance so the markup is ready.
    *Outcome:* keyboard-friendly capture of a task in one keystroke sequence.

16. Create `src/components/TaskItem.tsx`: a checkbox toggling `completed`, the title, the due-date badge slot, and a delete button. Completed tasks render with strikethrough and reduced opacity. All controls are real buttons/inputs with accessible labels so the row is keyboard-navigable.
    *Outcome:* toggle and delete work per task.

17. Add inline title editing to `src/components/TaskItem.tsx`: clicking the title (or pressing Enter on it) swaps it for a text input seeded with the current title; Enter or blur commits via `updateTask`, Escape cancels. An empty commit reverts rather than deleting.
    *Outcome:* edit title without a modal.

18. Create `src/components/TaskList.tsx` rendering an ordered list of `TaskItem`s from a passed-in task array, and `src/components/EmptyState.tsx` accepting a headline plus a short supporting line. Wire distinct empty-state copy per view: no tasks at all ("Nothing here yet — add your first task above"), nothing due today ("You're clear for today"), no upcoming ("No upcoming due dates"), nothing completed ("Completed tasks will show up here").
    *Outcome:* every view reads intentionally when empty, never blank.

19. Replace the placeholder in `src/routes/index.tsx` with the real Today view composed of `QuickAddForm` and `TaskList`.
    *Outcome:* Phase 2 ends with a fully usable todo app that survives refresh.

---

## Phase 3 — Due dates

20. Extend `src/components/QuickAddForm.tsx` with an optional due-date field: a `date` input plus a separate optional `time` input. Leaving both blank stores `dueAt: null`. Filling the date only stores the date with `hasTime: false`. Filling both stores `hasTime: true`. Add one-tap shortcut buttons — Today, Tomorrow, Next week, Clear.
    *Outcome:* due dates can be set at capture time with minimal typing.

21. Create `src/components/DueDatePicker.tsx` wrapping that date + time + shortcuts control so it can be reused inside `TaskItem` for editing an existing task's due date, and use it there via `updateTask`.
    *Outcome:* due dates are editable after creation, including clearing them.

22. Create `src/components/DueBadge.tsx` rendering the label from `src/lib/date.ts` with visual treatment driven by `DueStatus`: `overdue` in a strong warning colour with an icon, `today` in an accent colour, `soon` (within the next 48 hours) in a muted accent, `later` in neutral grey, and `none` rendering no badge at all. Never rely on colour alone — each state also differs by label text and icon.
    *Outcome:* due urgency is legible at a glance and accessible.

23. Add sorting and grouping in `src/lib/sortTasks.ts`: within a view, incomplete tasks come before completed ones; incomplete tasks sort by `dueAt` ascending with nulls last; ties break by `createdAt`. Export a grouping helper that buckets tasks into Overdue / Today / Tomorrow / This week / Later / No due date for use by the Upcoming view.
    *Outcome:* what is due next is always at the top without the user sorting anything.

24. Render group headings in `src/components/TaskList.tsx` when a grouped array is supplied, with an Overdue heading styled to draw the eye.
    *Outcome:* Phase 3 ends with due dates as the organising principle of the app.

---

## Phase 4 — Reminders

25. Create `src/lib/notifications.ts` wrapping the browser Notification API: a `isSupported` check for `"Notification" in window`, a `getPermission` reader, a `requestPermission` function, and a `showNotification` function that no-ops safely when unsupported or not granted. All calls are guarded in try/catch since some browsers throw on constructor use.
    *Outcome:* a single safe boundary around a patchy browser API.

26. Create `src/hooks/useNotificationPermission.ts` tracking permission state (`unsupported | default | granted | denied`) and exposing a request action. Persist a "user has been asked" flag in local storage so the app never nags after a decline.
    *Outcome:* permission state available to the UI.

27. Create `src/components/ReminderPermissionCard.tsx`: a dismissible, calm card shown only when the state is `default`, explaining in one sentence what reminders do and offering an Enable button. When the state is `denied` or `unsupported`, it instead shows a short line saying reminders will appear inside the app instead. Never auto-request permission on page load — only on an explicit click, so the browser prompt is never a surprise.
    *Outcome:* honest, non-intrusive permission flow.

28. Create `src/hooks/useReminderEngine.ts`: a polling loop on a `setInterval` of roughly 30 seconds (plus an immediate run on mount and a run on `visibilitychange` when the tab becomes visible, to catch time passed while backgrounded). Each tick scans tasks for any that are incomplete, have a non-null `dueAt` now in the past or within the lead window, and have `reminderFiredAt === null`. For each match it fires one reminder and calls `markReminderFired` so it never repeats. Clearing or moving a due date forward resets `reminderFiredAt` to null in `updateTask`.
    *Outcome:* due tasks reliably fire exactly one reminder each while the app is open.

29. Route each fired reminder through a dispatcher that prefers a system notification when permission is `granted`, and otherwise always falls back to an in-app banner — so the fallback path is the default, not an error case. Create `src/components/ToastHost.tsx` plus `src/hooks/useToasts.ts` for a stacked, auto-dismissing, manually-closable in-app toast, mounted in `src/routes/__root.tsx`. Toasts are polite ARIA live regions.
    *Outcome:* reminders are never silently lost, regardless of permission.

30. Add an always-visible overdue summary strip to `src/routes/__root.tsx` — a compact "3 tasks overdue" affordance linking to the Today view — so missed reminders are still recoverable by looking at the app.
    *Outcome:* the app itself is the durable reminder surface.

31. Add an honest limitation note in `src/components/ReminderPermissionCard.tsx` and in a small footer line: reminders only fire while this app is open in a browser tab; the app cannot notify you in the background because everything is stored on this device with no server. Do not imply background delivery anywhere in the copy, and do not promise it in the permission prompt text.
    *Outcome:* Phase 4 ends with reminders that work as advertised and advertise only what they do.

---

## Phase 5 — Views and filters

32. Create `src/lib/filters.ts` with pure predicates deriving each view from the single task array: Today (incomplete, due today or overdue), Upcoming (incomplete, due after today, grouped), All (every incomplete task plus a collapsed completed section or all tasks unsorted by status), Completed (completed only, most recently completed first).
    *Outcome:* views are derived, never duplicated state.

33. Create the routes: `src/routes/index.tsx` (Today, already the entry view), `src/routes/upcoming.tsx`, `src/routes/all.tsx`, and `src/routes/completed.tsx`. Each composes `TaskList` with its filter and its empty state; `QuickAddForm` appears on Today and All. Let the router plugin regenerate `src/routeTree.gen.ts` — never edit it.
    *Outcome:* four linkable, refreshable views.

34. Create `src/components/ViewNav.tsx` using TanStack Router `Link` with `activeProps` for the active style, and show a count badge per view (e.g. overdue count on Today). Mount it in `src/routes/__root.tsx`. On mobile it renders as a fixed bottom bar with large touch targets; on wider screens it sits in the header.
    *Outcome:* Phase 5 ends with navigation between all views and correct active states.

---

## Phase 6 — UI/UX polish

35. Define the visual language in `src/styles/global.css` using Tailwind v4 `@theme` tokens: a restrained neutral palette, one accent colour, a distinct warning colour reserved for overdue, generous spacing, and rounded corners. Keep the feel calm — no more than one saturated colour on screen at a time.
    *Outcome:* consistent, low-noise styling from utility classes only.

36. Verify the mobile layout end to end at a narrow viewport: single column, sticky quick-add at the top, bottom nav clear of the last list item via bottom padding, touch targets at least 44px, and no horizontal scroll. Adjust with responsive utility prefixes only.
    *Outcome:* comfortable one-handed phone use.

37. Add keyboard affordances: global `n` focuses the quick-add input when no field is focused, Escape blurs it, and every interactive element has a visible focus ring. Document the shortcut in small helper text near the input.
    *Outcome:* fast keyboard-only operation.

38. Accessibility and robustness sweep: semantic list markup, labelled checkboxes and icon buttons, `aria-live` on the toast host, colour-independent due states, and a confirmation-free delete paired with a short undo toast so no destructive action needs a dialog.
    *Outcome:* accessible and forgiving.

39. Final pass: run a type-check and a production build, then manually verify the acceptance list — add a task, edit its title, set and clear a due date, see overdue styling, receive a reminder with permission granted, receive an in-app toast with permission denied, confirm a reminder fires only once, complete and delete a task, switch all four views, and hard-refresh to confirm every task and its due date persisted.
    *Outcome:* shippable app meeting all confirmed requirements.

---

## Possible future additions (explicitly NOT part of this plan)

These were not selected by the user and must not be designed in or stubbed out now. Listed only so the data model above is not accidentally hostile to them later:

- Categories or projects
- Priority levels
- Subtasks
- Notes and attachments
- Recurring tasks
- Stats and completion history
- Background push notifications (would require a service worker and a backend, contradicting the local-only requirement)
