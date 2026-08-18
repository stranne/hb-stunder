# Project Agent Guidelines

- Commit completed work at the end of each task unless the user explicitly asks otherwise.
- Use Conventional Commit messages that clearly describe the change.
- Add or update Storybook stories whenever creating or changing UI components, views, or meaningful visual states.
- Keep stories focused on representative states, including relevant loading, empty, error, and interaction states where applicable.
- Treat the release-scope API integration as technically verified. Do not ask for public API, ordinary authenticated create/list/cancel, or planned-origin CORS verification again; use the sanitized evidence in `docs/public-runtime-evidence.md` and `docs/BOOKING_READINESS.md`. Investigate unknown edge contracts only when implementing behavior that depends on them.
