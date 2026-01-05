# Agent Instructions

- Use `npm` for package management commands (e.g., `npm install`, `npm run build`). Do **not** use `pnpm`.
- Always provide a page screenshot after completing a job.
- All REST/WebSocket requests must live in dedicated API modules, never inside UI components.
- Demo/dummy data fixtures must be included for testing/development, but must be amazingly simple.

Example (API modules + UI usage):

```ts
// src/api/user.ts
export async function fetchUser(id: string) {
  return fetch(`/api/users/${id}`).then((res) => res.json());
}

// src/components/UserCard.tsx
import { fetchUser } from "../api/user";
```
