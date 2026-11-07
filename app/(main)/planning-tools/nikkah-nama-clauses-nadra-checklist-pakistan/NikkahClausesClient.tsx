"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Printer,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  HelpCircle,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Clause {
  id: number;
  colNumber: string;
  urduTitle: string;
  englishTitle: string;
  explanation: string;
  recommendedText: string;
  commonMistake: string;
  badge: "Critical" | "Financial" | "Legal" | "Important";
}

const CLAUSES_DATA: Clause[] = [
  {
    id: 13,
    colNumber: "Column 13",
    urduTitle: "مہر کی رقم (Haq Mehr Total Amount)",
    englishTitle: "Total Amount of Haq Mehr",
    explanation:
      "Specifies the exact monetary value or gold weight agreed as Haq Mehr. In Pakistan, always specify if it is cash in PKR, tola of 24k gold, or equivalent market value at the time of demand.",
    recommendedText:
      "Example: 10 Tolas Gold (24 Karat) or Cash PKR 1,500,000/- as mutually settled.",
    commonMistake:
      "Writing vague amounts like 'Sharaee Mehr' (which has very low historical values like ~PKR 100-2,000) or leaving the box blank.",
    badge: "Financial",
  },
  {
    id: 14,
    colNumber: "Column 14",
    urduTitle: "معجل اور غیر معجل (Mu'ajjal vs Mu'wajjal)",
    englishTitle: "Prompt vs Deferred Payment",
    explanation:
      "Mu'ajjal (معجل) is payable immediately at the time of Nikkah. Mu'wajjal (غیر معجل) is deferred to a future date or upon demand / contingency.",
    recommendedText:
      "Clearly split: e.g., '5 Tolas Gold Mu'ajjal (paid at Nikkah) and 5 Tolas Gold Mu'wajjal (payable upon demand)'.",
    commonMistake:
      "Assuming deferred means it is forgiven or never payable. Under Pakistani law, deferred Mehr is a legally binding civil debt payable on demand.",
    badge: "Financial",
  },
  {
    id: 15,
    colNumber: "Column 15",
    urduTitle: "مہر کی ادائیگی بروقت نکاح",
    englishTitle: "Portion Paid During Nikkah",
    explanation:
      "States whether any portion of the Haq Mehr (gold jewelry, cash, or bank transfer) was physically handed over to the bride in the presence of the witnesses at the Nikkah ceremony.",
    recommendedText:
      "Specify exact items handed over, e.g., '1 Gold set weighing 3 tolas handed over to bride in the presence of witnesses'.",
    commonMistake:
      "Leaving this blank when gold was actually handed over as part of the formal Mehr.",
    badge: "Financial",
  },
  {
    id: 16,
    colNumber: "Column 16",
    urduTitle: "عوضِ مہر منقولہ یا غیر منقولہ جائیداد",
    englishTitle: "Property Given in Lieu of Mehr",
    explanation:
      "If immovable property (plot, residential apartment, commercial shop) or vehicle is gifted as Haq Mehr, full registry, plot number, and town details must be documented here.",
    recommendedText:
      "Plot No. XX, Sector XX, Phase XX, DHA / Bahria / Scheme, City, transferred in the bride's sole ownership.",
    commonMistake:
      "Writing '1 Plot' without registry or plot registration numbers, making legal transfer difficult later.",
    badge: "Financial",
  },
  {
    id: 17,
    colNumber: "Column 17",
    urduTitle: "خاص شرائط (Special Conditions & Maintenance)",
    englishTitle: "Special Conditions & Monthly Allowance",
    explanation:
      "This column permits mutual agreements under Muslim Family Laws Ordinance 1961: monthly maintenance (Kharch-e-Paan Dan / Guzara allowance), separate residence, continuation of higher education, or employment.",
    recommendedText:
      "Example: 'Monthly maintenance of PKR 40,000/- to be deposited to bride's account by 5th of each month; wife retains full right to pursue higher education and professional career; independent residence provided'.",
    commonMistake:
      "Writing 'کوئی نہیں' (None) or letting the Qazi cross it out without discussing mutual terms with both families.",
    badge: "Critical",
  },
  {
    id: 18,
    colNumber: "Column 18",
    urduTitle: "تفویضِ طلاق (Delegated Right of Divorce)",
    englishTitle: "Delegated Right to Divorce (Tafweez-e-Talaq)",
    explanation:
      "Under Section 8 of the Muslim Family Laws Ordinance 1961, the husband can delegate his unconditional or conditional right to divorce to the wife. If granted, the wife can dissolve the marriage without having to surrender her Haq Mehr or endure months of family court litigation for Khula.",
    recommendedText:
      "Recommended: 'تفویضِ طلاق کا غیر مشروط حق دیا گیا' (Unconditional right of delegated divorce is granted to the wife).",
    commonMistake:
      "Qazis or relatives crossing this column out with a slash without the bride's consent. Crossing out this column is contrary to statutory rights in Pakistan and deprives women of their legitimate legal safeguards.",
    badge: "Critical",
  },
  {
    id: 19,
    colNumber: "Column 19",
    urduTitle: "شوہر کے حقِ طلاق پر کوئی پابندی",
    englishTitle: "Restrictions on Husband's Right to Divorce",
    explanation:
      "Allows the parties to record contractual stipulations or financial consequences if the husband exercises arbitrary unilateral divorce without justification.",
    recommendedText:
      "Can state mandatory arbitration through family council before unilateral divorce notice to Union Council.",
    commonMistake: "Leaving blank without understanding implications.",
    badge: "Legal",
  },
  {
    id: 20,
    colNumber: "Column 20",
    urduTitle: "نان و نفقہ اور مہر سے متعلق دستاویزات",
    englishTitle: "Documents Relating to Dower & Maintenance",
    explanation:
      "References any separate notarized deed, affidavit, or bank guarantee executed by the parties regarding maintenance or property transfer.",
    recommendedText:
      "Note deed registration number if a separate pre-marriage agreement or property registry exists.",
    commonMistake: "Not attaching referenced notarized deeds.",
    badge: "Legal",
  },
  {
    id: 21,
    colNumber: "Column 21",
    urduTitle: "کیا شوہر کی پہلے سے کوئی بیوی موجود ہے؟",
    englishTitle: "Is the Groom Already Married?",
    explanation:
      "Mandates declaration if the groom has existing living wives. Under Section 6 of MFLO 1961, contracting polygamous marriage without prior written permission from the Arbitration Council is a criminal offence.",
    recommendedText: "Must be answered truthfully: 'Yes' or 'No'.",
    commonMistake: "Concealing a prior active marriage.",
    badge: "Important",
  },
  {
    id: 22,
    colNumber: "Column 22",
    urduTitle: "ثالثی کونسل کا اجازت نامہ",
    englishTitle: "Arbitration Council Permission Certificate",
    explanation:
      "If the groom is already married, the official permission certificate number and date issued by the relevant Union Council Chairman must be recorded here.",
    recommendedText: "Official Permission Certificate No. and Date.",
    commonMistake: "Proceeding with second marriage without council approval.",
    badge: "Important",
  },
];

const CHECKLIST_ITEMS = [
  {
    id: "groom-cnic",
    category: "Identity Documents",
    title: "Groom's Original Valid CNIC + 3 Color Copies",
    desc: "Must not be expired. For overseas groom, valid NICOP / Foreign Passport with valid Pakistani visa.",
  },
  {
    id: "bride-cnic",
    category: "Identity Documents",
    title: "Bride's Original Valid CNIC + 3 Color Copies",
    desc: "Must not be expired. Date of birth will be verified against statutory minimum age (18 in Sindh/Punjab).",
  },
  {
    id: "witnesses",
    category: "Witnesses & Wali",
    title: "2 Adult Muslim Male Witnesses with Original CNICs + Copies",
    desc: "Witnesses must be adult, mentally sound, and physically present during recitation and signing.",
  },
  {
    id: "wali-cnic",
    category: "Witnesses & Wali",
    title: "Bride's Wali / Vakil CNIC + Copies",
    desc: "Father, brother, or designated authorized attorney acting as Vakil for the bride.",
  },
  {
    id: "qazi-license",
    category: "Nikkah Registrar",
    title: "Verified Registered Nikkah Khawan with Government License Stamp",
    desc: "Ensure the Qazi carries the official Union Council 4-copy register book with government seal.",
  },
  {
    id: "photos",
    category: "Identity Documents",
    title: "Passport Size Photographs (4 each of Groom & Bride)",
    desc: "White or blue background for official Union Council register records.",
  },
  {
    id: "overseas-docs",
    category: "Overseas Pakistani Specific",
    title: "NICOP / Single Status Affidavit / FRC (Family Registration Certificate)",
    desc: "Required for overseas applicants when registering for NADRA Computerized Marriage Certificate (MRC).",
  },
];

export function NikkahClausesClient() {
  const [expandedClause, setExpandedClause] = useState<number | null>(18);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [weddingDate, setWeddingDate] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getWhatsAppMessage = () => {
    const dateText = weddingDate ? ` on ${weddingDate}` : "";
    const msg = `Assalam-o-Alaikum! Important reminder for our upcoming Nikkah ceremony${dateText}: Please remember to bring your original valid CNIC / Smart Card and 2 photocopies for signing as an official witness in the Nikkah register. Complete checklist & clause guide: https://www.weddingwala.pk/planning-tools/nikkah-nama-clauses-nadra-checklist-pakistan`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Breadcrumbs & Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/" className="hover:text-emerald-700">
              Home
            </Link>
            <span>/</span>
            <Link href="/planning-tools" className="hover:text-emerald-700">
              Planning Tools
            </Link>
            <span>/</span>
            <span className="text-slate-800">Nikkah Nama Clauses & NADRA Checklist</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Pakistan Muslim Family Laws Ordinance 1961 & NADRA MRC Guide
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Pakistani Nikkah Nama Clauses (Col 13–22) & NADRA Checklist
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
            Every year, thousands of Pakistani brides and grooms sign their Nikkah Nama without reading
            columns 13 to 22. Learn what each column means (especially Column 18: Tafweez-e-Talaq &
            Column 17: Monthly Allowance), and track your mandatory documents for NADRA registration.
          </p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-slate-800">
              Checklist Progress: {completedCount} of {CHECKLIST_ITEMS.length} completed ({progressPercent}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="text-xs flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedLink ? "Link Copied!" : "Share Guide"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Clause Explorer Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                Interactive Nikkah Nama Clause Explorer (Columns 13–22)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Click any column below to view legal implications, recommended wording, and common pitfalls.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {CLAUSES_DATA.map((c) => {
              const isOpen = expandedClause === c.id;
              const badgeColors = {
                Critical: "bg-rose-100 text-rose-800 border-rose-200",
                Financial: "bg-amber-100 text-amber-800 border-amber-200",
                Legal: "bg-amber-100 text-amber-800 border-amber-200",
                Important: "bg-emerald-100 text-emerald-800 border-emerald-200",
              }[c.badge];

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-xl border transition-all ${
                    isOpen ? "border-emerald-600 shadow-md" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => setExpandedClause(isOpen ? null : c.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-emerald-700 text-sm">{c.colNumber}:</span>
                        <span className="font-semibold text-slate-900 text-base">{c.englishTitle}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${badgeColors}`}
                        >
                          {c.badge}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 font-urdu">{c.urduTitle}</p>
                    </div>
                    <div className="text-slate-400 mt-1 sm:mt-0">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 space-y-4 pt-1 border-t border-slate-100">
                      <div className="text-sm text-slate-700 leading-relaxed">
                        <strong className="text-slate-900">Legal Explanation: </strong>
                        {c.explanation}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 space-y-1">
                          <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Recommended Wording
                          </div>
                          <p className="italic">{c.recommendedText}</p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-950 space-y-1">
                          <div className="font-bold text-rose-800 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            Common Trap / Mistake
                          </div>
                          <p>{c.commonMistake}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Checklist & WhatsApp Reminder Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                Nikkah Day Document Checklist & NADRA Prep
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Tick off every item as you assemble your bridal pouch or groom folder.
              </p>
            </div>
            <div className="w-full sm:w-48 bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-600 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {CHECKLIST_ITEMS.map((item) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <label
                  key={item.id}
                  className="py-3.5 flex items-start gap-3 cursor-pointer group hover:bg-slate-50/50 rounded-lg px-2 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCheck(item.id)}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div className="space-y-0.5">
                    <span
                      className={`text-sm font-semibold transition-colors ${
                        isChecked ? "line-through text-slate-400" : "text-slate-800"
                      }`}
                    >
                      {item.title}
                    </span>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* WhatsApp Reminder Tool */}
          <div className="bg-gradient-to-r from-emerald-50 to-amber-50 rounded-xl p-5 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
              <MessageCircle className="w-5 h-5 text-emerald-700" />
              1-Click WhatsApp Witness / Wali CNIC Reminder
            </div>
            <p className="text-xs sm:text-sm text-emerald-800">
              Never have your Nikkah delayed because a witness forgot their original CNIC. Enter your
              event date and send an automated WhatsApp reminder to your witnesses and Vakil.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <input
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-emerald-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
                placeholder="Select Date"
              />
              <a
                href={getWhatsAppMessage()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Send WhatsApp CNIC Reminder
              </a>
            </div>
          </div>
        </div>

        {/* Detailed Legal Advice & FAQ Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-emerald-600" />
            Frequently Asked Questions Regarding Pakistani Nikkah Nama
          </h2>

          <div className="space-y-4 text-sm text-slate-700">
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 text-base">
                1. Can the Nikkah Registrar legally refuse to let Column 18 be filled?
              </h3>
              <p className="leading-relaxed">
                No. The Federal Shariat Court and High Courts in Pakistan have explicitly affirmed that
                tampering with or unilaterally striking out Column 18 without express consent from the
                parties is unlawful. The groom can freely delegate this right, and it is a standard
                statutory safeguard under Section 8 of the Muslim Family Laws Ordinance 1961.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 text-base">
                2. How long after Nikkah do we get the computerized NADRA Marriage Certificate?
              </h3>
              <p className="leading-relaxed">
                The Nikkah Khawan is required by law to submit the registered copy to the local Union
                Council within 30 days. Once submitted, either spouse can visit the Union Council or
                NADRA Sahulat Markaz with CNIC copies to receive the official computerized NADRA Marriage
                Registration Certificate (MRC), typically processed in 2 to 5 working days.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 text-base">
                3. What happens if Haq Mehr is kept deferred (غیر معجل)?
              </h3>
              <p className="leading-relaxed">
                Deferred Mehr remains a legal liability of the husband until paid. In case of separation or
                demand, the husband must pay the full deferred value in current equivalent currency or gold
                rates as stipulated.
              </p>
            </div>
          </div>
        </div>

        {/* Related Planning Tools & Rate Hubs */}
        <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">
            Explore More Free Pakistani Wedding Planning Calculators
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <Link
              href="/planning-tools/haq-mehr-gold-calculator-pakistan"
              className="p-3 bg-white rounded-lg border border-slate-200 hover:border-emerald-500 font-semibold text-slate-800 hover:text-emerald-700 transition-colors"
            >
              Haq Mehr & Gold Rate Calculator (2026 Live Tola) →
            </Link>
            <Link
              href="/planning-tools/salami-bari-trousseau-tracker-pakistan"
              className="p-3 bg-white rounded-lg border border-slate-200 hover:border-emerald-500 font-semibold text-slate-800 hover:text-emerald-700 transition-colors"
            >
              Salami & Bari Trousseau Tracker →
            </Link>
            <Link
              href="/planning-tools/marquee-hidden-cost-calculator-pakistan"
              className="p-3 bg-white rounded-lg border border-slate-200 hover:border-emerald-500 font-semibold text-slate-800 hover:text-emerald-700 transition-colors"
            >
              Marquee Hidden Cost & AC/Generator Calculator →
            </Link>
            <Link
              href="/wedding-venue-cost-in-lahore"
              className="p-3 bg-white rounded-lg border border-slate-200 hover:border-emerald-500 font-semibold text-slate-800 hover:text-emerald-700 transition-colors"
            >
              Lahore Wedding Venue Per-Head Rates (2026) →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
