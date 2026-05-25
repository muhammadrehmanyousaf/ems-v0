"use client";

/**
 * Automation builder (§M10) — vendor-defined no-code rules on top of
 * the fixed built-in automations. MVP: "N days before/after any event,
 * remind me" → an in-app notification fired by the daily evaluator.
 *
 * Flag NEXT_PUBLIC_AUTOMATION_BUILDER. Mounted above the built-in
 * automation-status surface.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Wand2, Plus, Trash2, Loader2, BellRing } from "lucide-react";
import { toast } from "sonner";
import {
  AutomationRulesAPI, type AutomationRule, type TriggerType,
} from "@/lib/api/automationRules";

const TRIGGER_LABEL: Record<TriggerType, string> = {
  days_before_event: "days before each event",
  days_after_event: "days after each event",
};

function describe(r: AutomationRule): string {
  return `${r.offsetDays} ${TRIGGER_LABEL[r.triggerType]} → notify me`;
}

export default function AutomationBuilderCard() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  // new-rule form
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("days_before_event");
  const [offsetDays, setOffsetDays] = useState("3");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    AutomationRulesAPI.list()
      .then((r) => setRules(r.rules))
      .catch(() => toast.error("Could not load rules"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) { toast.error("Name your rule"); return; }
    setCreating(true);
    try {
      await AutomationRulesAPI.create({
        name: name.trim(),
        triggerType,
        offsetDays: Math.max(0, parseInt(offsetDays, 10) || 0),
        actionType: "notify_me",
        message: message.trim() || undefined,
      });
      toast.success("Rule created");
      setName(""); setMessage(""); setOffsetDays("3"); setTriggerType("days_before_event");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not create rule");
    } finally { setCreating(false); }
  };

  const toggle = async (r: AutomationRule) => {
    setBusyId(r.id);
    try { await AutomationRulesAPI.toggle(r.id, !r.enabled); load(); }
    catch { toast.error("Could not update"); }
    finally { setBusyId(null); }
  };

  const remove = async (r: AutomationRule) => {
    setBusyId(r.id);
    try { await AutomationRulesAPI.remove(r.id); toast.success("Rule deleted"); load(); }
    catch { toast.error("Could not delete"); }
    finally { setBusyId(null); }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="h-4 w-4 text-bridal-gold-dark" />
          Your automation rules
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Build your own reminders on top of the built-in ones below. e.g.
          &ldquo;3 days before each event, remind me&rdquo; — the system checks daily
          and pings you in-app. Never miss a setup again.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New rule */}
        <div className="rounded-md border p-3 space-y-3 bg-muted/20">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Rule name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pre-event setup check" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Days</Label>
                <Input type="number" min={0} max={365} value={offsetDays} onChange={(e) => setOffsetDays(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">When</Label>
                <Select value={triggerType} onValueChange={(v) => setTriggerType(v as TriggerType)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days_before_event">before event</SelectItem>
                    <SelectItem value="days_after_event">after event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reminder message (optional)</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What should the notification say?" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <BellRing className="h-3 w-3" /> Action: notify me in-app
            </p>
            <Button size="sm" onClick={create} disabled={creating}>
              {creating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
              Add rule
            </Button>
          </div>
        </div>

        {/* Existing rules */}
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : rules.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No custom rules yet.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="rounded-md border p-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{r.name}</span>
                    {!r.enabled && <Badge variant="outline" className="text-[10px] text-muted-foreground">Paused</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{describe(r)}</p>
                  {r.message && <p className="text-[11px] italic text-muted-foreground">&ldquo;{r.message}&rdquo;</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={r.enabled} disabled={busyId === r.id} onCheckedChange={() => toggle(r)} />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={busyId === r.id} onClick={() => remove(r)} aria-label="Delete rule">
                    {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
