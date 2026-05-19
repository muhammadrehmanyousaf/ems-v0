'use client';

/**
 * Send-via-WhatsApp dialog for Function Sheets.
 *
 * Generates the PDF for the picked variant server-side, then attempts
 * to send it via the active WhatsApp adapter. Pakistani customers
 * expect everything via WhatsApp — quote / contract / invoice /
 * receipt are all delivered this way.
 *
 * Flow:
 *   - Variant defaults to the row's natural variant (based on state)
 *     but vendor can override from the unlocked-variants list
 *   - Destination defaults to customerPhone from the row; vendor can
 *     override to send to a different number
 *   - Body defaults to a templated message per variant ("Assalam-o-
 *     Alaikum X, please find the attached…"); vendor can fully
 *     customize before sending
 *   - On submit: POSTs to /send-whatsapp; server renders PDF +
 *     attempts send; FE surfaces result (success / no-provider /
 *     other failure)
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Send, MessageSquare, FileText, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  FunctionSheetAPI,
  PDF_VARIANT_LABELS,
  variantsAvailable,
  type FunctionSheet,
  type PdfVariant,
} from '@/lib/api/functionSheets';

// Mirrors backend defaults so the vendor sees the pre-fill before sending.
function defaultBody(variant: PdfVariant, sheet: FunctionSheet): string {
  const name = sheet.customerName || 'there';
  const title = sheet.title || 'your event';
  const total = Number(sheet.grandTotal) || 0;
  const totalLine =
    total > 0 ? `Rs. ${Math.round(total).toLocaleString('en-PK')}` : null;
  const event = sheet.eventDate ? `\nEvent: ${sheet.eventDate}` : '';
  switch (variant) {
    case 'quote':
      return [
        `Assalam-o-Alaikum ${name},`,
        ``,
        `Please find attached our quote for ${title}.${event}`,
        totalLine ? `Total: ${totalLine}` : null,
        ``,
        `Let us know once you confirm and we'll send the contract.`,
        `Wedding Wala vendor`,
      ]
        .filter(Boolean)
        .join('\n');
    case 'contract':
      return [
        `Assalam-o-Alaikum ${name},`,
        ``,
        `Attached is the service contract for ${title}.${event}`,
        totalLine ? `Agreed total: ${totalLine}` : null,
        ``,
        `Kindly review and sign — we'll set everything in motion once confirmed.`,
        `Wedding Wala vendor`,
      ]
        .filter(Boolean)
        .join('\n');
    case 'beo':
      return [
        `Assalam-o-Alaikum ${name},`,
        ``,
        `Attached is the Banquet Event Order (BEO) for ${title}.${event}`,
        `This is the operational sheet our team will follow on the day.`,
        `Please confirm the details are correct.`,
        `Wedding Wala vendor`,
      ].join('\n');
    case 'invoice':
      return [
        `Assalam-o-Alaikum ${name},`,
        ``,
        `Attached is the tax invoice for ${title}.${event}`,
        totalLine ? `Total payable: ${totalLine}` : null,
        ``,
        `Bank/Easypaisa/JazzCash details on the invoice.`,
        `Wedding Wala vendor`,
      ]
        .filter(Boolean)
        .join('\n');
    case 'receipt':
      return [
        `Assalam-o-Alaikum ${name},`,
        ``,
        `Attached is your payment receipt for ${title}.${event}`,
        `Thank you for trusting us with your event — JazakAllah Khair.`,
        `Wedding Wala vendor`,
      ].join('\n');
  }
}

interface SendWhatsappDialogProps {
  sheet: FunctionSheet | null;
  initialVariant?: PdfVariant;
  onOpenChange: (v: boolean) => void;
  onSent?: () => Promise<void> | void;
}

export function SendWhatsappDialog({
  sheet,
  initialVariant,
  onOpenChange,
  onSent,
}: SendWhatsappDialogProps) {
  const variants = useMemo(
    () => (sheet ? variantsAvailable(sheet.state) : []),
    [sheet],
  );
  const [variant, setVariant] = useState<PdfVariant>('quote');
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [hasEditedBody, setHasEditedBody] = useState(false);

  useEffect(() => {
    if (!sheet) return;
    const v = initialVariant && variants.includes(initialVariant)
      ? initialVariant
      : variants[0] || 'quote';
    setVariant(v);
    setTo(sheet.customerPhone || '');
    setBody(defaultBody(v, sheet));
    setHasEditedBody(false);
  }, [sheet, initialVariant, variants]);

  // When vendor changes variant + hasn't customised the body, refresh
  // the templated body to match.
  useEffect(() => {
    if (!sheet || hasEditedBody) return;
    setBody(defaultBody(variant, sheet));
  }, [variant, sheet, hasEditedBody]);

  if (!sheet) return null;

  const noPhone = !to.trim();

  const submit = async () => {
    if (noPhone) {
      toast.error('Destination phone required');
      return;
    }
    if (!body.trim()) {
      toast.error('Message body required');
      return;
    }
    setSending(true);
    try {
      const res = await FunctionSheetAPI.sendWhatsapp(sheet.id, {
        variant,
        to: to.trim(),
        body: body.trim(),
      });
      if (res.result.ok) {
        toast.success(
          `Sent ${PDF_VARIANT_LABELS[variant]} (${(res.bytes / 1024).toFixed(0)} KB) to ${res.to}`,
        );
      } else if (res.result.reason === 'no_provider') {
        toast.warning(
          'WhatsApp provider not configured yet. The PDF was rendered server-side but no message was sent.',
        );
      } else {
        toast.error(
          `Delivery failed: ${res.result.reason || 'unknown'}`,
        );
      }
      if (onSent) await onSent();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not send');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={!!sheet} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Send via WhatsApp</DialogTitle>
          <DialogDescription>
            Renders the PDF for the selected variant and dispatches it
            to the customer's WhatsApp. Body is editable before send.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">
                Variant
              </label>
              <Select
                value={variant}
                onValueChange={(v) => setVariant(v as PdfVariant)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {variants.length === 0 ? (
                    <SelectItem value="quote" disabled>
                      No variants unlocked yet
                    </SelectItem>
                  ) : (
                    variants.map((v) => (
                      <SelectItem key={v} value={v}>
                        {PDF_VARIANT_LABELS[v]}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Destination phone
              </label>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="+92 300 1234567"
              />
              {noPhone && (
                <p className="mt-1 text-xs text-rose-700">
                  <AlertTriangle className="mr-1 inline h-3 w-3" />
                  No customerPhone on this sheet — type one in.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">
              <MessageSquare className="mr-1 inline h-3 w-3" />
              Message body
            </label>
            <Textarea
              rows={8}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setHasEditedBody(true);
              }}
              placeholder="Hi, please find the attached…"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Templated body changes when you pick a different variant
              (unless you've already edited it).
            </p>
          </div>

          <div className="rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs text-blue-900">
            <FileText className="mr-1 inline h-3 w-3" />
            PDF attachment is rendered server-side at the moment of send,
            so totals + line items reflect the latest state of the row.
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={sending || noPhone}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
