# PRD — Agile Retro Platform MVP

## Context

The hackathon target is a frontend-only, mock-data MVP of an agile retrospective platform that demonstrates the full team-feedback loop: workspace per project, role-gated access, structured retro boards with voting, action-item tracking, retrospective history, exportable reports, and a downloadable project archive. The deliverable is a single-page React (Vite) app with no backend — a hand-curated seed file represents initial state, and all edits live in memory until reload. The PRD below captures every product decision reached in the grilling session and is the contract for implementation.

---

## 1. Goals & Non-Goals

### Goals
- Demonstrate a fully-interactive retro board that an agile team would recognize.
- Show role-based access control across four roles in a multi-project workspace model.
- Demo the value of cross-retro continuity: history timeline + cross-retro action items + per-project reports.
- Produce a single-click project archive (ZIP with JSON + PDF reports) the judges can open and inspect.

### Non-Goals
- Real authentication or accounts.
- Persistent storage across sessions (refresh = reset to seed).
- Real-time multi-user collaboration.
- Mobile-native experience (responsive web only).
- Backend, server, or external services.
- Dark mode (use shadcn default theme).

---

## 2. Tech Stack & Architecture

| Concern | Choice |
|---|---|
| Build / dev | Vite + React (TypeScript) |
| State | Zustand (single store, sliced: auth, projects, retros, ui) |
| UI components | shadcn/ui |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| PDF generation | `jspdf` |
| ZIP packaging | `jszip` |
| File save | `file-saver` |
| Forms | `react-hook-form` + `zod` |
| Date pickers | shadcn calendar + `date-fns` |
| Icons | `lucide-react` (ships with shadcn) |

### Directory layout (target)
```
src/
  app/
    routes.tsx              # React Router config
    App.tsx                 # shell + providers
  pages/
    LoginPage.tsx
    ProjectsPage.tsx
    project/
      ProjectShell.tsx      # tabs nav inside a project
      RetrosTab.tsx
      RetroBoardPage.tsx
      HistoryTab.tsx        # timeline
      ActionItemsTab.tsx
      ReportsTab.tsx
      ReportPage.tsx
      SettingsTab.tsx
  components/
    ui/                     # shadcn-generated
    auth/RoleSwitcher.tsx
    board/Column.tsx
    board/Card.tsx
    board/ActionItemList.tsx
    board/VoteButton.tsx
    filters/<feature>Filter.tsx
  stores/
    useAppStore.ts          # Zustand root
    slices/auth.ts
    slices/projects.ts
    slices/retros.ts
    slices/ui.ts
  domain/
    types.ts                # all entity types
    permissions.ts          # can(role, action, ctx) helper
    templates.ts            # retro templates
    seed.ts                 # static seed import + bootstrap
  features/
    export/projectZip.ts    # build ZIP
    export/reportPdf.ts     # build PDF for one report
  data/
    seed.json               # the static seed
  lib/
    cn.ts, format.ts
  main.tsx
```

---

## 3. Personas (Roles)

Roles are **per-project memberships** (the same user can be Admin in Project A and Viewer in Project B).

| Role | Mental model |
|---|---|
| **Admin** | Project owner. Manages members, settings, downloads, deletes. Does not run the meeting unless they want to. |
| **Scrum Master** | Runs the retro. Creates and closes retros, edits report summaries, marks reports final. |
| **Member** | Active participant. Adds cards, votes, drags cards, owns/edits own action items. |
| **Viewer** | Read-only stakeholder. Sees everything but cannot interact. |

---

## 4. Permission Matrix

| Action | Viewer | Member | Scrum Master | Admin |
|---|:---:|:---:|:---:|:---:|
| View project / retro / report / history | ✓ | ✓ | ✓ | ✓ |
| Add card to active retro | | ✓ | ✓ | ✓ |
| Vote on cards | | ✓ | ✓ | ✓ |
| Drag/reorder cards (active retro) | | ✓ | ✓ | ✓ |
| Add action item to a card | | ✓ | ✓ | ✓ |
| Edit own card / own action item | | ✓ | ✓ | ✓ |
| Edit / delete ANY card or action item | | | ✓ | ✓ |
| Create retro | | | ✓ | ✓ |
| Close retro | | | ✓ | ✓ |
| Edit report summary | | | ✓ | ✓ |
| Mark report "Final" | | | ✓ | ✓ |
| Create new project (becomes its Admin) | ✓ | ✓ | ✓ | ✓ |
| Add / remove members | | | | ✓ |
| Change a member's role | | | | ✓ |
| Delete project | | | | ✓ |
| Download project ZIP | | | | ✓ |

**Anonymity note:** cards always display "Anonymous" in the UI. Authorship is tracked internally so Members can edit their own cards. The internal author identity is never rendered to the user except via a developer hint when the dev role-switcher is active.

---

## 5. Domain Model

```ts
type UserId = string;
type ProjectId = string;
type RetroId = string;
type CardId = string;
type ActionItemId = string;
type ReportId = string;

type Role = 'admin' | 'scrum_master' | 'member' | 'viewer';

interface User {
  id: UserId;
  name: string;
  avatarColor: string;            // for UI dot
}

interface Membership {
  userId: UserId;
  role: Role;
}

interface Project {
  id: ProjectId;
  name: string;
  description?: string;
  createdAt: string;              // ISO
  members: Membership[];
}

type RetroStatus = 'active' | 'closed';

interface RetroTemplate {
  id: string;
  name: string;
  columns: { key: string; title: string }[];
}

interface Retro {
  id: RetroId;
  projectId: ProjectId;
  title: string;
  templateId: string;
  status: RetroStatus;
  createdAt: string;
  closedAt?: string;
  voteBudgetPerUser: number;      // default 3
  cards: Card[];
}

interface Card {
  id: CardId;
  retroId: RetroId;
  columnKey: string;              // matches template.columns[].key
  text: string;
  authorId: UserId;               // tracked internally; not rendered
  order: number;                  // for sortable
  votes: Vote[];
  actionItems: ActionItem[];
}

interface Vote {
  userId: UserId;
  // multiple Vote rows per (card,user) are allowed = stacked votes
}

type ActionItemStatus = 'open' | 'in_progress' | 'done';

interface ActionItem {
  id: ActionItemId;
  cardId: CardId;
  title: string;
  assigneeId?: UserId;
  dueDate?: string;               // ISO date
  status: ActionItemStatus;
  createdAt: string;
}

interface Report {
  id: ReportId;
  retroId: RetroId;
  generatedAt: string;
  isFinal: boolean;
  summary: string;                // editable free-text markdown
  // computed-on-render fields: top cards, action item rollup, etc.
}
```

---

## 6. User Stories & Feature Specs

### 6.1 Login (mock)
- **US-LOGIN-1** As a visitor, I see a login screen listing seeded users with their default project roles, and I click one to enter the app.
- **US-LOGIN-2** As a developer/judge, a floating Role Switcher widget (bottom-right corner) lets me change the active user without re-logging.
- Seeded users (4): `Alice (Admin)`, `Bob (Scrum Master)`, `Carol (Member)`, `Dan (Viewer)` — these are their roles in the *primary* seeded project.

### 6.2 Projects List
- **US-PRJ-1** As a logged-in user I see the list of projects I am a member of, with my role on each project rendered as a badge.
- **US-PRJ-2** I can filter the list by project name (text input) and by my role.
- **US-PRJ-3** Any logged-in user can click "New Project" → form (name, description) → creates a project where they are the Admin and the only member.

### 6.3 Project Workspace Shell
- Selecting a project enters a tabbed workspace: **Retros · History · Action Items · Reports · Settings**.
- Top bar shows project name + active user + role-on-this-project badge. Sidebar can switch back to project list.

### 6.4 Retros (per project)
- **US-RET-1** Members+ see a list of the project's retros, status pill (Active/Closed), template name, date, vote/card counts.
- **US-RET-2** List filterable by status, template, and date range.
- **US-RET-3** Scrum Master / Admin: "New Retro" → modal with title, template picker (from templates list, see §6.4.1), vote budget (default 3) → creates Active retro.

#### 6.4.1 Templates shipped
The template engine supports many; the seed ships **one** built-in template:
- **What went well / What went badly** (2 columns)

(The data model and template picker UI accommodate adding more templates later without code changes outside `domain/templates.ts`.)

### 6.5 Retro Board
- **US-BRD-1** Columns from the chosen template. Cards in each column.
- **US-BRD-2** Member+ on Active retro: "Add card" inline at top of each column → typing a line creates the card.
- **US-BRD-3** Cards display: text, vote count, action-item count badge. **Author is never displayed (always anonymous).**
- **US-BRD-4** Drag-and-drop (Member+ on Active retro): move card across columns and reorder within a column. `@dnd-kit` sortable contexts per column.
- **US-BRD-5** Voting: each user has a `voteBudgetPerUser` (default 3) per retro. Tap "+" on a card to spend a vote (multiple votes per card allowed = "dot stacking"). Tap "−" to reclaim if you put it there. Top of board shows "X / N votes remaining."
- **US-BRD-6** Card detail (modal or expandable): edit text (own card or Scrum Master+), delete card (Scrum Master+ or own as Member), and the action items list.
- **US-BRD-7** Action items inside a card: list of items with title, assignee picker, due date picker, status pill (Open / In Progress / Done). Member+ can add and edit own items; Scrum Master+ can edit any.
- **US-BRD-8** "Close Retro" button (Scrum Master / Admin only) → confirms → flips status to Closed → auto-generates a Report (skeleton) → board becomes read-only.

### 6.6 History (timeline view)
- **US-HIS-1** Per-project chronological timeline of all retros (active and closed), each as a marker on a vertical timeline showing date, title, status, top metric (cards, votes, action items).
- **US-HIS-2** Click a marker to open the retro board in **read-only mode** (same UI as the live board, all interactive controls disabled). For closed retros, also a link to the report.
- **US-HIS-3** Filter the timeline by date range and status.

### 6.7 Action Items (cross-retro view)
- **US-AI-1** Per-project page listing every action item across all retros.
- **US-AI-2** Filterable by assignee, status, source retro.
- **US-AI-3** Sortable by due date / status.
- **US-AI-4** Status can be edited inline (Member+ on own, Scrum Master+ on any). Clicking the source retro opens the originating board (read-only if closed).

### 6.8 Reports
- **US-REP-1** On retro close, the system creates a Report with: retro metadata, per-column top-voted cards, vote totals, action item rollup grouped by status. These fields are computed views over the retro state — they reflect current state if the (closed) retro is somehow updated (e.g., action item statuses change post-close, which is allowed).
- **US-REP-2** Scrum Master / Admin can edit a free-text **Summary** field (markdown, single textarea + preview).
- **US-REP-3** Scrum Master / Admin can mark report **Final** (badge appears, summary becomes uneditable until un-finalized).
- **US-REP-4** Per-project Reports tab lists all reports with status (Draft/Final), date, retro title.
- **US-REP-5** Per-report "Download PDF" button (anyone who can view).

### 6.9 Settings (per project, Admin only)
- **US-SET-1** Members table: name, role, "Remove" button.
- **US-SET-2** "Add Member": picks from the global users list (those not already members) and assigns a role.
- **US-SET-3** Inline role-change dropdown for any existing member.
- **US-SET-4** "Delete Project" with confirmation.

### 6.10 Project Download
- **US-DL-1** Admin only. "Download Project" button (top-right of project shell or in Settings).
- **US-DL-2** Produces `<project-slug>-<YYYY-MM-DD>.zip` containing:
  - `project.json` — full project state (members, retros, cards, votes, action items, reports).
  - `reports/<retro-title-or-id>.pdf` — one PDF per closed retro's report.
  - `README.md` — short export notes (project name, exported at, role of exporter, format notes).

### 6.11 Filters (cross-cutting)
- **Per-list, scoped** (no global search). Each major list view owns its own filter bar:

| List | Filters |
|---|---|
| Projects | name (text), my role |
| Retros (in project) | status, template, date range |
| Cards on a board | text search, column, min votes |
| History timeline | date range, status |
| Action Items (cross-retro) | assignee, status, source retro |
| Reports | status (Draft/Final), date |

---

## 7. UX & Navigation

- **Login page** at `/login`. Unauthenticated visits redirect here.
- **App shell** (post-login): top bar (logo, active user pill with avatar dot, dev Role Switcher), main content.
- **Routes:**
  - `/projects` — list
  - `/projects/new` — create form
  - `/projects/:projectId` — workspace shell (tabs)
    - `.../retros` (default tab)
    - `.../retros/:retroId` — board page
    - `.../history`
    - `.../action-items`
    - `.../reports`
    - `.../reports/:reportId`
    - `.../settings`
- **Permission gating** is rendered, not just hidden: disabled controls show a tooltip ("Scrum Master only"). Routes the active user can't access redirect to `/projects` with a toast.

---

## 8. Seed Data (`data/seed.json`)

Ship enough content to make every feature demonstrable on first paint:

- 4 users: Alice, Bob, Carol, Dan (with avatar color seeds).
- 2 projects:
  - **"Phoenix Engineering"** — full membership (Alice=Admin, Bob=SM, Carol=Member, Dan=Viewer); 3 retros (1 Active with 4–6 cards, votes, 2 action items; 2 Closed with reports — one Draft, one Final).
  - **"Marketing Squad"** — Alice=Member only (tests cross-project role differences); 1 Active retro with light content.
- All cards in seed are anonymous — `authorId` set, never rendered.
- Action items span statuses (Open, In Progress, Done) and assignees so the cross-retro view shows variety.

---

## 9. Demo Script (happy path the build must support)

1. Land on Login → click "Bob (Scrum Master)" → land on Projects.
2. Filter Projects by name → open "Phoenix Engineering."
3. Retros tab → open the Active retro. Add a card. Vote on two cards. Drag a card to the other column. Open a card, add an action item with assignee + due date.
4. Click "Close Retro" → board becomes read-only, toast "Report generated."
5. Reports tab → open the new report → edit Summary → mark Final → Download PDF.
6. History tab → see the timeline with the just-closed retro at the top.
7. Action Items tab → filter by Carol → see assigned items across retros.
8. Switch user via floating Role Switcher → become Alice (Admin).
9. Settings tab → add Dan as Scrum Master in another existing role → demonstrate role change.
10. "Download Project" → ZIP downloads → unzip → show JSON + PDF + README.

---

## 10. Out of Scope (Explicit non-features)

- Persistence across browser refresh (intentionally resets to seed).
- Realtime multi-user.
- Email / notifications / invites.
- Phased retro flow (we're 2-state Active → Closed).
- Multi-template seed (only "What went well / What went badly" ships; engine supports more).
- Card grouping / clustering features.
- Auto-generated discussion timer.
- Comments on cards.

---

## 11. Implementation Phases

| Phase | Scope | Verification |
|---|---|---|
| **0. Bootstrap** | Vite + React + TS; Tailwind + shadcn init; Router; Zustand store skeleton; `domain/types.ts`; `domain/seed.ts` loads `data/seed.json` into store at app start | `pnpm dev` shows the empty app shell; React DevTools shows seeded store |
| **1. Auth mock** | LoginPage, RoleSwitcher widget, route guards, role-on-current-project resolver, `permissions.ts` with `can(user, action, ctx)` | Switch user → guarded routes redirect / toasts appear |
| **2. Projects + workspace shell** | ProjectsPage with filters, create-project flow, workspace tabs nav, members display | Browse to and through projects; create one as any role |
| **3. Retros + Board** | Retros list + filters; create retro; full board (columns/cards/votes/action items); dnd-kit; close-retro flow | Demo script steps 3–4 work end-to-end |
| **4. History timeline** | HistoryTab with vertical timeline; read-only board view for closed retros | Timeline renders; clicking past retros opens read-only board |
| **5. Cross-retro Action Items** | ActionItemsTab with filters and inline status edits | Filter by assignee/status across the seed |
| **6. Reports** | Auto-generate on close; report view + summary edit + Final flag; per-report PDF download (jsPDF) | Close retro → report appears → edit/mark final → download PDF |
| **7. Settings (Admin)** | Members table, add/remove/change role, delete project | Verify only Admin sees the tab and can act |
| **8. Project Download** | `features/export/projectZip.ts` (JSZip + jsPDF for each report) | Admin downloads ZIP; unzip locally to verify contents |
| **9. Polish** | Empty states, toasts, micro-animations, loading skeletons, README in repo | Demo script runs cleanly start-to-finish |

---

## 12. Verification (end-to-end)

After implementation, run the **Demo Script in §9 verbatim** as the acceptance test. In addition:

- Switch through every role (Viewer, Member, Scrum Master, Admin) and confirm:
  - Disabled controls show role-aware tooltips.
  - Forbidden routes redirect.
  - Each filter on each list reduces the visible set correctly.
- Open the downloaded ZIP and validate:
  - `project.json` parses, contains all expected keys.
  - Each report PDF renders.
  - `README.md` records the exporting user and timestamp.
- Refresh the page mid-demo and confirm app reverts to seed (this is the documented behavior, not a bug).

---

## 13. Open Items / Risks

- **PDF layout time**: jsPDF is bare-metal. Budget a half-day for the report layout (header + per-column top-3 cards + action items table + summary). If it eats too much time, fall back to `pdfmake` or render report HTML to PDF via `html2pdf.js`.
- **Drag interactions on small screens**: `@dnd-kit` sensors should support pointer + keyboard; mobile out of scope for the demo.
- **Anonymity vs. ownership**: The "Member edits own card" rule must be enforced via internal `authorId` even though UI never renders it. Permissions helper test cases should cover this directly.
- **Seed currency**: Demo dates in seed should be relative to "today" so the UI shows realistic-looking dates. Compute at boot from a `seedReferenceDate` offset, or hardcode dates close to the demo day.
