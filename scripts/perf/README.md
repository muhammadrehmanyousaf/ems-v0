# Performance instruments

The scripts behind `PERFORMANCE-PLAN-2026-09-28.md`. Re-run before and after
every phase so a claim of improvement has a number attached.

| script | measures | notes |
|---|---|---|
| `perf-api.cjs` | endpoint latency, 3 runs, median, payload sizes | Subtract your own round-trip — `/health` is the floor of the instrument, not the server |
| `perf-db2.cjs` | production DB: table sizes, index coverage, `EXPLAIN ANALYZE` | **Read-only.** Needs `DATABASE_URL` from the backend `.env`. Your round-trip to Railway's public proxy is NOT what the deployed app pays |
| `perf-load.cjs` | concurrency bursts of 1/10/25 + a simulated full homepage request set | Deliberately light. Do not turn this into a sustained load test against production |
| `perf-page2.cjs` | production page vitals, public + behind a real login | Observers are registered via `addInitScript`; without that, `longtask` and LCP silently read zero |
| `perf-mobile.cjs` | the same, CPU throttled 4× on a shaped 4G link | This is the number that represents the customer |
| `perf-3p.cjs` | first-party vs third-party JS, each page run with and without | Blocking a tag bounds its cost; it is not the same as deferring it |
| `perf-js.cjs` | script counts and decoded JS bytes | Its coverage **percentages are wrong** (nested V8 ranges) — use the byte counts only |

All of them need a Chrome listening on `http://localhost:9223` for the
browser-based ones (`--remote-debugging-port=9223`).

Two of these instruments lied on their first run: a "0 long tasks" that meant
"no observer was registered", and a "100% of JS used" that meant "broken range
arithmetic". Distrust a flattering number until it reproduces.
