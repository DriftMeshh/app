# Contributing to DriftMesh — app

This repo is scoped for [Stellar Wave](https://www.drips.network/wave/stellar) —
issue complexity here follows Wave's own point system.

## Before you start

1. Read the [README](README.md) — especially "Known limitations" and
   the "Wallet integration" section's note on why device registration
   is deliberately *not* a wallet action here.
2. Set up and confirm the existing suite passes:

   ```bash
   npm install
   npm run build --workspaces --if-present   # builds bindings/*
   npm test          # 33 tests should pass
   npm run typecheck
   ```
3. Run it against something real before you start, not a blank state —
   either point `.env` at the testnet contract IDs in
   `contracts/TESTNET.md`, or run the other three repos locally and
   register a device via `device-sdk` so you have real data to look at.

## Issue complexity (matches Stellar Wave's point system exactly)

| Tier | Points | What belongs here |
|---|---|---|
| Trivial | 100 | A manual refresh button, relative timestamps, a loading skeleton. |
| Medium | 150 | Pagination controls, auto-refresh polling, letting a device's owner wallet claim on its behalf. |
| High | 200 | A Register-device flow triggered from the app, a fuller multi-device operator dashboard. |

See the README's "Suggested Stellar Wave issues" section for concrete,
already-scoped examples at each tier.

## What a good PR looks like here

- **Heavy external libraries (wallet SDKs, Leaflet) get mocked in
  tests, not loaded for real.** See `test/DeviceMap.test.tsx`'s
  `react-leaflet`/`leaflet` mocks and `test/WalletButton.test.tsx`'s
  `wallet/kit` mock for the pattern — and read the comment in those
  files about *why* (`vi.importActual` on the wallet module pulls in a
  CJS dependency that breaks Vitest's loader; this was a real bug, not
  a style choice).
- **If you touch write flows (`wallet/contracts.ts`), verify the
  signing logic against real testnet, not just mocks.** The README's
  "Verified against the live testnet deployment" section documents
  exactly how `subscribe()`/`claim()` were proven correct without a
  literal browser-extension click — follow the same pattern (a
  Node-compatible signer swapped in for the wallet's) if you change
  that code.
- **Check mobile width before opening the PR, not after review flags
  it.** This app had three real mobile bugs fixed late because they
  were never actually measured — see the README's testnet-verification
  section and that commit's message for the technique (check
  `scrollWidth` vs `clientWidth` via the console across every element,
  don't just eyeball a screenshot — a screenshot scale mismatch can
  make correctly-wrapping text look clipped when it isn't).
- **PR description includes `Closes #<issue>`.**

## Design system

Colors, blur values, and spacing all live as CSS custom properties in
`src/index.css`. A new component should use the existing `.glass`,
`.glass-button`, `.pill`, `.row` classes rather than introducing new
one-off styles — consistency across views matters more than any single
view looking slightly different.
