# DriftMesh — App

The frontend: a device browser and two lookup tools, reading live from
`indexer`'s REST API. React + Vite + TypeScript, styled as a frosted-glass
UI (blurred translucent panels over an animated gradient backdrop) with
full light/dark support.

## Scope — read-only by design

This is deliberately a **read-only** dashboard for v1: browse registered
devices and their readings/claims, look up a region's average, and check
a subscription's status. There's no wallet-connect / register / subscribe
flow yet — those are write operations that need a signing wallet
(Freighter) in the browser, which is a meaningfully bigger scope and a
different trust model than everything else here (this app never touches
a private key). See "Suggested Stellar Wave issues" below; it's the
natural next step, not an oversight.

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
npm test          # 11 tests: component behavior + formatting helpers
npm run typecheck
npm run build      # production build to dist/
```

## Verified against the live testnet deployment

Not a mockup — run against the real indexer, which was itself polling
real Stellar testnet contracts (see `contracts/TESTNET.md`). While
building this:

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

## Known limitations

- **Read-only** — see Scope above.
- **No pagination** — `GET /devices` and the readings list have no
  pagination yet (matches the same gap noted in `indexer`'s own README);
  fine for a demo, not for a device fleet of any real size.
- **No live/auto-refresh** — the device list and detail views fetch once
  on mount; there's no polling or websocket to reflect new on-chain
  activity without a manual reload.
- **Device type capitalized via CSS only** (`text-transform: capitalize`
  on whatever string the contract stores) — fine for `weather`/
  `air_quality`, but any future device type with its own required casing
  would need real formatting logic, not a CSS trick.

## Suggested Stellar Wave issues

**Trivial**
- Add a manual "Refresh" button to each view instead of only fetching on mount
- Show a relative time ("2m ago") next to readings/claims instead of only an absolute timestamp
- Add an empty/loading skeleton instead of plain text for a more polished first paint

**Medium**
- Add pagination controls to the device list and readings table
- Add a lightweight auto-refresh (poll the indexer every N seconds) for the currently-open device
- Add a simple map view for device locations (once `indexer`'s owner/lat/lon enrichment issue is resolved)

**High**
- Add Freighter wallet integration: connect wallet, register a device, subscribe — turning this from a read-only dashboard into the full consumer-facing app
- Build an operator earnings view: total claimed across epochs, a claim button wired to `payment-streamer.claim` via the wallet
