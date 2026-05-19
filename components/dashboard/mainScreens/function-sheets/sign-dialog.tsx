'use client';

/**
 * SignDialog — captures a signature for one side (vendor OR customer)
 * of a Function Sheet, then PATCHes signaturesJson on the row.
 *
 * Three capture modes:
 *   1. Draw  — finger / stylus / mouse signature on canvas
 *   2. Type  — typed name rendered in cursive into the same canvas
 *   3. Scan  — vendor uploaded a paper-signature scan elsewhere and
 *              pastes the URL here (no upload happens in this dialog —
 *              uses existing vendor-doc upload flow off-screen)
 *
 * All three modes serialise to the SAME payload shape:
 *
 *   signaturesJson[side] = {
 *     name: string,
 *     signedAt: ISO timestamp,
 *     mode: 'drawn' | 'typed' | 'scanned',
 *     dataUrl?: string (Draw/Type modes — base64 PNG),
 *     scanUrl?: string (Scan mode),
 *   }
 *
 * Backend functionSheetStateTransition requires both signatures'
 * `signedAt` for the 'signed' state transition; everything else here
 * is metadata.
 */

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, PenLine, Type, ScanLine } from 'lucide-react';

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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { FunctionSheetAPI, type FunctionSheet } from '@/lib/api/functionSheets';
import { SignaturePad, type SignaturePadHandle } from './signature-pad';

export type SignSide = 'vendor' | 'customer';

interface SignDialogProps {
  /** When null the dialog is closed. */
  sheet: FunctionSheet | null;
  side: SignSide;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}

type Mode = 'draw' | 'type' | 'scan';

export function SignDialog({
  sheet,
  side,
  onOpenChange,
  onSaved,
}: SignDialogProps) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode>('draw');
  const [scanUrl, setScanUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const padRef = useRef<SignaturePadHandle>(null);

  // Pre-fill name from existing data (when re-signing).
  useEffect(() => {
    if (!sheet) return;
    const existing = sheet.signaturesJson?.[side];
    if (existing?.name) {
      setName(existing.name);
    } else if (side === 'customer' && sheet.customerName) {
      setName(sheet.customerName);
    } else {
      setName('');
    }
    setMode('draw');
    setScanUrl(existing?.scanUrl || '');
  }, [sheet, side]);

  // Auto-render typed signature when name changes in 'type' mode.
  useEffect(() => {
    if (mode === 'type' && padRef.current) {
      padRef.current.renderTypedSignature(name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, mode]);

  if (!sheet) return null;

  const sideLabel = side === 'vendor' ? 'vendor' : 'customer';
  const existing = sheet.signaturesJson?.[side];

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Signer name required');
      return;
    }
    let dataUrl: string | null = null;
    if (mode === 'draw' || mode === 'type') {
      dataUrl = padRef.current?.getDataUrl() || null;
      if (!dataUrl) {
        toast.error(
          mode === 'draw'
            ? 'Draw a signature first'
            : 'Type a name to render the signature',
        );
        return;
      }
    } else if (mode === 'scan') {
      if (!scanUrl.trim()) {
        toast.error('Scan URL required');
        return;
      }
    }

    setSubmitting(true);
    try {
      const merged = {
        ...(sheet.signaturesJson || {}),
        [side]: {
          name: name.trim(),
          signedAt: new Date().toISOString(),
          mode: mode === 'draw' ? 'drawn' : mode === 'type' ? 'typed' : 'scanned',
          dataUrl: dataUrl || undefined,
          scanUrl: mode === 'scan' ? scanUrl.trim() : undefined,
        },
      };
      await FunctionSheetAPI.update(sheet.id, { signaturesJson: merged });
      toast.success(`${sideLabel === 'vendor' ? 'Vendor' : 'Customer'} signature saved`);
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save signature');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!sheet} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Capture {sideLabel} signature — {sheet.title || `Function sheet #${sheet.id}`}
          </DialogTitle>
          <DialogDescription>
            {side === 'vendor'
              ? 'Sign on behalf of your business. Either draw your signature, type your name in cursive, or paste a URL to a scanned signature you uploaded elsewhere.'
              : "Have the customer sign here on your tablet, OR type their name if you're capturing consent over phone/WhatsApp."}
            {existing?.signedAt && (
              <span className="mt-2 block text-xs text-amber-700">
                A {sideLabel} signature is already on file from{' '}
                {new Date(existing.signedAt).toLocaleString('en-PK')}. Saving
                will replace it.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">
              Signer name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                side === 'vendor' ? 'Your full name' : "Customer's full name"
              }
            />
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList>
              <TabsTrigger value="draw">
                <PenLine className="mr-1 h-3 w-3" />
                Draw
              </TabsTrigger>
              <TabsTrigger value="type">
                <Type className="mr-1 h-3 w-3" />
                Type
              </TabsTrigger>
              <TabsTrigger value="scan">
                <ScanLine className="mr-1 h-3 w-3" />
                Scan URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="draw" className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Sign using mouse, stylus, or finger. The line thickness
                responds to your pen speed.
              </div>
              <SignaturePad ref={padRef} width={480} height={180} />
            </TabsContent>

            <TabsContent value="type" className="space-y-1">
              <div className="text-xs text-muted-foreground">
                The signer name above is rendered in cursive. Good when
                capturing remote consent over WhatsApp or a phone call —
                customer confirms verbally and you type their name.
              </div>
              <SignaturePad ref={padRef} width={480} height={180} />
            </TabsContent>

            <TabsContent value="scan" className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Upload a photo/PDF of the paper-signed page elsewhere
                (e.g. your existing vendor-document upload), then paste
                the URL here.
              </div>
              <Input
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                placeholder="https://… (URL of the scanned signed page)"
              />
              {scanUrl && (
                <a
                  href={scanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-700 underline"
                >
                  Preview scan
                </a>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
