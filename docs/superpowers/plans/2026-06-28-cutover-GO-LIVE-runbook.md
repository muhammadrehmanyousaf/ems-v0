# Dashboard Redesign — Go-Live (simple)

**The redesigned dashboard is ON by default.** Every canonical dashboard route
(`/dashboard/...`) renders the new design with **no configuration**. There is
nothing to set, no cohort, no ramp.

## To ship it
1. Push `feat/dashboard-redesign`, open a PR, merge.
2. Deploy the frontend (ems-v0) as usual.

That's it — every vendor and admin gets the redesigned dashboard on the next deploy.
URLs are unchanged.

## Emergency rollback (you should never need this)
The originals are still in the codebase, one switch away. To instantly serve the OLD
screens again, set ONE env var on the frontend and redeploy:

```
NEXT_PUBLIC_DASHBOARD_REDESIGN_OFF=true
```

(or `NEXT_PUBLIC_DASHBOARD_REDESIGN=false`). Remove it to return to the redesign.

## Later cleanup (optional, no rush)
Once you're happy and it's baked in, a future PR can delete the old screens + the
flag + the `*-new` preview routes (keep the 5 function-sheet editor `*-new` routes —
that's their permanent home). Until then everything coexists safely.

## One known limitation (low impact)
`/dashboard/function-sheets/[id]` (deep-link to a specific sheet) still shows the old
detail layout, because the redesigned detail currently loads "the latest sheet"
rather than the id in the URL. The redesigned function-sheets list + composer/editor
flow is fully redesigned. Fix when the detail is made id-aware.
