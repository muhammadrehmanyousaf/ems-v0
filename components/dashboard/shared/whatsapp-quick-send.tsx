"use client";

/**
 * Reusable WhatsApp quick-send — pick a Pakistani-flavored template, tweak it,
 * then open WhatsApp pre-filled (free wa.me, decision D3). No backend.
 * Drop it anywhere there's a customer phone (customer detail, booking, etc.).
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MessageCircle, ExternalLink } from "lucide-react";
import { WA_TEMPLATES, fillTemplate, waLink } from "@/lib/whatsapp";
import { useBusiness } from "@/context/BusinessContext";

export default function WhatsAppQuickSend({
  phone,
  customerName,
  vars,
  buttonClassName,
}: {
  phone?: string | null;
  customerName?: string | null;
  vars?: Record<string, string | undefined>;
  buttonClassName?: string;
}) {
  const { business } = useBusiness();
  const [open, setOpen] = useState(false);
  const [tplKey, setTplKey] = useState(WA_TEMPLATES[0].key);
  const [text, setText] = useState("");

  const baseVars: Record<string, string | undefined> = {
    name: customerName || "",
    vendor: (business as unknown as { name?: string })?.name || "your vendor",
    ...vars,
  };

  const applyTemplate = (key: string) => {
    setTplKey(key);
    const tpl = WA_TEMPLATES.find((t) => t.key === key);
    setText(fillTemplate(tpl?.body || "", baseVars));
  };

  const onOpen = () => {
    applyTemplate(WA_TEMPLATES[0].key);
    setOpen(true);
  };

  return (
    <>
      <Button variant="outline" size="sm" className={buttonClassName} onClick={onOpen}>
        <MessageCircle className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> WhatsApp
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Message {customerName || "customer"} on WhatsApp</DialogTitle>
            <DialogDescription>Pick a template, tweak it, then open WhatsApp pre-filled.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Template</Label>
              <Select value={tplKey} onValueChange={applyTemplate}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WA_TEMPLATES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Message</Label>
              <Textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message…"
              />
              <p className="text-[11px] text-muted-foreground">
                {"Tip: fill in any {{amount}} / {{date}} placeholders before sending."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button asChild>
              <a
                href={waLink(phone, text)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open WhatsApp
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
