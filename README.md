# DriftMesh — App

The frontend: a landing page, a device browser with a map and readings
chart, two lookup tools, and wallet-signed subscribe/claim — all reading
live from `indexer`'s REST API and writing straight to the Stellar
contracts through any supported wallet. React + Vite + TypeScript,
styled as a frosted-glass UI (blurred translucent panels over an
animated gradient backdrop) with full light/dark support.

The landing page (`src/components/Landing.tsx`) pulls its device-count
stats from the same live `GET /devices` endpoint the dashboard uses —
not hardcoded marketing numbers. Clicking the brand mark in the
dashboard's header returns to it.

## Wallet integration

"Connect wallet" (`src/wallet/kit.ts`) opens [Stellar Wallets
Kit](https://stellarwalletskit.dev/)'s picker — currently configured for
**Freighter** (rebranded "Varial" upstream; still exposed via a
`/modules/freighter` import alias, kept in our own code for clarity),
**Lobstr**, **xBull**, **Albedo**, and **Rabet**. Adding another
supported wallet is a one-line change in `kit.ts`'s `modules` list, not
a new integration from scratch.

Once connected, a wallet can:
- **Subscribe** — pay for feed access, from the Subscription tab
- **Claim** — a device's own wallet can claim its payout for an epoch,
  shown on that device's detail page only when the connected wallet
  matches the device address

`bindings/payment-streamer` and `bindings/subscription-market` are
generated TypeScript clients (`stellar contract bindings typescript`),
same approach as `device-sdk`'s bindings — see that repo's README for why.
The kit's `signTransaction`/`signAuthEntry` slot into these clients the
same way `device-sdk`'s Node-based signer does; only the signer source
changes between the two.

**Device registration deliberately isn't a wallet action here.** A real
device's identity is its own keypair, not a human's browser wallet —
that's `device-sdk`'s job, correctly separated. (Connecting your own
wallet and "claiming" as if you were a device is still useful for demos
and testing, which is why Claim works this way, but Register doesn't.)

## Map and chart

`DeviceMap.tsx` plots devices by their registered lat/lon (populated by
`indexer`'s enrichment fix) on a real Leaflet tile map, auto-framed to
fit whatever devices are currently located. Tiles are plain
OpenStreetMap (`tile.openstreetmap.org`) — genuinely free, no API key —
with a CSS filter on just the tile pane approximating a dark basemap
(found live that CARTO's free dark tiles now require an API key, a
policy change since this was first written; markers/popups sit in
separate Leaflet panes so the filter doesn't touch them). `ReadingsChart.tsx`
is a small inline-SVG line chart replacing the old bare number list in
device detail.

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
- Did a real mobile audit (375×812), not just an eyeball check: walked
  every view checking `scrollWidth` vs `clientWidth` across every
  element via the console, not just looking at screenshots (one
  screenshot-capture scale mismatch briefly looked like real text
  clipping — DOM inspection showed it wasn't). Found and fixed three
  genuine bugs this way: the nav tabs forcing the whole topbar ~70px
  wider than the viewport (now a horizontally-scrollable strip with an
  edge fade instead of an unwrapped row), button labels line-breaking
  mid-text when squeezed (`white-space: nowrap` was simply missing), and
  the device map showing light-gray bands instead of its dark background
  wherever a view extended past loaded tiles (`leaflet.css`'s
  `.leaflet-container { background: #ddd }` was winning over mine at
  equal specificity — missing an `!important` I'd added everywhere else
  Leaflet needed overriding). That last one affected desktop too, not
  only mobile.
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
- Registered three devices in London, Tokyo, and Sydney and confirmed
  the real Leaflet tile map auto-framed to fit all three at their
  correct real-world positions, with working popups and click-through
  to each device's detail page — this is also how the CARTO
  API-key issue above was caught, not assumed away.
- While testing this, the live indexer actually crashed (an unhandled
  `ECONNRESET` talking to Stellar RPC took the whole process down) —
  fixed with global `unhandledRejection`/`uncaughtException` handlers in
  `indexer`'s `index.ts` so a transient network blip logs instead of
  killing a long-running service; see that repo's commit history.

## Known limitations

- **No pagination** — `GET /devices` and the readings list have no
  pagination yet (matches the same gap noted in `indexer`'s own README);
  fine for a demo, not for a device fleet of any real size.
- **No live/auto-refresh** — views fetch once on mount; there's no
  polling or websocket to reflect new on-chain activity without a
  manual reload (a wallet action does prompt the user that the indexer
  may take a few seconds to catch up, but doesn't auto-refresh for them).
- **The wallet picker and connect/sign flow are unit-tested with mocks,
  not click-tested through any real wallet extension** — see "Verified
  against the live testnet deployment" above for exactly what was and
  wasn't covered (the picker itself, listing Freighter/Lobstr/xBull/
  Albedo/Rabet correctly, was visually confirmed; actually connecting
  through one wasn't, since none of those extensions are installed in
  the sandboxed browser used for development).
- **Map tiles depend on a free, unauthenticated third-party service**
  (OpenStreetMap) — fine for a demo, but no uptime/rate-limit guarantee;
  a production deployment would want a paid tile provider.
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
- Detect an account switch in the connected wallet extension (the app no longer depends on `@stellar/freighter-api` directly — `src/wallet/kit.ts`'s `StellarWalletsKit` wrapper exposes `getAddress()`/`authModal()` but no push-based account-changed event — so this means polling `getAddress()` on an interval while connected and updating `WalletContext` if it no longer matches the stored address, not wiring up an event listener that doesn't exist in the current wallet layer)

**Medium**
- Add pagination controls to the device list and readings table
- Add a lightweight auto-refresh (poll the indexer every N seconds) for the currently-open device
- Let a device's `owner` wallet claim on the device's behalf, not only the device's own wallet
- Move map tiles to a paid/rate-limited provider (or a self-hosted tile server) before any real deployment

**High**
- Add a Register-device flow via `device-sdk` triggered from the app (e.g. a QR code or paired-device flow) rather than CLI-only
- Build a fuller operator dashboard: total earnings across all epochs/devices an owner controls, not just one epoch at a time
