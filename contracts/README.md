# Contracts

Contracts define the only permitted dependencies between phases. Implementations MUST conform to these contracts without guessing.

## Structure
- `contracts/v1/` contains the first stable contract set.
- Future breaking changes MUST create `contracts/v2/`, etc.

## How to use
- Treat `domain.types.ts` as the canonical type system for entities.
- Treat `.md` contracts as authoritative for storage schemas, APIs, and error semantics.
- Contract tests in `tests/contract/` MUST be updated when contracts change.

## Change rules
- Breaking change => new version directory.
- Non-breaking additions require a decision log entry and test updates.

