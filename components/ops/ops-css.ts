// Ops Portal design system. This is the vendor portal's "champagne" language, not a lookalike:
//   - tokens, sidebar (236px), topbar (57px), nav (gold edge-bar), user foot: from components/dashboard/layout/champagne-shell.tsx
//   - page head, .btn, .seg, .tabs, .st (dot + word status), .card, .tbl, pager: from docs/design-samples/leads.html (LOCKED)
//   - rules: docs/design-rules 01-08 (4/8 spacing, one primary action per view, label above field, designed empty/loading/error states)
// Everything is scoped under `.oshell` so nothing leaks to, or inherits from, the rest of the app.

export const OPS_CSS = String.raw`
.oshell{ position:fixed; inset:0; overflow:hidden; z-index:46; display:block; color:var(--ink); color-scheme:light; accent-color:var(--accent);
  font-family:"Geist","Inter",system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13.5px; line-height:1.5; -webkit-font-smoothing:antialiased; letter-spacing:-.006em;
  --bg:#F7F6F3; --surface:#FFFFFF; --surface-2:#FAF9F6; --surface-3:#F3F1EC; --ink:#1A1815; --ink-2:#605A52; --ink-3:#6E6A62; --ink-4:#8C857B;
  --border:#EBE9E3; --border-2:#DEDBD3; --accent:#B8863B; --accent-ink:#8A6220; --accent-wash:#F5EFE2; --accent-line:#E3D3AE; --on-accent:#FFFFFF;
  --ok:#3F7A55; --ok-wash:#EEF4EF; --warn:#8A6220; --warn-wash:#F6EEDD; --info:#3F6FA6; --info-wash:#EDF2F8; --bad:#A24845; --bad-wash:#F8ECEB;
  --shadow-xs:0 1px 2px rgba(20,18,15,.04); --shadow-sm:0 1px 3px rgba(20,18,15,.06),0 1px 2px rgba(20,18,15,.04); --shadow-md:0 8px 24px -12px rgba(20,18,15,.16); --shadow-lg:0 24px 60px -20px rgba(20,18,15,.28);
  --r:12px; --r-sm:9px; --r-xs:7px; background:var(--bg); }
.oshell[data-theme="dark"]{ color-scheme:dark;
  --bg:#0C0B09; --surface:#161410; --surface-2:#121009; --surface-3:#1E1B15; --ink:#F5F2EC; --ink-2:#ABA498; --ink-3:#9A9184; --ink-4:#6B6558;
  --border:#26231C; --border-2:#322E25; --accent:#D8A85A; --accent-ink:#E7C079; --accent-wash:#221B10; --accent-line:#3A2F1A; --on-accent:#231A08;
  --ok:#7FB894; --ok-wash:#16211A; --warn:#D6A94E; --warn-wash:#221B0F; --info:#7FA6D6; --info-wash:#141D28; --bad:#DA9490; --bad-wash:#241614;
  --shadow-xs:0 1px 2px rgba(0,0,0,.4); --shadow-sm:0 1px 3px rgba(0,0,0,.5); --shadow-md:0 10px 28px -12px rgba(0,0,0,.6); --shadow-lg:0 28px 70px -20px rgba(0,0,0,.7); }
.oshell *{ box-sizing:border-box; }
.oshell h1,.oshell h2,.oshell h3{ margin:0; line-height:1.2; letter-spacing:-.02em; font-weight:600; }
.oshell p{ margin:0; }
.oshell a{ color:inherit; text-decoration:none; } .oshell button{ font:inherit; color:inherit; cursor:pointer; } .oshell svg{ display:block; }
.oshell :focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
.oshell ::-webkit-scrollbar{ width:10px; height:10px; } .oshell ::-webkit-scrollbar-track{ background:transparent; }
.oshell ::-webkit-scrollbar-thumb{ background:var(--border-2); border-radius:10px; border:2px solid transparent; background-clip:content-box; } .oshell ::-webkit-scrollbar-thumb:hover{ background:var(--ink-4); background-clip:content-box; }
.oshell .num{ font-variant-numeric:tabular-nums; }

/* ---- shell ---- */
.oshell .app{ display:grid; grid-template-columns:236px 1fr; height:100%; }
.oshell .side{ background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; height:100vh; overflow:visible; }
.oshell .side-top{ display:flex; align-items:center; gap:10px; width:100%; padding:16px 16px 14px; border-bottom:1px solid var(--border); }
.oshell .logo{ width:32px; height:32px; border-radius:9px; background:var(--accent); color:var(--on-accent); display:grid; place-items:center; font-weight:700; font-size:15px; flex:none; box-shadow:var(--shadow-xs); }
.oshell .st-txt{ flex:1; min-width:0; } .oshell .st-name{ display:block; font-weight:600; font-size:13px; letter-spacing:-.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.oshell .st-sub{ display:block; font-size:11.5px; color:var(--ink-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
.oshell .nav{ padding:10px 12px 4px; flex:1 1 auto; min-height:0; overflow-y:auto; }
.oshell .nav-sec{ font-size:11px; font-weight:600; letter-spacing:.04em; color:var(--ink-3); text-transform:uppercase; padding:14px 10px 6px; } .oshell .nav-sec:first-child{ padding-top:2px; }
.oshell .nav a{ display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; min-height:36px; color:var(--ink-2); font-weight:500; font-size:13px; position:relative; transition:background .12s,color .12s; }
.oshell .nav a svg{ width:17px; height:17px; color:var(--ink-3); flex:none; }
.oshell .nav a:hover{ background:var(--surface-3); color:var(--ink); } .oshell .nav a:hover svg{ color:var(--ink-2); }
.oshell .nav a.active{ background:var(--surface-3); color:var(--ink); font-weight:600; } .oshell .nav a.active svg{ color:var(--accent-ink); }
.oshell .nav a.active::before{ content:""; position:absolute; left:0; top:9px; bottom:9px; width:2.5px; border-radius:0 3px 3px 0; background:var(--accent); }
.oshell .nav a .badge{ margin-left:auto; font-size:11px; font-weight:600; color:var(--ink-2); background:var(--surface-3); border:1px solid var(--border); border-radius:20px; padding:0 7px; min-width:20px; text-align:center; font-variant-numeric:tabular-nums; }
.oshell .nav a:hover .badge,.oshell .nav a.active .badge{ background:var(--surface); }
.oshell .nav a .badge.hot{ background:var(--bad-wash); color:var(--bad); border-color:transparent; }
.oshell .side-foot{ border-top:1px solid var(--border); padding:10px 12px; flex:none; background:var(--surface); }
.oshell .me{ display:flex; align-items:center; gap:10px; padding:7px 8px; border-radius:8px; }
.oshell .m-ava,.oshell .ava{ width:30px; height:30px; border-radius:8px; background:var(--surface-3); border:1px solid var(--border-2); color:var(--ink); display:grid; place-items:center; font-weight:600; font-size:12px; flex:none; }
.oshell .m-txt{ min-width:0; flex:1; } .oshell .m-name{ font-weight:600; font-size:12.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .oshell .m-sub{ font-size:11px; color:var(--ink-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.oshell .main{ min-width:0; display:flex; flex-direction:column; height:100vh; }
.oshell .topbar{ display:flex; align-items:center; gap:12px; padding:11px 22px; min-height:57px; border-bottom:1px solid var(--border); background:color-mix(in srgb,var(--bg) 80%,transparent); backdrop-filter:blur(10px); flex:none; }
.oshell .crumb{ font-size:13px; color:var(--ink-3); display:flex; align-items:center; gap:8px; min-width:0; } .oshell .crumb b{ color:var(--ink); font-weight:600; white-space:nowrap; } .oshell .crumb .sep{ color:var(--border-2); } .oshell .crumb span:last-child{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.oshell .tb-spring{ flex:1; }
.oshell .search{ width:260px; display:flex; align-items:center; gap:8px; height:36px; padding:0 11px; border:1px solid var(--border); border-radius:9px; background:var(--surface); color:var(--ink-3); transition:border-color .12s; }
.oshell .search:focus-within{ border-color:var(--border-2); } .oshell .search input{ border:0; background:transparent; color:var(--ink); width:100%; outline:none; font-size:13px; } .oshell .search input::placeholder{ color:var(--ink-3); } .oshell .search svg{ width:15px; height:15px; flex:none; }
.oshell .ibtn{ width:36px; height:36px; border-radius:9px; border:1px solid var(--border); background:var(--surface); display:grid; place-items:center; color:var(--ink-2); position:relative; transition:background .12s; flex:none; }
.oshell .ibtn:hover{ background:var(--surface-3); } .oshell .ibtn svg{ width:17px; height:17px; }
.oshell .cscroll{ flex:1; min-height:0; overflow-y:auto; }
.oshell .content{ padding:24px 26px 40px; max-width:1320px; width:100%; margin:0 auto; }
.oshell .menu-btn{ display:none; }
.oshell .scrim{ display:none; }
@media (max-width:820px){
  .oshell .app{ grid-template-columns:1fr; }
  .oshell .side{ position:fixed; left:0; top:0; bottom:0; width:264px; z-index:60; transform:translateX(-102%); transition:transform .18s ease; box-shadow:var(--shadow-lg); }
  .oshell.nav-open .side{ transform:none; }
  .oshell.nav-open .scrim{ display:block; position:fixed; inset:0; background:rgba(20,18,15,.4); z-index:55; }
  .oshell .menu-btn{ display:grid; }
  .oshell .topbar{ padding:10px 14px; } .oshell .search{ display:none; }
  .oshell .content{ padding:16px 14px 32px; }
}

/* ---- page head, buttons, controls (docs/design-samples/leads.html) ---- */
.oshell .head{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px; flex-wrap:wrap; }
.oshell .head h1{ font-size:22px; font-weight:600; letter-spacing:-.025em; } .oshell .head .sub{ color:var(--ink-3); font-size:13px; margin-top:5px; max-width:72ch; } .oshell .head .sub b{ color:var(--ink-2); font-weight:600; }
.oshell .head-actions{ display:flex; gap:8px; flex-wrap:wrap; }
.oshell .btn{ display:inline-flex; align-items:center; justify-content:center; gap:7px; height:36px; padding:0 14px; border-radius:9px; font-weight:600; font-size:13px; border:1px solid transparent; white-space:nowrap; transition:background .12s,border-color .12s,box-shadow .12s,transform .08s; }
.oshell .btn svg{ width:16px; height:16px; } .oshell .btn:active:not(:disabled){ transform:scale(.98); }
.oshell .btn:disabled{ opacity:.55; cursor:not-allowed; }
.oshell .btn-primary{ background:var(--accent); color:var(--on-accent); box-shadow:var(--shadow-xs); } .oshell .btn-primary:hover:not(:disabled){ filter:brightness(1.05); }
.oshell .btn-ghost{ background:var(--surface); border-color:var(--border-2); color:var(--ink); } .oshell .btn-ghost:hover:not(:disabled){ background:var(--surface-3); }
.oshell .btn-danger{ background:var(--surface); border-color:var(--border-2); color:var(--bad); } .oshell .btn-danger:hover:not(:disabled){ background:var(--bad-wash); }
.oshell .btn-link{ background:transparent; color:var(--accent-ink); padding:0 6px; } .oshell .btn-link:hover:not(:disabled){ text-decoration:underline; }
.oshell .btn.sm{ height:32px; padding:0 11px; font-size:12.5px; }
.oshell .spin{ width:14px; height:14px; border-radius:50%; border:2px solid currentColor; border-right-color:transparent; animation:ospin .7s linear infinite; }
@keyframes ospin{ to{ transform:rotate(360deg); } }
@media (prefers-reduced-motion:reduce){ .oshell .spin{ animation-duration:1.6s; } .oshell .btn,.oshell .side{ transition:none; } }
.oshell .seg{ display:inline-flex; background:var(--surface-3); border:1px solid var(--border); border-radius:9px; padding:2px; gap:1px; }
.oshell .seg button{ display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:var(--ink-3); padding:0 11px; border-radius:7px; border:0; background:transparent; height:30px; transition:color .12s; }
.oshell .seg button.on{ background:var(--surface); color:var(--ink); box-shadow:var(--shadow-xs); }
.oshell .toolbar{ display:flex; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
.oshell .tabs{ display:inline-flex; gap:2px; background:var(--surface-2); border:1px solid var(--border); border-radius:10px; padding:3px; flex-wrap:wrap; }
.oshell .tab{ display:inline-flex; align-items:center; gap:7px; height:30px; padding:0 11px; border-radius:7px; border:0; background:transparent; color:var(--ink-2); font-size:12.5px; font-weight:600; transition:background .12s,color .12s; }
.oshell .tab:hover{ color:var(--ink); } .oshell .tab.on{ background:var(--surface); color:var(--ink); box-shadow:var(--shadow-xs); }
.oshell .tab .cnt{ font-size:11px; font-weight:600; color:var(--ink-3); font-variant-numeric:tabular-nums; } .oshell .tab.on .cnt{ color:var(--ink-2); }
.oshell .filters{ display:flex; align-items:center; gap:8px; margin-left:auto; flex-wrap:wrap; }
.oshell .f-search{ width:230px; display:flex; align-items:center; gap:8px; height:34px; padding:0 11px; border:1px solid var(--border); border-radius:9px; background:var(--surface); color:var(--ink-3); }
.oshell .f-search input{ border:0; background:transparent; color:var(--ink); width:100%; outline:none; font-size:12.5px; } .oshell .f-search input::placeholder{ color:var(--ink-3); } .oshell .f-search svg{ width:15px; height:15px; flex:none; }
.oshell .fsel{ height:34px; padding:0 28px 0 11px; border-radius:9px; border:1px solid var(--border); background:var(--surface); color:var(--ink-2); font-size:12.5px; font-weight:600; }

/* ---- status badge: dot + word (colour is never alone) ---- */
.oshell .st{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:2px 8px 2px 7px; border-radius:6px; background:var(--surface-2); border:1px solid var(--border); color:var(--ink-2); white-space:nowrap; }
.oshell .st i{ width:6px; height:6px; border-radius:50%; flex:none; background:var(--ink-4); }
.oshell .st.ok{ color:var(--ok); background:var(--ok-wash); border-color:transparent; } .oshell .st.ok i{ background:var(--ok); }
.oshell .st.warn{ color:var(--warn); background:var(--warn-wash); border-color:transparent; } .oshell .st.warn i{ background:var(--warn); }
.oshell .st.info{ color:var(--info); background:var(--info-wash); border-color:transparent; } .oshell .st.info i{ background:var(--info); }
.oshell .st.bad{ color:var(--bad); background:var(--bad-wash); border-color:transparent; } .oshell .st.bad i{ background:var(--bad); }
.oshell .st.acc{ color:var(--accent-ink); background:var(--accent-wash); border-color:transparent; } .oshell .st.acc i{ background:var(--accent); }

/* ---- cards, tables, empty/skeleton ---- */
.oshell .card{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); }
.oshell .card-h{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:16px 18px 12px; flex-wrap:wrap; }
.oshell .card-h h2{ font-size:14px; letter-spacing:-.01em; } .oshell .card-h .sub{ font-size:12.5px; color:var(--ink-3); margin-top:3px; max-width:68ch; }
.oshell .card-b{ padding:4px 18px 18px; } .oshell .card-b.flush{ padding:0; } .oshell .card-h + .card-b{ padding-top:4px; }
.oshell .stack{ display:flex; flex-direction:column; gap:16px; } .oshell .grid2{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; } .oshell .grid3{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
.oshell .cols-main{ display:grid; grid-template-columns:minmax(0,1.8fr) minmax(0,1fr); gap:16px; align-items:start; }
@media (max-width:980px){ .oshell .grid2,.oshell .grid3,.oshell .cols-main{ grid-template-columns:1fr; } }
.oshell .tbl-wrap{ overflow-x:auto; } .oshell table.tbl{ width:100%; border-collapse:collapse; }
.oshell .tbl thead th{ text-align:left; font-size:11px; font-weight:600; color:var(--ink-3); text-transform:uppercase; letter-spacing:.03em; padding:11px 16px; border-bottom:1px solid var(--border); white-space:nowrap; background:var(--surface-2); }
.oshell .tbl thead th.r,.oshell .tbl td.r{ text-align:right; }
.oshell .tbl thead th:first-child{ border-top-left-radius:var(--r); } .oshell .tbl thead th:last-child{ border-top-right-radius:var(--r); }
.oshell .tbl tbody td{ padding:12px 16px; border-bottom:1px solid var(--border); vertical-align:middle; font-size:12.5px; }
.oshell .tbl tbody tr:last-child td{ border-bottom:0; } .oshell .tbl tbody tr{ transition:background .1s; }
.oshell .tbl tbody tr.click{ cursor:pointer; } .oshell .tbl tbody tr:hover{ background:var(--surface-3); }
.oshell .tbl td.nw,.oshell .tbl th.nw{ white-space:nowrap; }
.oshell .td-name{ font-weight:600; color:var(--ink); } .oshell .td-sub{ color:var(--ink-3); font-weight:400; font-size:11px; margin-top:1px; }
.oshell .td-mut{ color:var(--ink-2); }
.oshell .tbl-foot{ display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-top:1px solid var(--border); font-size:12px; color:var(--ink-3); gap:12px; flex-wrap:wrap; }
.oshell .pager{ display:flex; gap:6px; } .oshell .pager button{ height:28px; min-width:28px; padding:0 8px; border-radius:7px; border:1px solid var(--border); background:var(--surface); color:var(--ink-2); font-size:12px; font-weight:600; } .oshell .pager button.on{ background:var(--accent-wash); color:var(--accent-ink); border-color:var(--accent-line); } .oshell .pager button:disabled{ opacity:.5; cursor:not-allowed; }
.oshell .empty{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:6px; padding:40px 24px; color:var(--ink-3); }
.oshell .empty .e-ico{ width:40px; height:40px; border-radius:10px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--ink-3); margin-bottom:4px; } .oshell .empty .e-ico svg{ width:20px; height:20px; }
.oshell .empty h3{ font-size:14px; color:var(--ink); } .oshell .empty p{ font-size:12.5px; max-width:44ch; }
.oshell .skel{ background:linear-gradient(90deg,var(--surface-3),var(--surface-2),var(--surface-3)); background-size:200% 100%; animation:oskel 1.3s ease-in-out infinite; border-radius:8px; }
@keyframes oskel{ 0%{ background-position:200% 0; } 100%{ background-position:-200% 0; } }
@media (prefers-reduced-motion:reduce){ .oshell .skel{ animation:none; } }
.oshell .notice{ display:flex; gap:10px; padding:11px 14px; border-radius:var(--r-sm); border:1px solid var(--border); background:var(--surface-2); font-size:12.5px; line-height:1.5; color:var(--ink-2); }
.oshell .notice svg{ width:16px; height:16px; flex:none; margin-top:2px; }
.oshell .notice.ok{ background:var(--ok-wash); color:var(--ok); border-color:transparent; } .oshell .notice.warn{ background:var(--warn-wash); color:var(--warn); border-color:transparent; }
.oshell .notice.bad{ background:var(--bad-wash); color:var(--bad); border-color:transparent; } .oshell .notice.info{ background:var(--info-wash); color:var(--info); border-color:transparent; }
.oshell .kpis{ display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:12px; margin-bottom:16px; }
.oshell .kpi{ padding:14px 16px; } .oshell .kpi .k-l{ font-size:11.5px; font-weight:600; color:var(--ink-3); } .oshell .kpi .k-v{ font-size:24px; font-weight:600; letter-spacing:-.03em; margin-top:6px; font-variant-numeric:tabular-nums; } .oshell .kpi .k-n{ font-size:11.5px; color:var(--ink-3); margin-top:4px; }
.oshell .chips{ display:flex; flex-wrap:wrap; gap:6px; }
.oshell .chip{ display:inline-flex; align-items:center; gap:6px; height:28px; padding:0 10px; border-radius:20px; border:1px solid var(--border); background:var(--surface-2); color:var(--ink-2); font-size:12px; font-weight:600; transition:background .12s; }
.oshell button.chip:hover{ background:var(--surface-3); } .oshell .chip.on{ background:var(--accent-wash); color:var(--accent-ink); border-color:var(--accent-line); }
.oshell .kv{ display:grid; grid-template-columns:minmax(120px,170px) 1fr; gap:6px 16px; font-size:12.5px; } .oshell .kv dt{ color:var(--ink-3); } .oshell .kv dd{ margin:0; color:var(--ink); min-width:0; word-break:break-word; }
.oshell .divider{ height:1px; background:var(--border); margin:14px 0; border:0; }
.oshell .muted{ color:var(--ink-3); } .oshell .small{ font-size:12px; } .oshell .strong{ font-weight:600; }
.oshell .row{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; } .oshell .row.between{ justify-content:space-between; }
.oshell .list-row{ display:flex; align-items:center; gap:12px; padding:12px 18px; border-bottom:1px solid var(--border); } .oshell .list-row:last-child{ border-bottom:0; }
.oshell .list-row.click{ cursor:pointer; transition:background .1s; } .oshell .list-row.click:hover{ background:var(--surface-3); }
.oshell .list-row.urgent{ box-shadow:inset 3px 0 0 var(--bad); } .oshell .list-row.today{ box-shadow:inset 3px 0 0 var(--accent); }

/* ---- forms: label above, single column (rule 05) ---- */
.oshell .field{ display:flex; flex-direction:column; gap:6px; min-width:0; } .oshell .field > label,.oshell .lbl{ font-size:12.5px; font-weight:600; color:var(--ink); }
.oshell .field .hint{ font-size:11.5px; color:var(--ink-3); line-height:1.45; } .oshell .field .err{ font-size:11.5px; color:var(--bad); display:flex; gap:5px; align-items:center; }
.oshell .req{ color:var(--bad); margin-left:2px; }
.oshell .inp,.oshell .sel,.oshell .txa{ width:100%; border:1px solid var(--border-2); border-radius:9px; background:var(--surface); color:var(--ink); font-size:13px; transition:border-color .12s,box-shadow .12s; }
.oshell .inp,.oshell .sel{ height:36px; padding:0 11px; } .oshell .txa{ padding:9px 11px; min-height:84px; resize:vertical; line-height:1.5; }
.oshell .sel{ appearance:none; padding-right:30px; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238C857B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; }
.oshell .inp::placeholder,.oshell .txa::placeholder{ color:var(--ink-4); }
.oshell .inp:hover,.oshell .sel:hover,.oshell .txa:hover{ border-color:var(--ink-4); } .oshell .inp:focus,.oshell .sel:focus,.oshell .txa:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-wash); }
.oshell .inp.invalid,.oshell .sel.invalid,.oshell .txa.invalid{ border-color:var(--bad); } .oshell .inp:disabled,.oshell .sel:disabled,.oshell .txa:disabled{ background:var(--surface-3); color:var(--ink-3); cursor:not-allowed; }
.oshell .inp.sm{ height:32px; font-size:12.5px; }
.oshell .form-grid{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; } @media (max-width:700px){ .oshell .form-grid{ grid-template-columns:1fr; } } .oshell .form-grid .full{ grid-column:1/-1; }
.oshell .check{ display:flex; align-items:center; gap:9px; font-size:13px; color:var(--ink); min-height:28px; } .oshell .check input{ width:16px; height:16px; }
.oshell .sw{ position:relative; width:36px; height:20px; border-radius:20px; border:1px solid var(--border-2); background:var(--surface-3); flex:none; transition:background .15s,border-color .15s; padding:0; }
.oshell .sw::after{ content:""; position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:var(--surface); box-shadow:var(--shadow-sm); transition:transform .15s; }
.oshell .sw[aria-checked="true"]{ background:var(--accent); border-color:var(--accent); } .oshell .sw[aria-checked="true"]::after{ transform:translateX(16px); } .oshell .sw:disabled{ opacity:.5; cursor:not-allowed; }

/* ---- modal (Radix dialog portaled INTO the shell so it inherits the tokens) ---- */
.oshell .ov{ position:fixed; inset:0; background:rgba(20,18,15,.45); backdrop-filter:blur(2px); z-index:80; animation:ofade .12s ease; }
.oshell .dlg{ position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); z-index:81; width:min(92vw,520px); max-height:88vh; display:flex; flex-direction:column; background:var(--surface); border:1px solid var(--border); border-radius:14px; box-shadow:var(--shadow-lg); animation:opop .14s ease; }
.oshell .dlg.wide{ width:min(94vw,760px); } .oshell .dlg.xwide{ width:min(96vw,980px); }
.oshell .dlg-h{ padding:18px 20px 6px; } .oshell .dlg-h h2{ font-size:16px; } .oshell .dlg-h p{ font-size:12.5px; color:var(--ink-3); margin-top:4px; line-height:1.5; }
.oshell .dlg-b{ padding:12px 20px 18px; overflow-y:auto; display:flex; flex-direction:column; gap:16px; } .oshell .dlg-f{ display:flex; justify-content:flex-end; gap:8px; padding:12px 20px 16px; border-top:1px solid var(--border); flex-wrap:wrap; }
@keyframes ofade{ from{ opacity:0; } to{ opacity:1; } } @keyframes opop{ from{ opacity:0; transform:translate(-50%,-48%) scale(.98); } to{ opacity:1; transform:translate(-50%,-50%); } }
@media (prefers-reduced-motion:reduce){ .oshell .ov,.oshell .dlg{ animation:none; } }

/* ---- responsive helpers ---- */
.oshell .grow{ flex:1; min-width:0; } .oshell .show-sm{ display:none; }
@media (max-width:760px){ .oshell .hide-sm{ display:none !important; } .oshell .show-sm{ display:block; } .oshell .filters{ margin-left:0; width:100%; } .oshell .f-search{ width:100%; } }

/* ---- toast ---- */
.oshell .toasts{ position:fixed; right:18px; bottom:18px; z-index:95; display:flex; flex-direction:column; gap:8px; width:min(92vw,340px); }
.oshell .toast{ display:flex; gap:10px; align-items:flex-start; padding:11px 14px; border-radius:var(--r-sm); background:var(--surface); border:1px solid var(--border-2); box-shadow:var(--shadow-md); font-size:12.5px; animation:opop2 .16s ease; }
.oshell .toast b{ display:block; font-size:12.5px; color:var(--ink); } .oshell .toast span{ color:var(--ink-3); display:block; margin-top:2px; }
.oshell .toast i{ width:8px; height:8px; border-radius:50%; margin-top:5px; flex:none; background:var(--ok); } .oshell .toast.bad i{ background:var(--bad); } .oshell .toast.warn i{ background:var(--warn); }
@keyframes opop2{ from{ opacity:0; transform:translateY(6px); } to{ opacity:1; transform:none; } }
`
