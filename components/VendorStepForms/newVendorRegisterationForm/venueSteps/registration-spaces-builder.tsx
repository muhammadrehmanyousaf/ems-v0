"use client";

/**
 * Venue-OS venue-hierarchy — onboarding space-builder (doc Step 10). A flag-gated,
 * client-side tree builder shown inside the Business-Details step: the vendor maps
 * their Hall → Floor → Partition layout during signup. The tree is stashed in
 * localStorage and rides along in the create-business-with-vendor payload
 * (`spacesTree`); the backend creates the SubVenue rows after the business exists.
 * Self-gates on isVenueHierarchyOn() → renders NOTHING (and adds nothing to the
 * payload) until enabled, so signup is byte-identical by default.
 */
import * as React from "react";
import { isVenueHierarchyOn } from "@/lib/venue-hierarchy-flag";

export const REG_SPACES_KEY = "ww_reg_spaces_tree";
export interface RegSpaceNode {
  tmpId: number;
  parentTmpId: number | null;
  name: string;
  kind: string;
  comfortCapacity?: number;
  bookingMode: "SESSION" | "WHOLE_DAY";
}

export function RegistrationSpacesBuilder(): React.ReactElement | null {
  const enabled = isVenueHierarchyOn();
  const [nodes, setNodes] = React.useState<RegSpaceNode[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = JSON.parse(localStorage.getItem(REG_SPACES_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  });
  const [parentTmpId, setParentTmpId] = React.useState<number | null>(null);
  const [name, setName] = React.useState("");
  const [cap, setCap] = React.useState("");
  const [wholeDay, setWholeDay] = React.useState(false);
  const counter = React.useRef<number>(nodes.reduce((m, n) => Math.max(m, n.tmpId), 0));

  React.useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(REG_SPACES_KEY, JSON.stringify(nodes));
  }, [nodes]);

  if (!enabled) return null;

  const parentOf = (id: number | null): RegSpaceNode | undefined => nodes.find((n) => n.tmpId === id);
  const kindFor = (pid: number | null): string => (pid == null ? "HALL" : parentOf(pid)?.kind === "HALL" ? "FLOOR" : "SECTION");
  const depthOf = (n: RegSpaceNode): number => {
    let d = 0;
    let p = n.parentTmpId;
    while (p != null) {
      d += 1;
      p = parentOf(p)?.parentTmpId ?? null;
    }
    return d;
  };
  function descendants(id: number): number[] {
    const out: number[] = [];
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop() as number;
      nodes.filter((n) => n.parentTmpId === cur).forEach((c) => {
        out.push(c.tmpId);
        stack.push(c.tmpId);
      });
    }
    return out;
  }
  // stable tree order: roots then their descendants, in insertion order
  const ordered: RegSpaceNode[] = [];
  const walk = (pid: number | null) => nodes.filter((n) => n.parentTmpId === pid).forEach((n) => { ordered.push(n); walk(n.tmpId); });
  walk(null);

  const add = () => {
    if (!name.trim()) return;
    const tmpId = counter.current + 1;
    counter.current = tmpId;
    setNodes((ns) => [...ns, { tmpId, parentTmpId, name: name.trim(), kind: kindFor(parentTmpId), comfortCapacity: cap ? Number(cap) : undefined, bookingMode: wholeDay ? "WHOLE_DAY" : "SESSION" }]);
    setName("");
    setCap("");
    setWholeDay(false);
  };
  const remove = (tmpId: number) => {
    const kill = new Set([tmpId, ...descendants(tmpId)]);
    setNodes((ns) => ns.filter((n) => !kill.has(n.tmpId)));
    if (parentTmpId != null && kill.has(parentTmpId)) setParentTmpId(null);
  };

  return (
    <div className="mt-6 rounded-xl border border-dashed border-roze-default/40 p-4">
      <p className="text-sm font-semibold text-roze-default">Your spaces (optional)</p>
      <p className="mb-3 text-xs text-gray-500">Map your halls, floors and partitions so guests can book a specific space. Skip if you rent your venue as one unit.</p>

      {ordered.length > 0 && (
        <div className="mb-3 space-y-1">
          {ordered.map((n) => (
            <div key={n.tmpId} className="flex items-center gap-2 text-sm" style={{ paddingLeft: `${depthOf(n) * 16}px` }}>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">{n.kind}</span>
              <span className="font-medium">{n.name}</span>
              {n.comfortCapacity ? <span className="text-xs text-gray-400">· {n.comfortCapacity} guests</span> : null}
              {n.bookingMode === "WHOLE_DAY" ? <span className="text-xs text-gray-400">· whole-day</span> : null}
              <button type="button" onClick={() => setParentTmpId(n.tmpId)} className="ml-auto text-xs text-roze-default hover:underline">+ inside</button>
              <button type="button" onClick={() => remove(n.tmpId)} className="text-xs text-red-500 hover:underline">remove</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">{parentTmpId == null ? "Add a hall / space" : `Add inside “${parentOf(parentTmpId)?.name}”`}</span>
        {parentTmpId != null && <button type="button" onClick={() => setParentTmpId(null)} className="text-xs text-gray-500 underline">↑ top level</button>}
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="name (e.g. Ground Floor)" className="w-40 rounded border px-2 py-1 text-sm" />
        <input type="number" value={cap} onChange={(e) => setCap(e.target.value)} placeholder="guests" className="w-20 rounded border px-2 py-1 text-sm" />
        <label className="flex items-center gap-1 text-xs text-gray-500"><input type="checkbox" checked={wholeDay} onChange={(e) => setWholeDay(e.target.checked)} /> whole-day only</label>
        <button type="button" onClick={add} disabled={!name.trim()} className="rounded bg-roze-default px-3 py-1 text-sm text-white disabled:opacity-50">Add</button>
      </div>
    </div>
  );
}

export default RegistrationSpacesBuilder;
