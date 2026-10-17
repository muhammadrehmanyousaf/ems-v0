/**
 * The look of the Wall and the plan banners, in the vendor console's own visual language (the locked design:
 * docs/design-samples). The tokens are the same names and values the shadow shell and ChampagneShell use, so the Wall is
 * the same cream, gold and ink as every other screen and follows light/dark with it.
 *
 * Two parts:
 *   WALL_TOKENS_CSS  declares the tokens on `.wwp` (the Wall, which has no shell around it) and on `.wwp-scope` (the banner
 *                    and chip, which sit inside the React shell). They must bring their own: inside `.cshell` the shadcn
 *                    token bridge redefines --accent as an HSL triplet, so var(--accent) there is not a colour.
 *   PLAN_UI_CSS      uses tokens only (var(--...)).
 */

export const WALL_TOKENS_CSS = String.raw`
.wwp, .wwp-scope{ color-scheme:light; accent-color:var(--accent);
  font-family:"Geist","Inter",system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13.5px; line-height:1.5; -webkit-font-smoothing:antialiased; letter-spacing:-.006em;
  --bg:#F7F6F3; --surface:#FFFFFF; --surface-2:#FAF9F6; --surface-3:#F3F1EC; --ink:#1A1815; --ink-2:#605A52; --ink-3:#6E6A62; --ink-4:#8C857B;
  --border:#EBE9E3; --border-2:#DEDBD3; --accent:#B8863B; --accent-ink:#8A6220; --accent-wash:#F5EFE2; --accent-line:#E3D3AE; --on-accent:#FFFFFF;
  --ok:#3F7A55; --ok-wash:#EEF4EF; --warn:#8A6220; --warn-wash:#F6EEDD; --info:#3F6FA6; --info-wash:#EDF2F8; --bad:#A24845; --bad-wash:#F8ECEB;
  --shadow-xs:0 1px 2px rgba(20,18,15,.04); --shadow-sm:0 1px 3px rgba(20,18,15,.06),0 1px 2px rgba(20,18,15,.04); --shadow-md:0 8px 24px -12px rgba(20,18,15,.16);
  --r:12px; --r-sm:9px; --r-xs:7px; color:var(--ink); }
.wwp{ background:var(--bg); }
@media (prefers-color-scheme:dark){ .wwp:not([data-theme="light"]), .wwp-scope:not([data-theme="light"]){
  color-scheme:dark;
  --bg:#0C0B09; --surface:#161410; --surface-2:#121009; --surface-3:#1E1B15; --ink:#F5F2EC; --ink-2:#ABA498; --ink-3:#9A9184; --ink-4:#6B6558;
  --border:#26231C; --border-2:#322E25; --accent:#D8A85A; --accent-ink:#E7C079; --accent-wash:#221B10; --accent-line:#3A2F1A; --on-accent:#231A08;
  --ok:#7FB894; --ok-wash:#16211A; --warn:#D6A94E; --warn-wash:#221B0F; --info:#7FA6D6; --info-wash:#141D28; --bad:#DA9490; --bad-wash:#241614;
  --shadow-xs:0 1px 2px rgba(0,0,0,.4); --shadow-sm:0 1px 3px rgba(0,0,0,.5); --shadow-md:0 10px 28px -12px rgba(0,0,0,.6); } }
.wwp[data-theme="dark"], .wwp-scope[data-theme="dark"]{
  color-scheme:dark;
  --bg:#0C0B09; --surface:#161410; --surface-2:#121009; --surface-3:#1E1B15; --ink:#F5F2EC; --ink-2:#ABA498; --ink-3:#9A9184; --ink-4:#6B6558;
  --border:#26231C; --border-2:#322E25; --accent:#D8A85A; --accent-ink:#E7C079; --accent-wash:#221B10; --accent-line:#3A2F1A; --on-accent:#231A08;
  --ok:#7FB894; --ok-wash:#16211A; --warn:#D6A94E; --warn-wash:#221B0F; --info:#7FA6D6; --info-wash:#141D28; --bad:#DA9490; --bad-wash:#241614;
  --shadow-xs:0 1px 2px rgba(0,0,0,.4); --shadow-sm:0 1px 3px rgba(0,0,0,.5); --shadow-md:0 10px 28px -12px rgba(0,0,0,.6); }
`

export const PLAN_UI_CSS = String.raw`
/* ── shared bits (work inside .wwp and .cshell) ── */
.wwp-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; height:36px; padding:0 14px; border-radius:9px; font:inherit; font-weight:600; font-size:13px; border:1px solid transparent; white-space:nowrap; cursor:pointer; text-decoration:none; transition:background .12s,border-color .12s,filter .12s; }
.wwp-btn svg{ width:16px; height:16px; flex:none; }
.wwp-btn:focus-visible, .wwp-link:focus-visible, .wwp-lang button:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
.wwp-btn.primary{ background:var(--accent); color:var(--on-accent); box-shadow:var(--shadow-xs); } .wwp-btn.primary:hover{ filter:brightness(1.05); }
.wwp-btn.ghost{ background:var(--surface); border-color:var(--border-2); color:var(--ink); } .wwp-btn.ghost:hover{ background:var(--surface-3); }
.wwp-btn.lg{ height:46px; padding:0 24px; border-radius:11px; font-size:14.5px; }
.wwp-btn.sm{ height:30px; padding:0 11px; font-size:12.5px; border-radius:8px; }
.wwp-btn[disabled]{ opacity:.6; cursor:default; filter:none; }
.wwp-card{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); }

/* ── the Wall ── */
.wwp{ position:fixed; inset:0; z-index:46; overflow:auto; }
.wwp *{ box-sizing:border-box; }
.wwp h1,.wwp h2,.wwp h3,.wwp p{ margin:0; }
.wwp-bar{ display:flex; align-items:center; gap:12px; padding:11px 24px; min-height:57px; border-bottom:1px solid var(--border); background:var(--surface); position:sticky; top:0; z-index:2; }
.wwp-brand{ display:flex; align-items:center; gap:10px; font-weight:600; font-size:14px; letter-spacing:-.01em; }
.wwp-logo{ width:32px; height:32px; border-radius:9px; background:var(--accent); color:var(--on-accent); display:grid; place-items:center; font-weight:700; font-size:15px; box-shadow:var(--shadow-xs); }
.wwp-links{ margin-left:auto; display:flex; align-items:center; gap:2px; flex-wrap:wrap; justify-content:flex-end; }
.wwp-link{ display:inline-flex; align-items:center; gap:7px; padding:7px 11px; border-radius:8px; color:var(--ink-2); font-weight:500; font-size:13px; background:transparent; border:0; cursor:pointer; text-decoration:none; font-family:inherit; }
.wwp-link:hover{ background:var(--surface-3); color:var(--ink); } .wwp-link svg{ width:15px; height:15px; color:var(--ink-3); }
.wwp-main{ max-width:1120px; margin:0 auto; padding:32px 24px 48px; display:grid; grid-template-columns:minmax(0,1fr) 372px; gap:16px; align-items:start; }
.wwp-main.solo{ max-width:680px; grid-template-columns:minmax(0,1fr); }
.wwp-main > .wwp-help{ grid-column:1 / -1; }
.wwp-hero{ padding:28px 30px 26px; }
.wwp-top{ display:flex; align-items:center; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.wwp-eyebrow{ display:inline-flex; align-items:center; gap:7px; font-size:11.5px; font-weight:600; padding:3px 10px 3px 8px; border-radius:7px; background:var(--accent-wash); color:var(--accent-ink); }
.wwp-eyebrow svg{ width:13px; height:13px; }
.wwp-eyebrow.bad{ background:var(--bad-wash); color:var(--bad); }
.wwp-lang{ margin-left:auto; display:inline-flex; gap:2px; background:var(--surface-2); border:1px solid var(--border); border-radius:9px; padding:2px; }
.wwp-lang button{ border:0; background:transparent; color:var(--ink-3); font:inherit; font-size:11.5px; font-weight:600; height:24px; padding:0 9px; border-radius:6px; cursor:pointer; }
.wwp-lang button[aria-pressed="true"]{ background:var(--surface); color:var(--ink); box-shadow:var(--shadow-xs); }
.wwp-title{ font-size:27px; font-weight:600; letter-spacing:-.03em; line-height:1.15; }
.wwp-title-ru{ font-size:17px; font-weight:500; color:var(--ink-3); letter-spacing:-.015em; margin-top:6px; }
.wwp-body{ margin-top:14px; display:flex; flex-direction:column; gap:4px; }
.wwp-body .en{ font-size:14.5px; color:var(--ink-2); line-height:1.55; } .wwp-body .ru{ font-size:13.5px; color:var(--ink-3); line-height:1.55; }
.wwp-safe{ margin-top:20px; display:flex; gap:13px; align-items:flex-start; padding:14px 16px; border-radius:var(--r-sm); background:var(--accent-wash); border:1px solid var(--accent-line); }
.wwp-safe > svg{ width:20px; height:20px; color:var(--accent-ink); flex:none; margin-top:1px; }
.wwp-safe .en{ font-size:13.5px; font-weight:600; color:var(--ink); } .wwp-safe .ru{ font-size:12.5px; color:var(--ink-2); margin-top:3px; }
.wwp-act{ margin-top:22px; display:flex; flex-wrap:wrap; align-items:center; gap:10px 14px; }
.wwp-act-sub{ margin-top:12px; display:flex; flex-wrap:wrap; gap:6px 16px; }
.wwp-textlink{ border:0; background:transparent; padding:0; font:inherit; font-size:13px; font-weight:600; color:var(--accent-ink); cursor:pointer; text-decoration:underline; text-underline-offset:3px; text-decoration-color:var(--accent-line); }
.wwp-textlink:hover{ text-decoration-color:var(--accent-ink); }
.wwp-hint{ margin-top:10px; font-size:12px; color:var(--ink-3); }
.wwp-missed{ margin-top:18px; padding-top:16px; border-top:1px solid var(--border); font-size:13px; }
.wwp-missed .en{ font-weight:600; color:var(--ink); } .wwp-missed .ru{ color:var(--ink-3); margin-top:2px; font-size:12.5px; }
.wwp-owner{ margin-top:20px; display:flex; align-items:center; gap:12px; padding:13px 16px; border-radius:var(--r-sm); background:var(--surface-2); border:1px solid var(--border); }
.wwp-owner svg{ width:18px; height:18px; color:var(--ink-3); flex:none; }
.wwp-owner b{ font-variant-numeric:tabular-nums; font-size:15px; font-weight:600; }
.wwp-obl{ padding:20px 24px 18px; }
.wwp-obl h2{ font-size:14px; font-weight:600; letter-spacing:-.01em; } .wwp-obl .ru-h{ color:var(--ink-3); font-weight:500; font-size:12.5px; margin-top:2px; }
.wwp-obl .resp{ font-size:12.5px; color:var(--ink-2); margin-top:10px; }
.wwp-rows{ margin:12px 0 0; display:flex; flex-direction:column; }
.wwp-row{ display:flex; align-items:flex-start; justify-content:space-between; gap:14px; padding:11px 0; border-top:1px solid var(--border); }
.wwp-row:first-child{ border-top:0; padding-top:4px; }
.wwp-row dt{ font-size:12.5px; color:var(--ink-2); line-height:1.4; min-width:0; } .wwp-row dt span{ display:block; color:var(--ink-4); font-size:11.5px; }
.wwp-row dd{ margin:0; text-align:right; font-size:17px; font-weight:600; letter-spacing:-.02em; font-variant-numeric:tabular-nums; min-width:0; overflow-wrap:anywhere; }
.wwp-row dd small{ display:block; font-size:11.5px; font-weight:500; letter-spacing:0; color:var(--ink-3); margin-top:1px; }
.wwp-row dd.sm{ font-size:14px; }
.wwp-row dd .rs{ font-size:11.5px; color:var(--ink-3); font-weight:600; margin-right:3px; }
.wwp-na{ color:var(--ink-4); font-weight:500; }
.wwp-exp{ margin-top:16px; padding-top:14px; border-top:1px solid var(--border); display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
.wwp-exp .t{ flex:1 1 260px; font-size:12px; color:var(--ink-3); min-width:0; } .wwp-exp .t .ru{ margin-top:2px; }
.wwp-err{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:12px 14px; border-radius:var(--r-sm); background:var(--bad-wash); color:var(--bad); font-size:12.5px; margin-top:12px; }
.wwp-help{ display:flex; align-items:center; gap:10px 18px; flex-wrap:wrap; padding:14px 20px; font-size:12.5px; color:var(--ink-3); }
.wwp-help b{ color:var(--ink); font-weight:600; } .wwp-help a{ color:var(--accent-ink); font-weight:600; text-decoration:none; } .wwp-help a:hover{ text-decoration:underline; }
.wwp-help .sp{ flex:1; }
.wwp-load{ display:grid; place-items:center; min-height:60vh; color:var(--ink-3); font-size:13px; }
@media (max-width:980px){ .wwp-main{ grid-template-columns:minmax(0,1fr); max-width:680px; } }
@media (max-width:640px){
  .wwp-bar{ padding:9px 14px; } .wwp-brand span.nm{ display:none; }
  .wwp-link span.t{ display:none; } .wwp-link{ padding:8px 10px; }
  .wwp-main{ padding:14px 12px 40px; gap:12px; } .wwp-hero{ padding:20px 18px 20px; } .wwp-obl{ padding:18px 16px 16px; }
  .wwp-title{ font-size:23px; } .wwp-title-ru{ font-size:15px; }
  .wwp-btn.lg{ width:100%; } .wwp-act{ flex-direction:column; align-items:stretch; }
  .wwp-lang{ margin-left:0; }
}

/* ── banners (inside the console) ── */
.wwp-banners{ position:sticky; top:0; z-index:30; display:flex; flex-direction:column; gap:8px; padding:10px 12px 0; background:linear-gradient(var(--bg) 70%,transparent); }
.wwp-banner{ display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:var(--r-sm); border:1px solid var(--border); background:var(--surface); box-shadow:var(--shadow-xs); font-size:13px; }
.wwp-banner > svg{ width:17px; height:17px; flex:none; color:var(--ink-3); }
.wwp-banner .tx{ flex:1; min-width:0; } .wwp-banner .en{ font-weight:600; color:var(--ink); line-height:1.4; } .wwp-banner .ru{ font-size:12px; color:var(--ink-3); margin-top:1px; line-height:1.4; }
.wwp-banner .acts{ display:flex; align-items:center; gap:6px; flex:none; }
.wwp-banner .x{ width:28px; height:28px; border-radius:7px; border:0; background:transparent; color:var(--ink-3); display:grid; place-items:center; cursor:pointer; } .wwp-banner .x:hover{ background:var(--surface-3); color:var(--ink); } .wwp-banner .x svg{ width:15px; height:15px; }
.wwp-banner.info{ background:var(--info-wash); border-color:transparent; } .wwp-banner.info > svg{ color:var(--info); }
.wwp-banner.accent{ background:var(--accent-wash); border-color:var(--accent-line); } .wwp-banner.accent > svg{ color:var(--accent-ink); }
.wwp-banner.warn{ background:var(--warn-wash); border-color:transparent; } .wwp-banner.warn > svg{ color:var(--warn); }
.wwp-banner.bad{ background:var(--bad-wash); border-color:transparent; } .wwp-banner.bad > svg{ color:var(--bad); } .wwp-banner.bad .en{ color:var(--bad); }
.wwp-banner.ok{ background:var(--ok-wash); border-color:transparent; } .wwp-banner.ok > svg{ color:var(--ok); }
@media (max-width:640px){ .wwp-banner{ flex-wrap:wrap; align-items:flex-start; } .wwp-banner .acts{ width:100%; justify-content:flex-end; } .wwp-banners{ padding:8px 8px 0; position:static; background:none; } }

/* ── the quiet chip ── */
.wwp-chip{ display:inline-flex; align-items:center; gap:7px; height:26px; padding:0 10px 0 8px; border-radius:20px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); font:inherit; font-size:11.5px; font-weight:600; cursor:pointer; text-decoration:none; white-space:nowrap; max-width:100%; }
.wwp-chip:hover{ background:var(--surface-3); color:var(--ink); }
.wwp-chip i{ width:7px; height:7px; border-radius:50%; background:var(--ok); flex:none; }
.wwp-chip.warn i{ background:var(--warn); } .wwp-chip.bad i{ background:var(--bad); } .wwp-chip.bad{ color:var(--bad); }
.wwp-chip span{ overflow:hidden; text-overflow:ellipsis; }
`
