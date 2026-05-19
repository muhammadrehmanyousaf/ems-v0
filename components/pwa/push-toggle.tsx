'use client';

/**
 * Phase 2 #8.9 — Web Push enable/disable toggle.
 *
 * Drop-in for the dashboard settings page. Renders nothing when the
 * runtime doesn't support push (older Safari, insecure context, etc.)
 * or when the backend hasn't been wired up with VAPID keys.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  getPushState,
  enablePush,
  disablePush,
  type PushState,
} from '@/lib/push';

export function PushToggle() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const s = await getPushState();
    setState(s);
  };

  useEffect(() => {
    refresh();
  }, []);

  if (!state) return null;
  if (!state.supported || !state.configured) {
    // Render only when we have something useful to expose.
    return null;
  }

  const onEnable = async () => {
    setBusy(true);
    const r = await enablePush();
    setBusy(false);
    if (r.ok) {
      toast.success('Push notifications enabled');
    } else {
      toast.error(
        r.reason === 'permission_denied'
          ? 'You blocked notifications — re-enable from your browser settings.'
          : r.reason === 'no_vapid_key'
            ? 'Push not configured by ops yet — try again later.'
            : `Could not enable push: ${r.reason}`,
      );
    }
    refresh();
  };

  const onDisable = async () => {
    setBusy(true);
    await disablePush();
    setBusy(false);
    toast('Push notifications disabled');
    refresh();
  };

  if (state.subscribed) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onDisable}
        disabled={busy}
        className="gap-1.5"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <BellOff className="h-3.5 w-3.5" />
        )}
        Disable push
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={onEnable}
      disabled={busy}
      className="gap-1.5"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Bell className="h-3.5 w-3.5" />
      )}
      Enable push notifications
    </Button>
  );
}
