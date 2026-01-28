# IndexedDB Schema Contract v1

## Database
- Name: `queenspalace`
- Storage engine: IndexedDB (Dexie)
- Version: 1

## Tables

### `repertoires`
- Primary key: `id`
- Indexes: `name`, `side`, `variant`

### `positions`
- Primary key: `id`
- Indexes: `variant`, `fenKey`, `[variant+fenKey]`
- Invariant: `[variant+fenKey]` is unique.

### `moves`
- Primary key: `id`
- Indexes: `variant`, `fromPositionId`, `toPositionId`, `[variant+fromPositionId+uci]`
- Invariant: `[variant+fromPositionId+uci]` is unique.

### `repertoireEdges`
- Primary key: `[repertoireId+moveEdgeId]`
- Indexes: `repertoireId`, `moveEdgeId`, `role`, `priority`

### `routes`
- Primary key: `id`
- Indexes: `repertoireId`, `name`

### `routeSteps`
- Primary key: `[routeId+plyIndex]`
- Indexes: `routeId`, `moveEdgeId`
- Invariant: `plyIndex` is 1-based and unique per route.

### `trainingItems`
- Primary key: `id`
- Indexes: `repertoireId`, `promptPositionId`, `itemType`, `active`

### `srsStates`
- Primary key: `trainingItemId`
- Indexes: `dueAt`, `state`, `scheduler`

### `reviewLogs`
- Primary key: `id`
- Indexes: `trainingItemId`, `reviewedAt`, `rating`, `correct`

### `palaces`
- Primary key: `id`
- Indexes: `name`, `type`

### `loci`
- Primary key: `id`
- Indexes: `palaceId`, `index`
- Invariant: `(palaceId, index)` is unique.

### `mnemonicCards`
- Primary key: `id`
- Indexes: `trainingItemId`, `routeStepId`, `palaceId`, `locusId`, `updatedAt`

### `encodingPacks`
- Primary key: `id`
- Indexes: `name`, `defaultTone`, `safetyTier`

### `userOverrides`
- Primary key: `id`
- Indexes: `packId`

### `settings`
- Primary key: `key`
- Indexes: `key`
- Notes: stores local-only settings such as tone tier and consent flags.

## Migration rules
- Version upgrades MUST be additive or perform explicit data migration steps.
- Destructive migrations MUST export data to a backup store and MUST be reversible.
- Each schema change MUST increment the Dexie version number and update `contracts/v1/storage.indexeddb.schema.md`.

## Error semantics
- If a migration fails, the app MUST:
  1) notify the user,
  2) avoid data loss,
  3) offer export of recoverable data.

