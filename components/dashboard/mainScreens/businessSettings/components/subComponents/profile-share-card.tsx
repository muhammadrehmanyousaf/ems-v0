"use client";

/**
 * "Your booking link" / link-in-bio share card (M17).
 *
 * The single biggest adoption lever for capturing leads from a vendor's own
 * Instagram / WhatsApp / Facebook funnel: a clean public URL the vendor can
 * paste into their bio so DM enquiries land in our dashboard (not Linktree /
 * Google Forms / lost replies). Free QR via api.qrserver.com (no signup),
 * one-tap Copy + Open + WhatsApp share (reuses lib/whatsapp wa.me helper).
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Copy, MessageCircle, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import type { ApiBusiness } from "@/lib/api/dashboard";
import { waLink } from "@/lib/whatsapp";

// Mirror of VendorCard's vendorType → URL slug map.
const TYPE_TO_SLUG: Record<string, string> = {
  "Photographer": "photographers",
  "Decorator": "decor",
  "Henna artist": "henna-artists",
  "Makeup artist": "makeup-artists",
  "Wedding venue": "venues",
  "Car rental": "car-rental",
  "Catering": "catering",
  "Bridal wearing": "bridal-wearing",
  "Wedding Invitations and Stationery": "wedding-invitations",
  "Florist": "florists",
  "Wedding cakes": "wedding-cakes",
  "Choreographer": "wedding-choreographers",
  "Dhol player": "dhol-players",
  "Event host": "event-hosts",
  "Live streaming": "live-streaming",
  "Generator rental": "generator-rental",
  "Marquee rental": "marquee-rental",
  "Furniture rental": "furniture-rental",
  "Mithai and sweets": "mithai",
  "Live cooking stall": "live-cooking-stalls",
  "Sound system rental": "sound-system-rental",
  "Qawwali and Naat": "qawwali",
  "Nikahkhwan": "wedding-officiants",
};

export default function ProfileShareCard({ business }: { business: ApiBusiness }) {
  const { user } = useUser();
  const vendorType = (user as unknown as { vendorType?: string })?.vendorType;
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://weddingwala.pk");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const slug = (vendorType && TYPE_TO_SLUG[vendorType]) || "vendors";
  const url = `${origin}/${slug}/${business.id}`;
  const qrSrc =
    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(url)}`;
  const waText = `Book me on Wedding Wala — ${business.name || "my services"}: ${url}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4 text-emerald-600" /> Your booking link
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Paste in your Instagram / Facebook bio, share on WhatsApp status, send to clients —
          enquiries land straight in your dashboard.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1.5">
              <span className="truncate text-xs">{url}</span>
              <Button size="sm" variant="ghost" className="ml-auto h-7 gap-1.5" onClick={onCopy}>
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={waLink(null, waText)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Share on WhatsApp
                </a>
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tip: use this link in your Instagram bio so DM enquiries become real leads here.
            </p>
          </div>
          <div className="self-center rounded-md border bg-white p-2 sm:self-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="QR for your booking link" width={140} height={140} className="block" />
            <p className="mt-1 text-center text-[10px] text-muted-foreground">Scan to open</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
