# Agent Instructions

- Use `npm` for package management commands (e.g., `npm install`, `npm run build`). Do **not** use `pnpm`.
- Always provide a page screenshot after completing a job.

## App structure (app/)

This repository is developed/tested for a **closed network** deployment. The real internal API is not exposed in GitHub, and must not be required to run this repo in open environments. Therefore, development is **fixture/mock-first**: every UI flow should run against fixtures.

- `app/api/`: Thin API call wrappers (simple `get/post` etc.) targeting the internal API **when deployed**. In this repo, usage must remain compatible with fixtures/mocks (no internal URLs/secrets committed).
- `app/components/`: Shared UI components (layout, navigation, reusable widgets).
- `app/components/ui/`: **Shadcn UI only** (generated/managed primitives and their local wrappers).
- `app/config/`: Navigation and other app configuration (e.g., `navigation.ts`).
- `app/fixtures/`: Mock/fixture data and mock adapters used for development/testing (open environments).
- `app/hooks/`: Reusable React hooks (request lifecycle, polling, websocket adapters, UI state hooks).
- `app/lib/`: Shared utilities, theme, formatting, and ag-grid helpers (`ag-grid.ts`, `theme.ts`, `utils.ts`, etc.).
- `app/pages/`: Page-level components. **Subfolders are the default** (group each page and its local components together).
- `app/routes/`: Route definitions and route-level loaders (`dashboard.ts`, `common.ts`).

---

## Codex coding paradigm (agent guidance)

### Closed-network constraint (non-negotiable)
- Do **not** commit internal base URLs, credentials, headers, or proprietary endpoint details.
- The repo must be runnable without internal network access.
- Any new UI that depends on API data must include fixture coverage under `app/fixtures/`.

### API layer philosophy (thin + flexible)
`app/api/` is intentionally **thin**:
- Keep it as simple request wrappers (`get/post/put/delete`, websocket connect helpers).
- Avoid pushing strict typing onto unstructured endpoints. Prefer:
  - `unknown` / `Record<string, unknown>` at the boundary
  - light, local parsing/guards where the UI truly needs invariants
- Do not build heavy client abstractions or a rigid “contract layer” unless a domain proves stable and reused.

**Practical rule:** if the API response shape is volatile or unstructured, keep it loose in `app/api/` and validate/normalize *closest to the consumer* (page/feature), not globally.

### Fixtures/mocks are the default dev backend
- Every new page that reads API data must ship with:
  - a happy-path fixture
  - (when the UI branches) at least one empty/error fixture
- Keep fixtures deterministic and reviewable. Prefer small datasets.

### UI component boundaries
- `app/components/ui/` is **shadcn-only**.
  - Do not place general components here.
- `app/components/` is for shared app widgets/layout pieces reused across pages.
- Page-specific components live with the page under `app/pages/<page>/...`.

### Dependency direction
- `pages/` may import from: `components/`, `components/ui/`, `hooks/`, `lib/`, `api/`, `fixtures/` (if your mock strategy requires it).
- `api/` must not import UI code.
- `fixtures/` must not import UI code.

---

## How to add a new page (default: subfolder)

1. **Create the page folder (default)**
   - Add a folder under `app/pages/`, e.g.:
     - `app/pages/positions/`
   - Recommended contents:
     - `page.tsx` (or `index.tsx` if that is the project convention)
     - `components/` (page-local components)
     - `types.ts` (page-local view types, optional)
     - `state.ts` / `model.ts` (optional, if complexity warrants)

2. **Create the page entry component**
   - Implement the main page component in `app/pages/positions/page.tsx`.
   - Keep it composition-first; heavy reusable UI should be promoted to `app/components/` only when reused.

3. **Add the route**
   - Add/update `app/routes/positions.ts` to register:
     - path / id (match existing conventions)
     - loader (if used) + connect to the page component

4. **Add API calls (thin wrappers)**
   - Add minimal functions in `app/api/` (or `app/api/<domain>/` if you already group by domain) like:
     - `getPositions(params): Promise<unknown>`
     - `postOrder(payload): Promise<unknown>`
   - Keep boundary types loose unless stable.

5. **Add fixtures for the page’s data**
   - Add `app/fixtures/<domain>/...` or `app/fixtures/positions/...` (match existing fixture convention).
   - Provide the scenarios the page needs (happy/empty/error).

6. **Wire navigation (if user-facing)**
   - Update `app/config/navigation.ts` with label/path ordering.

---

## Agent review checklist
- No internal URLs/secrets or proprietary endpoint specifics were committed.
- New page is created as a subfolder under `app/pages/` (default) with page-local components colocated.
- Route is wired in `app/routes/`.
- Page runs against fixtures without internal network access.
- `app/components/ui/` contains only shadcn-related code; shared widgets go to `app/components/`.
- API wrappers remain thin; any necessary validation/normalization is done near the consumer.

