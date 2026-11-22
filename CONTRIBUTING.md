# Contributing to Tornio (formerly OpenPDF)

Thank you for helping improve Tornio. All contributors are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md) and architecture standards.

---

## Architecture & Engineering Principles

1. **Local-First by Default**: Core tools must execute 100% locally on `127.0.0.1` without uploading files or metadata to external services. Any intentional online tool must validate public URLs hop-by-hop via `safe_public_get` ([network.py](backend/app/utils/network.py)).
2. **Zero Unicode Emojis**: Code, UI copy, toast notifications, docs, and installer scripts use clean monochrome SVG icons (`lucide-react`) rather than Unicode emojis.
3. **Explicit Finite State Machines (`fsm.ts`)**: New frontend async flows must use discriminated union state machines (`AsyncResourceState`, `MutationState`) from `frontend/src/lib/fsm.ts` instead of loose `isLoading` booleans.
4. **License Compatibility**: Original Tornio contributions are submitted under **Apache License, Version 2.0** ([LICENSE](LICENSE)). Any new third-party dependency must be documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## Submitting a Change

1. Fork the repository and create a descriptive branch from `main`:
   ```sh
   git checkout -b feat/short-description
   ```
2. Implement your change along with tests under `backend/tests/` for backend changes.
3. Verify all checks pass before pushing:
   - `python -m pytest backend/tests -q`
   - `npm --prefix frontend run lint`
   - `npx --prefix frontend tsc -p frontend/tsconfig.json --noEmit`
   - `npm --prefix frontend run build`
4. Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`) and open a Pull Request using our PR template.
