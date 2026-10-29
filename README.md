# DriftMesh — App

The frontend: a landing page, a device browser with a map and readings
chart, two lookup tools, and wallet-signed subscribe/claim — all reading
live from `indexer`'s REST API and writing straight to the Stellar
contracts via Freighter. React + Vite + TypeScript, styled as a
frosted-glass UI (blurred translucent panels over an animated gradient
backdrop) with full light/dark support.

The landing page (`src/components/Landing.tsx`) pulls its device-count
stats from the same live `GET /devices` endpoint the dashboard uses —
not hardcoded marketing numbers. Clicking the brand mark in the
dashboard's header returns to it.

## Wallet integration

Connect a Freighter wallet (`src/wallet/`) to:
- **Subscribe** — pay for feed access, from the Subscription tab
- **Claim** — a device's own wallet can claim its payout for an epoch,
  shown on that device's detail page only when the connected wallet
  matches the device address

`bindings/payment-streamer` and `bindings/subscription-market` are
generated TypeScript clients (`stellar contract bindings typescript`),
same approach as `device-sdk`'s bindings — see that repo's README for why.

**Device registration deliberately isn't a wallet action here.** A real
device's identity is its own keypair, not a human's browser wallet —
that's `device-sdk`'s job, correctly separated. (Connecting your own
wallet and "claiming" as if you were a device is still useful for demos
and testing, which is why Claim works this way, but Register doesn't.)

## Map and chart

`DeviceMap.tsx` plots devices by their registered lat/lon (now populated
by `indexer`'s enrichment fix) on a lightweight inline-SVG coordinate
grid — deliberately not a tile-based map library, so there's no external
tile-server dependency to keep reliable. `ReadingsChart.tsx` is a small
inline-SVG line chart replacing the old bare number list in device detail.

## Running it

```bash
npm install
npm run dev
```

The dev server proxies `/api/*` to `http://localhost:3002` (the indexer)
by default — see `vite.config.ts`. Point it elsewhere with
`VITE_INDEXER_URL=https://your-indexer.example.com npm run dev`, or set
`VITE_API_BASE` directly for a production build that talks to a
non-proxied indexer URL.

```bash
npm test          # 32 tests: component behavior, wallet flows (mocked), map, chart, formatting
npm run typecheck
npm run build      # builds bindings/* workspaces, then the app, to dist/
```

For wallet write-flows to actually work (not just render), copy
`.env.example` to `.env` and fill in the two contract IDs — see
`contracts/TESTNET.md` for already-deployed testnet IDs.

## Verified against the live testnet deployment

Not a mockup — run against the real indexer, which was itself polling
real Stellar testnet contracts (see `contracts/TESTNET.md`). While
building this:

- The landing page's live stat card showed the real registered/active
  device counts, and the "Explore the network" / brand-mark navigation
  between landing and dashboard was tested on a fresh page load (an
  earlier click during active HMR editing silently no-opped — stale dev
  state, not a shipped bug; confirmed fixed by reloading and retesting).

- Registered a brand-new second device live (`air_quality`, London) via
  `device-sdk` *after* the indexer was already running, confirmed it
  appeared on the Devices tab with the correct "unknown" owner/location
  (an honest reflection of `indexer`'s documented limitation — the
  on-chain event doesn't carry those fields, so the UI doesn't fabricate
  them).
- Opened that device's detail view and saw its real submitted reading
  value, matching what `device-sdk` logged submitting.
- Looked up that device's region average and got back the exact value
  computed from the single real reading.
- Checked a real subscriber's status and got back `active: true` with
  the actual on-chain expiry timestamp, correctly formatted.
- Checked mobile viewport (375×812) rendering — panels and nav reflow
  correctly, no horizontal overflow.
- Ran `subscribe()` and `claim()` through the exact same `Client` +
  `AssembledTransaction` codepath `wallet/contracts.ts` uses, swapping
  Freighter's browser-only signer for a Node one (the extension itself
  can't be clicked through in a sandboxed browser) — both succeeded on
  live testnet, confirmed by `indexer` picking up the resulting events.
  This proves the contract-calling logic is correct; Freighter's own
  connect/sign popups are covered by unit tests with mocks instead, not
  a literal extension click — that gap is real and worth knowing about.
- Registered a device, confirmed its exact coordinates appeared as a
  pin on the map, submitted more readings, and confirmed the chart
  rendered the correct min/max range from real on-chain values.

## Known limitations

- **No pagination** — `GET /devices` and the readings list have no
  pagination yet (matches the same gap noted in `indexer`'s own README);
  fine for a demo, not for a device fleet of any real size.
- **No live/auto-refresh** — views fetch once on mount; there's no
  polling or websocket to reflect new on-chain activity without a
  manual reload (a wallet action does prompt the user that the indexer
  may take a few seconds to catch up, but doesn't auto-refresh for them).
- **Freighter's connect/sign flow is unit-tested with mocks, not
  click-tested through the real extension** — see "Verified against the
  live testnet deployment" above for exactly what was and wasn't covered.
- **The device map is a coordinate grid, not a real map** — deliberately,
  to avoid a tile-server dependency (see "Map and chart" above), but it
  means no real-world landmass context, just lat/lon gridlines.
- **Claim only works when the connected wallet IS the device** — correct
  for the current architecture (see "Wallet integration" above) but
  means an "operator" who manages multiple devices from one wallet can't
  claim on a device's behalf yet.
- **Device type capitalized via CSS only** (`text-transform: capitalize`
  on whatever string the contract stores) — fine for `weather`/
  `air_quality`, but any future device type with its own required casing
  would need real formatting logic, not a CSS trick.

## Suggested Stellar Wave issues

**Trivial**
- Add a manual "Refresh" button to each view instead of only fetching on mount
- Show a relative time ("2m ago") next to readings/claims instead of only an absolute timestamp
- Add an empty/loading skeleton instead of plain text for a more polished first paint
- Add a `WatchWalletChanges` listener (from `@stellar/freighter-api`) so the UI reacts if the user switches accounts in the extension

**Medium**
- Add pagination controls to the device list and readings table
- Add a lightweight auto-refresh (poll the indexer every N seconds) for the currently-open device
- Let a device's `owner` wallet claim on the device's behalf, not only the device's own wallet
- Swap the coordinate-grid map for a real tile-based map once a tile source is settled on

**High**
- Add a Register-device flow via `device-sdk` triggered from the app (e.g. a QR code or paired-device flow) rather than CLI-only
- Build a fuller operator dashboard: total earnings across all epochs/devices an owner controls, not just one epoch at a time
