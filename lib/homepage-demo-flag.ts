// The homepage sections gated by this flag render HARDCODED sample data, not
// live API data (testimonials, premium partners, sponsored spotlight, city
// spotlights, featured venues, promoted deals, bridal lookbook, vendor awards,
// real weddings). Per the "never show fake/placeholder content" rule they are
// hidden by default. Flip NEXT_PUBLIC_HOMEPAGE_DEMO_CONTENT=true only in a
// demo/preview environment, or once each section is wired to real backend data.
export const HOMEPAGE_DEMO_CONTENT =
  process.env.NEXT_PUBLIC_HOMEPAGE_DEMO_CONTENT === "true"
