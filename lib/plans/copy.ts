/**
 * Plans copy: every sentence the lock screen, the banners, the billing states and the customer notices say, in English
 * and in Roman Urdu. PURE (no React) so scripts/plans-wall-check.mts can prove both languages exist for every key and
 * that both use the same {placeholders}.
 *
 * Style (PLANS-RESEARCH.md C6): short, calm, specific dates and times, one action, and when something is locked it ALWAYS
 * says the data is safe. Roman Urdu is the product's own style (Taareekh, Aapka plan ...), not Urdu script.
 *
 * NATIVE-SPEAKER REVIEW: the English and the C6 Roman Urdu rows are the spec's wording; every other Roman Urdu row was
 * written to match its tone and is listed in regression/pl-c-wall.md for review before shipping.
 *
 * Placeholders: {planName} {date} {trialEnd} {graceEnd} {lockedDate} {retainUntil} {days} {n} {hall} {amount} {owner}.
 * A placeholder with no value makes the WHOLE sentence unavailable (fill() returns null), so a screen can fall back to a
 * shorter honest sentence instead of ever printing "until undefined" or an invented date.
 */

export type Lang = "en" | "ru"
export interface Pair { en: string; ru: string }

export const COPY = {
  /* ───────────── banners ───────────── */
  "trial.welcome": {
    en: "Welcome to WeddingWala. Your free month has started. Everything in {planName} is open until {trialEnd}. No card needed.",
    ru: "WeddingWala mein khush aamdeed. Aap ka muft mahina shuru ho gaya hai. {trialEnd} tak {planName} ke tamam features khule hain. Card ki zaroorat nahi.",
  },
  "trial.t7": {
    en: "{days} days left in your free month. Choose a plan to keep going. The days you have left are added on top.",
    ru: "Aap ke muft mahine ke {days} din reh gaye hain. Plan chun lein. Bache hue din upar se jud jayenge.",
  },
  "trial.t10.free": {
    en: "{days} days left in your free month. After {trialEnd} you move to the Free plan: paid modules become read-only and your data stays safe.",
    ru: "Aap ke muft mahine ke {days} din reh gaye hain. {trialEnd} ke baad aap Free plan par chale jayenge: paid modules sirf dekhne ke liye reh jayenge aur data mehfooz rahega.",
  },
  "trial.t3.free": {
    en: "{days} days left. After {trialEnd} you move to the Free plan: paid modules become read-only. Your data stays safe.",
    ru: "Sirf {days} din baqi hain. {trialEnd} ke baad aap Free plan par chale jayenge: paid modules sirf dekhne ke liye reh jayenge. Data mehfooz rahega.",
  },
  "cancelling.banner.free": {
    en: "Your plan is cancelled. Everything stays open until {date}, then you move to the Free plan. Your data stays safe.",
    ru: "Aap ka plan cancel ho chuka hai. {date} tak sab kuch khula hai, phir aap Free plan par chale jayenge. Aap ka data mehfooz rahega.",
  },
  "past_due.banner.free": {
    en: "Your payment didn't go through. Fix it by {graceEnd} to keep your paid modules open; after that you move to the Free plan.",
    ru: "Aap ki payment nahi ho saki. Paid modules khule rakhne ke liye {graceEnd} tak theek kar lein; uske baad aap Free plan par chale jayenge.",
  },
  "freetier.banner": {
    en: "You are on the Free plan. Free modules keep working; paid modules are read-only. Choose a plan to open them again.",
    ru: "Aap Free plan par hain. Free modules chalte rahenge; paid modules sirf dekhne ke liye hain. Dobara kholne ke liye plan chun lein.",
  },
  "chip.free": { en: "Free plan", ru: "Free plan (muft)" },
  "bill.free.title": { en: "You are on the Free plan", ru: "Aap Free plan par hain" },
  "bill.free.line": {
    en: "Overview, Leads, Bookings, Calendar, Chat and the other free modules keep working. Paid modules are read-only: you can see what you already have, but cannot add to it. Choose a plan below and they open the moment payment is confirmed.",
    ru: "Overview, Leads, Bookings, Calendar, Chat aur baqi free modules chalte rahenge. Paid modules sirf dekhne ke liye hain: jo data hai wo nazar aayega, naya nahi add ho sakta. Neeche se plan chunein, payment confirm hote hi khul jayenge.",
  },
  "trial.t3": {
    en: "{days} days left. After {trialEnd} your dashboard locks. Your data stays safe.",
    ru: "Sirf {days} din baqi hain. {trialEnd} ke baad dashboard band ho jayega. Aap ka data mehfooz rahega.",
  },
  "trial.t1": {
    en: "Your free month ends tomorrow at 11:59 PM. Subscribe now so nothing stops.",
    ru: "Aap ka muft mahina kal raat 11:59 baje khatam ho raha hai. Abhi subscribe karein taake kaam na ruke.",
  },
  "trial.today": {
    en: "Your free month ends today at 11:59 PM. Subscribe now so nothing stops.",
    ru: "Aap ka muft mahina aaj raat 11:59 baje khatam ho raha hai. Abhi subscribe karein taake kaam na ruke.",
  },
  "past_due.banner": {
    en: "Your payment didn't go through. Fix it by {graceEnd} to keep your dashboard open.",
    ru: "Aap ki payment nahi ho saki. Dashboard khula rakhne ke liye {graceEnd} tak theek kar lein.",
  },
  "past_due.banner_nodate": {
    en: "Your payment didn't go through. Fix it soon to keep your dashboard open.",
    ru: "Aap ki payment nahi ho saki. Dashboard khula rakhne ke liye jald theek kar lein.",
  },
  "cancelling.banner": {
    en: "Your plan is cancelled. Everything stays open until {date}, then your dashboard locks. Your data stays safe.",
    ru: "Aap ka plan cancel ho chuka hai. {date} tak sab kuch khula hai, phir dashboard band ho jayega. Aap ka data mehfooz rahega.",
  },
  "comp.banner": {
    en: "Your complimentary access ends on {date}. Choose a plan to keep going.",
    ru: "Aap ki complimentary access {date} ko khatam ho rahi hai. Jari rakhne ke liye plan chun lein.",
  },
  "banner.locked_here": {
    en: "Your dashboard is locked. Renew your plan to open it again. Your data is safe.",
    ru: "Aap ka dashboard band hai. Dobara kholne ke liye plan renew karein. Aap ka data mehfooz hai.",
  },
  "banner.reactivated": {
    en: "Welcome back. Everything is exactly as you left it.",
    ru: "Dobara khush aamdeed. Sab kuch bilkul waisa hi hai jaisa aap chor kar gaye the.",
  },
  "unstarted.banner": {
    en: "Add your business to start your free month. No card needed.",
    ru: "Apna business add karein, aap ka muft mahina shuru ho jayega. Card ki zaroorat nahi.",
  },
  "banner.cta.add": { en: "Add your business", ru: "Business add karein" },
  "banner.cta.choose": { en: "Choose a plan", ru: "Plan chunein" },
  "banner.cta.pay": { en: "Pay now", ru: "Abhi pay karein" },
  "banner.cta.resume": { en: "Resume plan", ru: "Plan dobara chalu karein" },
  "banner.cta.renew": { en: "Renew plan", ru: "Plan renew karein" },
  "banner.dismiss": { en: "Hide for today", ru: "Aaj ke liye chhupayein" },
  "banner.dismiss_welcome": { en: "Got it", ru: "Theek hai" },

  /* header chip (the quiet one that is always there during a trial) */
  "chip.trial": { en: "Free trial · {days} days left", ru: "Muft trial · {days} din baqi" },
  "chip.trial_nodays": { en: "Free trial", ru: "Muft trial" },
  "chip.trial_1": { en: "Free trial · ends tomorrow", ru: "Muft trial · kal khatam" },
  "chip.trial_0": { en: "Free trial · ends today", ru: "Muft trial · aaj khatam" },
  "chip.past_due": { en: "Payment due", ru: "Payment baqi" },
  "chip.cancelling": { en: "Ends {date}", ru: "{date} ko khatam" },
  "chip.comp": { en: "Complimentary", ru: "Complimentary" },
  "chip.title": { en: "Plan & billing", ru: "Plan aur billing" },

  /* ───────────── the Wall ───────────── */
  "wall.eyebrow.locked": { en: "Dashboard paused", ru: "Dashboard band hai" },
  "wall.eyebrow.suspended": { en: "Account on hold", ru: "Account rok diya gaya hai" },
  "wall.trial_ended.title": { en: "Your free month has ended", ru: "Aap ka muft mahina khatam ho gaya" },
  "wall.trial_ended.body": {
    en: "Choose a plan to open your dashboard again. Everything comes back exactly as you left it.",
    ru: "Dashboard dobara kholne ke liye plan chun lein. Sab kuch bilkul waisa hi wapas aayega.",
  },
  "wall.no_plan.title": { en: "Choose a plan to open your dashboard", ru: "Dashboard kholne ke liye plan chunein" },
  "wall.no_plan.body": {
    en: "WeddingWala vendor plans are paid plans. Pick the plan that fits your venue.",
    ru: "WeddingWala vendor plans paid plans hain. Apne venue ke liye munasib plan chun lein.",
  },
  "wall.trial_blocked.body": {
    en: "A free month has already been used for this account, phone number or business. Choose a plan to open your dashboard.",
    ru: "Is account, phone number ya business par muft mahina pehle istemal ho chuka hai. Dashboard kholne ke liye plan chun lein.",
  },
  "wall.cta.trial": { en: "Start your free trial", ru: "Muft trial shuru karein" },
  "wall.plan_ended.title": { en: "Your {planName} plan has ended", ru: "Aap ka {planName} plan khatam ho gaya" },
  "wall.plan_ended.body": {
    en: "Your {planName} plan ended on {lockedDate}. Renew to open your dashboard. Everything comes back exactly as you left it.",
    ru: "Aap ka {planName} plan {lockedDate} ko khatam ho gaya. Dashboard kholne ke liye renew karein. Sab kuch bilkul waisa hi wapas aayega.",
  },
  "wall.plan_ended.body_nodate": {
    en: "Your {planName} plan has ended. Renew to open your dashboard. Everything comes back exactly as you left it.",
    ru: "Aap ka {planName} plan khatam ho gaya hai. Dashboard kholne ke liye renew karein. Sab kuch bilkul waisa hi wapas aayega.",
  },
  "wall.payment_failed.title": { en: "Your payment didn't go through", ru: "Aap ki payment nahi ho saki" },
  "wall.payment_failed.body": {
    en: "The time to fix it has ended, so your dashboard is paused. Renew to open it again. Everything comes back exactly as you left it.",
    ru: "Theek karne ka waqt khatam ho gaya, is liye dashboard band hai. Dobara kholne ke liye renew karein. Sab kuch bilkul waisa hi wapas aayega.",
  },
  "wall.cancelled.title": { en: "Your plan has ended", ru: "Aap ka plan khatam ho gaya" },
  "wall.cancelled.body": {
    en: "You cancelled your plan and the paid period is over. Renew to open your dashboard. Everything comes back exactly as you left it.",
    ru: "Aap ne plan cancel kiya tha aur paid muddat poori ho gayi. Dashboard kholne ke liye renew karein. Sab kuch bilkul waisa hi wapas aayega.",
  },
  "wall.dormant.title": { en: "Your account has been paused for a while", ru: "Aap ka account kaafi dair se band hai" },
  "wall.dormant.body": {
    en: "Your dashboard has been locked for more than 90 days. Your records are still kept. Choose a plan and they come back as you left them.",
    ru: "Aap ka dashboard 90 din se zyada se band hai. Aap ke records ab bhi mehfooz hain. Plan chun lein to woh bilkul waisay hi wapas aayenge.",
  },
  "wall.closed.title": { en: "Your account is closed", ru: "Aap ka account band kar diya gaya hai" },
  "wall.closed.body": {
    en: "This account was closed after a long pause. Records the law asks us to keep are still held. Contact us to open it again.",
    ru: "Lambi muddat band rehne ke baad yeh account band kiya gaya. Qanoon ke mutabiq jo records rakhne hain woh mehfooz hain. Dobara kholne ke liye hum se rabta karein.",
  },
  "wall.suspended.title": { en: "Your account is on hold", ru: "Aap ka account rok diya gaya hai" },
  "wall.suspended.body": {
    en: "WeddingWala has put this account on hold. Please contact our support team so we can sort it out together.",
    ru: "WeddingWala ne is account ko rok diya hai. Barah-e-meherbani support team se rabta karein taake hum mil kar masla hal karein.",
  },
  "wall.staff.title": { en: "Your company's plan has ended", ru: "Aap ki company ka plan khatam ho gaya" },
  "wall.staff.body": {
    en: "Your company's WeddingWala plan has ended. Please ask the owner to renew.",
    ru: "Aap ki company ka WeddingWala plan khatam ho gaya hai. Meherbani karke owner se renew karwaen.",
  },
  "wall.staff.owner": { en: "Owner: {owner}", ru: "Owner: {owner}" },
  "wall.staff.recheck": { en: "Check again", ru: "Dobara check karein" },
  "wall.staff.recheck_hint": { en: "Once the owner has renewed, this opens again.", ru: "Owner ke renew karte hi yeh dobara khul jayega." },
  "wall.safe": {
    en: "Your data is safe. Nothing has been deleted. We keep everything until {retainUntil}.",
    ru: "Aap ka data mehfooz hai. Kuch delete nahi hua. Hum sab kuch {retainUntil} tak rakhte hain.",
  },
  "wall.safe_nodate": {
    en: "Your data is safe. Nothing has been deleted.",
    ru: "Aap ka data mehfooz hai. Kuch delete nahi hua.",
  },
  "wall.cta.renew": { en: "Renew {planName}", ru: "{planName} renew karein" },
  "wall.cta.choose": { en: "Choose a plan", ru: "Plan chunein" },
  "wall.cta.other": { en: "Choose a different plan", ru: "Doosra plan chunein" },
  "wall.cta.manual": { en: "Pay by bank transfer, JazzCash or Easypaisa", ru: "Bank transfer, JazzCash ya Easypaisa se pay karein" },
  "wall.cta.contact": { en: "Contact support on WhatsApp", ru: "Support se WhatsApp par rabta karein" },
  "wall.cta.opening": { en: "Opening Safepay...", ru: "Safepay khul raha hai..." },
  "wall.cta.hint": {
    en: "Cards only through Safepay. Your price: Rs {amount} a month. No commission on your bookings.",
    ru: "Safepay ke zariye sirf card. Aap ka rate: Rs {amount} har mahina. Aap ki bookings par koi commission nahi.",
  },
  "wall.missed.n": {
    en: "{n} enquiries came in while your plan was paused. Renew to see them.",
    ru: "Plan band hone ke dauran {n} enquiries aayi hain. Dekhne ke liye renew karein.",
  },
  "wall.missed.one": {
    en: "1 enquiry came in while your plan was paused. Renew to see it.",
    ru: "Plan band hone ke dauran 1 enquiry aayi hai. Dekhne ke liye renew karein.",
  },
  "wall.help": { en: "Need help? We are here.", ru: "Madad chahiye? Hum yahan hain." },
  "wall.link.billing": { en: "Plan & billing", ru: "Plan aur billing" },
  "wall.link.receipts": { en: "Receipts", ru: "Receipts" },
  "wall.link.account": { en: "Account", ru: "Account" },
  "wall.link.logout": { en: "Log out", ru: "Log out" },
  "wall.lang.both": { en: "English + Roman Urdu", ru: "English + Roman Urdu" },
  "wall.lang.en": { en: "English", ru: "English" },
  "wall.lang.ru": { en: "Roman Urdu", ru: "Roman Urdu" },
  "wall.checking": { en: "Checking your account...", ru: "Aap ka account check ho raha hai..." },
  "wall.error": {
    en: "We could not load this. Your data is safe. Please try again.",
    ru: "Yeh load nahi ho saka. Aap ka data mehfooz hai. Dobara koshish karein.",
  },
  "wall.retry": { en: "Try again", ru: "Dobara koshish karein" },

  /* ───────────── obligations strip + export ───────────── */
  "obl.title": { en: "While your plan is paused", ru: "Jab tak plan band hai" },
  "obl.title_hold": { en: "While your account is on hold", ru: "Jab tak account rok diya gaya hai" },
  "obl.responsibility": { en: "These are still your responsibility.", ru: "Yeh abhi bhi aap ki zimmedari hain." },
  "obl.events": { en: "Confirmed events in the next 60 days", ru: "Agle 60 din ke confirmed events" },
  "obl.next": { en: "Next event", ru: "Agla event" },
  "obl.next_none": { en: "None in the next 60 days", ru: "Agle 60 din mein koi nahi" },
  "obl.collect": { en: "Still to collect", ru: "Abhi wasool karna baqi" },
  "obl.cheques": { en: "Cheques due in 14 days", ru: "14 din mein due cheques" },
  "obl.sentence": {
    en: "{n} confirmed events in the next 60 days (next: {date}, {hall}). Rs {amount} still to collect.",
    ru: "Agle 60 din mein {n} confirmed events (agla: {date}, {hall}). Rs {amount} abhi wasool karna baqi hai.",
  },
  "obl.error": {
    en: "We could not load your upcoming events. They are safe. Try again.",
    ru: "Aap ke aane wale events load nahi ho sake. Woh mehfooz hain. Dobara koshish karein.",
  },
  "export.title": { en: "Your records", ru: "Aap ke records" },
  "export.btn": { en: "Download money & tax records (CSV)", ru: "Paisa aur tax records download karein (CSV)" },
  "export.note": {
    en: "Receipts, payments, expenses and tax summary. They are yours, any time, even while your plan is paused.",
    ru: "Receipts, payments, expenses aur tax summary. Yeh aap ke hain, kisi bhi waqt, plan band ho tab bhi.",
  },
  "export.busy": { en: "Preparing your file...", ru: "Aap ki file tayyar ho rahi hai..." },
  "export.failed": { en: "The file could not be prepared. Nothing is lost. Try again.", ru: "File tayyar nahi ho saki. Kuch zaya nahi hua. Dobara koshish karein." },

  /* ───────────── billing page states ───────────── */
  "bill.trial.title": { en: "Free trial", ru: "Muft trial" },
  "bill.trial.line": {
    en: "Everything in {planName} is open until {trialEnd}. No card, no charge.",
    ru: "{trialEnd} tak {planName} ke tamam features khule hain. Card nahi, charge nahi.",
  },
  "bill.trial.carry": {
    en: "Subscribe before it ends and the days you have left are added on top.",
    ru: "Khatam hone se pehle subscribe karein to bache hue din upar se jud jayenge.",
  },
  "bill.trial.countdown": { en: "{days} days left", ru: "{days} din baqi" },
  "bill.trial.start": { en: "Start free trial", ru: "Muft trial shuru karein" },
  "bill.trial.fallback_note": {
    en: "Your free month normally starts by itself. If it has not, you can start it here.",
    ru: "Aap ka muft mahina aam tor par khud shuru ho jata hai. Agar nahi hua to yahan se shuru kar lein.",
  },
  "bill.locked.title": { en: "Your plan is paused", ru: "Aap ka plan band hai" },
  "bill.locked.line": {
    en: "Choose a plan below. Your dashboard opens the moment payment is confirmed. Your data is safe.",
    ru: "Neeche se plan chunein. Payment confirm hote hi dashboard khul jayega. Aap ka data mehfooz hai.",
  },
  "bill.honest.title": { en: "What each plan allows", ru: "Har plan mein kya hai" },
  "bill.honest.note": {
    en: "There is no free vendor plan. Every plan has the same unlimited bookings and enquiries; the plans differ in the limits and features shown here. You can raise or lower your plan at any time; if you go below what you use, nothing is deleted, you choose which venues stay live.",
    ru: "Vendors ke liye koi free plan nahi hai. Har plan mein bookings aur enquiries unlimited hain; plans sirf yahan dikhai gayi hadon aur features mein farq rakhte hain. Aap jab chahein plan upar ya neeche kar sakte hain; agar aap apne istemal se neeche jayen to kuch delete nahi hota, aap chunte hain kaun se venues live rahenge.",
  },
  "manual.title": { en: "Pay by bank transfer, JazzCash or Easypaisa", ru: "Bank transfer, JazzCash ya Easypaisa se pay karein" },
  "manual.intro": {
    en: "Send the amount for your plan, then upload the receipt or a screenshot. We check it in business hours and open your dashboard as soon as it is approved.",
    ru: "Apne plan ki raqam bhej dein, phir receipt ya screenshot upload karein. Hum business hours mein check karte hain aur manzoor hote hi dashboard khol dete hain.",
  },
  "manual.step1": { en: "1. Pick your plan", ru: "1. Apna plan chunein" },
  "manual.step2": { en: "2. Send the money to one of these accounts", ru: "2. In accounts mein se kisi ek mein raqam bhejein" },
  "manual.step3": { en: "3. Upload your proof", ru: "3. Apna saboot upload karein" },
  "manual.field.method": { en: "How did you pay?", ru: "Aap ne kaise pay kiya?" },
  "manual.field.reference": { en: "Transaction ID or reference", ru: "Transaction ID ya reference" },
  "manual.field.amount": { en: "Amount sent (Rs)", ru: "Bheji gayi raqam (Rs)" },
  "manual.field.proof": { en: "Receipt or screenshot (image or PDF)", ru: "Receipt ya screenshot (image ya PDF)" },
  "manual.open": { en: "Upload proof", ru: "Saboot upload karein" },
  "manual.submit": { en: "Send for approval", ru: "Manzoori ke liye bhejein" },
  "manual.sending": { en: "Sending...", ru: "Bhej rahe hain..." },
  "manual.pending.title": { en: "Waiting for approval", ru: "Manzoori ka intezaar" },
  "manual.pending.body": {
    en: "We received your proof on {date}. We check in business hours. You do not need to send it again.",
    ru: "Hamein aap ka saboot {date} ko mil gaya. Hum business hours mein check karte hain. Dobara bhejne ki zaroorat nahi.",
  },
  "manual.approved.title": { en: "Approved", ru: "Manzoor ho gaya" },
  "manual.approved.body": { en: "Your payment was approved. Your dashboard is open.", ru: "Aap ki payment manzoor ho gayi. Dashboard khula hai." },
  "manual.rejected.title": { en: "We could not approve this proof", ru: "Hum yeh saboot manzoor nahi kar sake" },
  "manual.rejected.body": { en: "Reason: {reason}. Please send a clearer proof or contact us.", ru: "Wajah: {reason}. Barah-e-meherbani wazeh saboot bhejein ya hum se rabta karein." },
  "manual.rejected.body_noreason": { en: "Please send a clearer proof or contact us.", ru: "Barah-e-meherbani wazeh saboot bhejein ya hum se rabta karein." },
  "manual.unavailable": {
    en: "Manual payment is not open yet. Please pay by card, or contact us and we will help.",
    ru: "Manual payment abhi khuli nahi. Barah-e-meherbani card se pay karein, ya hum se rabta karein.",
  },

  /* ───────────── over the plan's limit ───────────── */
  "over.title": { en: "You are above your plan's limit", ru: "Aap apne plan ki had se aage hain" },
  "over.body": {
    en: "Your {planName} plan allows {max} {noun} and you have {used}. Nothing is deleted. Choose which ones stay live; the rest are paused and come back when you upgrade.",
    ru: "Aap ke {planName} plan mein {max} {noun} ki ijazat hai aur aap ke paas {used} hain. Kuch delete nahi hota. Chunein kaun se live rahenge; baqi pause ho jayenge aur upgrade karne par wapas aa jayenge.",
  },
  "over.banner": {
    en: "You are above your plan's limit. Nothing is deleted. Choose what stays live, or upgrade to keep it all.",
    ru: "Aap apne plan ki had se aage hain. Kuch delete nahi hota. Chunein kya live rahe, ya upgrade karein taake sab rahe.",
  },
  "banner.cta.over": { en: "Choose what stays", ru: "Kya rahe, chunein" },
  "over.allowed": { en: "Live on your plan ({n})", ru: "Aap ke plan par live ({n})" },
  "over.paused": { en: "Paused ({n})", ru: "Pause ({n})" },
  "over.pick": { en: "Pick the venues that stay live", ru: "Wo venues chunein jo live rahenge" },
  "over.pick_hint": { en: "Choose up to {max}.", ru: "Zyada se zyada {max} chunein." },
  "over.save": { en: "Save my choice", ru: "Meri pasand mehfooz karein" },
  "over.saving": { en: "Saving...", ru: "Mehfooz ho raha hai..." },
  "over.saved": { en: "Saved. The other venues are paused, not deleted.", ru: "Mehfooz ho gaya. Baqi venues pause hain, delete nahi." },
  "over.upgrade": { en: "Or upgrade to keep them all live", ru: "Ya upgrade karein taake sab live rahein" },
  "over.paused_note": {
    en: "Paused venues are hidden from couples and from search. Their bookings and records are untouched.",
    ru: "Pause venues couples aur search se chhup jate hain. Un ki bookings aur records waisay hi rehte hain.",
  },
  "over.unavailable": {
    en: "Choosing live venues is not open yet. Nothing has been paused.",
    ru: "Live venues chunna abhi khula nahi. Kuch pause nahi hua.",
  },

  /* ───────────── customers ───────────── */
  "cust.unavailable.title": { en: "Enquiries are paused", ru: "Enquiries abhi band hain" },
  "cust.unavailable.body": {
    en: "This venue isn't taking new enquiries right now. Already booked? Your booking is unaffected.",
    ru: "Yeh venue abhi naye enquiries nahi le raha. Agar aap pehle se book kar chuke hain to aap ki booking par koi asar nahi.",
  },
  "cust.unavailable.view": { en: "View your booking", ru: "Apni booking dekhein" },
  "cust.unavailable.browse": { en: "See other venues", ru: "Doosre venues dekhein" },
  "cust.cta.disabled": { en: "Not taking enquiries", ru: "Enquiries band hain" },
  "cust.stored": {
    en: "We have your message. The venue will see it as soon as it is back online. WeddingWala support has been told.",
    ru: "Aap ka paigham hamare paas hai. Venue ke wapas aate hi dekh lega. WeddingWala support ko bata diya gaya hai.",
  },
} as const satisfies Record<string, Pair>

export type CopyKey = keyof typeof COPY
export type CopyVars = Partial<Record<string, string | number | null | undefined>>

const PLACEHOLDER = /\{([a-zA-Z]+)\}/g

/** The placeholders a sentence uses. */
export function placeholdersOf(text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(PLACEHOLDER)) if (!out.includes(m[1])) out.push(m[1])
  return out
}

/**
 * Fill one sentence. Returns null when any placeholder has no value: the caller then uses a sentence that does not need it
 * (the "..._nodate" variants) rather than printing a hole or an invented date.
 */
export function fill(key: CopyKey, lang: Lang, vars: CopyVars = {}): string | null {
  const text = (COPY[key] as Pair)[lang]
  let missing = false
  const out = text.replace(PLACEHOLDER, (_m, name: string) => {
    const v = vars[name]
    if (v === null || v === undefined || v === "") { missing = true; return "" }
    return String(v)
  })
  return missing ? null : out
}

/** fill() that never returns null: for sentences whose values are always present. */
export function say(key: CopyKey, lang: Lang, vars: CopyVars = {}): string {
  return fill(key, lang, vars) ?? (COPY[key] as Pair)[lang].replace(PLACEHOLDER, "")
}

/** The first key whose placeholders are all filled; the ladder for "with a date" then "without one". */
export function firstFilled(keys: CopyKey[], lang: Lang, vars: CopyVars = {}): string {
  for (const k of keys) { const t = fill(k, lang, vars); if (t !== null) return t }
  return say(keys[keys.length - 1], lang, vars)
}
