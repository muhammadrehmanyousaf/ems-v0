'use client';

/**
 * Phase 0 #6.7 — Team Members admin tab (VR-050.15).
 *
 * Pakistani wedding vendors operate as small studios: one lead
 * artist (the brand on the public profile) + 2-5 associates + a
 * casual labour pool. Today the backend tracks all of this but the
 * vendor has no way to enter it from the dashboard. This tab
 * closes that gap.
 *
 * Surfaces:
 *   - Lead artist + associate roster (card list)
 *   - Add / Edit / Delete / Sort actions
 *   - Lead-artist toggle (per business, one lead recommended)
 *   - Per-member specialties (multi-select free-text)
 *   - Years of experience + bio
 *
 * Drag-to-reorder is intentionally OUT of scope for this commit
 * (the backend supports `POST /reorder`; UI uses up/down arrows
 * for accessibility + simplicity). Drag-handle can be added later.
 *
 * Live-system safety: pure additive new tab; backend has been live
 * for months — only adding a UI surface that calls existing endpoints.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
// 03-DRAFT-RESILIENCE — persist in-progress "Add Member" form so a
// refresh mid-typing doesn't wipe the vendor's input.
import { useFormDraft } from '@/lib/draftStorage/useFormDraft';
import { DraftResumeBanner, relativeTimeAgo } from '@/components/shared/DraftResumeBanner';
import { AutoSaveIndicator } from '@/components/VendorStepForms/AutoSaveIndicator';
import {
  Loader2,
  Plus,
  Users,
  Star,
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

import {
  TeamMembersAPI,
  type BusinessTeamMember,
  type UpsertTeamMemberInput,
} from '@/lib/api/teamMembers';
import { useBusiness } from '@/context/BusinessContext';

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Member name is required (≥ 2 characters).' })
    .max(120),
  role: z
    .string()
    .min(2, { message: 'Role is required (e.g. Lead Photographer, MUA, Bearer).' })
    .max(80),
  bio: z.string().max(2000).optional(),
  profileImageUrl: z.string().url().or(z.literal('')).optional(),
  yearsExperience: z.string().optional(),
  specialtiesText: z.string().max(500).optional(),
  isLeadArtist: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const MAX_MEMBERS = 50;

const TeamMembersTab = () => {
  const { business } = useBusiness();
  const businessId = business?.id ? Number(business.id) : null;

  const [members, setMembers] = useState<BusinessTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessTeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BusinessTeamMember | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      role: '',
      bio: '',
      profileImageUrl: '',
      yearsExperience: '',
      specialtiesText: '',
      isLeadArtist: false,
    },
  });

  // 03-DRAFT-RESILIENCE — auto-save the in-progress NEW or EDITED member.
  //
  // Hook lives at the tab level (not inside the dialog) so save state
  // survives a dialog Cancel — the vendor's typing isn't lost just
  // because they accidentally hit Esc.
  //
  // CREATE mode: gated on "user typed something" via isMeaningful.
  // EDIT mode: gated via pristineState — opening a member for edit and
  // looking at them without changes does NOT write a draft, so the
  // "always save loop" that plagued the first cut is gone.
  const watched = useWatch({ control: form.control });
  const editPristine: FormValues | undefined = editing ? {
    name: editing.name || '',
    role: editing.role || '',
    bio: editing.bio || '',
    profileImageUrl: editing.profileImageUrl || '',
    yearsExperience: editing.yearsExperience != null ? String(editing.yearsExperience) : '',
    specialtiesText: (editing.specialties || []).join(', '),
    isLeadArtist: !!editing.isLeadArtist,
  } : undefined;
  const memberDraftStorageKey = editing
    ? `team-member-edit-${businessId ?? 'no-biz'}-${editing.id}`
    : `team-member-create-${businessId ?? 'no-biz'}`;
  const draftEnabled = dialogOpen && !!businessId;
  const memberDraft = useFormDraft<FormValues>({
    storageKey: memberDraftStorageKey,
    state: watched as FormValues,
    pristineState: editPristine,
    isMeaningful: !editing
      ? ((s) =>
          !!s.name?.trim() ||
          !!s.role?.trim() ||
          !!s.bio?.trim() ||
          !!s.yearsExperience?.trim() ||
          !!s.specialtiesText?.trim())
      : undefined,
    enabled: draftEnabled,
  });

  const load = React.useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const rows = await TeamMembersAPI.list(businessId);
      // Backend already orders by isLeadArtist DESC, sortOrder ASC,
      // id ASC; we trust that ordering.
      setMembers(rows || []);
    } catch (e) {
      toast.error('Could not load team members');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: '',
      role: '',
      bio: '',
      profileImageUrl: '',
      yearsExperience: '',
      specialtiesText: '',
      // First member auto-set as lead so the public profile has a
      // featured artist immediately.
      isLeadArtist: members.length === 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (row: BusinessTeamMember) => {
    setEditing(row);
    form.reset({
      name: row.name || '',
      role: row.role || '',
      bio: row.bio || '',
      profileImageUrl: row.profileImageUrl || '',
      yearsExperience:
        row.yearsExperience != null ? String(row.yearsExperience) : '',
      specialtiesText: (row.specialties || []).join(', '),
      isLeadArtist: !!row.isLeadArtist,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!businessId) return;
    if (!editing && members.length >= MAX_MEMBERS) {
      toast.error(`Cap reached: ${MAX_MEMBERS} team members per business.`);
      return;
    }
    setSaving(true);
    try {
      const specialties = (values.specialtiesText || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);
      const yrs = values.yearsExperience?.trim();
      const yrsNum = yrs && /^\d+$/.test(yrs) ? Math.min(80, Number(yrs)) : null;

      const payload: UpsertTeamMemberInput = {
        name: values.name.trim(),
        role: values.role.trim(),
        bio: values.bio?.trim() || null,
        profileImageUrl: values.profileImageUrl?.trim() || null,
        isLeadArtist: !!values.isLeadArtist,
        specialties: specialties.length > 0 ? specialties : null,
        yearsExperience: yrsNum,
      };

      if (editing) {
        await TeamMembersAPI.update(businessId, editing.id, payload);
        toast.success('Team member updated');
      } else {
        await TeamMembersAPI.create(businessId, payload);
        toast.success('Team member added');
      }
      // Drop the local draft (covers both create and edit) now that the
      // server has the authoritative copy.
      memberDraft.discard();
      setDialogOpen(false);
      await load();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save team member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!businessId || !confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await TeamMembersAPI.remove(businessId, confirmDelete.id);
      toast.success('Team member removed');
      setConfirmDelete(null);
      await load();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Up/down arrow reorder: swap sortOrder with the adjacent row
   * (within the same isLeadArtist group, since leads always come
   * first per the backend ordering). Calls the bulk reorder endpoint
   * with the full new ordering so the backend can recompute
   * sortOrder integers from-scratch without per-row PATCHes.
   */
  const moveBy = async (id: number, direction: -1 | 1) => {
    if (!businessId) return;
    const idx = members.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const target = idx + direction;
    if (target < 0 || target >= members.length) return;
    // Don't allow moving across the lead/non-lead boundary (that's
    // semantic, not just visual).
    if (members[idx].isLeadArtist !== members[target].isLeadArtist) return;

    const next = [...members];
    [next[idx], next[target]] = [next[target], next[idx]];
    setReorderingId(id);
    try {
      await TeamMembersAPI.reorder(
        businessId,
        next.map((m, i) => ({ id: m.id, sortOrder: i })),
      );
      setMembers(next);
    } catch (e) {
      toast.error('Could not reorder');
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      {/* Heading + add button */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Team & crew</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-prose">
            Add your team members so customers see who&apos;ll actually be at
            their event. Mark your lead artist with a star — they appear at the
            top of your public profile. Add associates (junior MUAs, second-
            shooters) and casual crew (bearers, drivers) so day-of allocation
            is easy.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreate}
          className="gap-1.5"
          disabled={!businessId || members.length >= MAX_MEMBERS}
        >
          <Plus className="h-3.5 w-3.5" />
          Add member
        </Button>
      </div>

      {!businessId ? (
        <Skeleton className="h-20 w-full" />
      ) : loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : members.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <Users className="h-8 w-8 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">No team members yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Add yourself first as the lead artist — customers want to know
                who they&apos;re hiring. You can add associates and crew later.
              </p>
            </div>
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add your first team member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {members.map((row, idx) => {
            const prev = members[idx - 1];
            const next = members[idx + 1];
            const canMoveUp = !!prev && prev.isLeadArtist === row.isLeadArtist;
            const canMoveDown = !!next && next.isLeadArtist === row.isLeadArtist;
            return (
              <Card key={row.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="shrink-0">
                        {row.profileImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.profileImageUrl}
                            alt={row.name}
                            className="w-12 h-12 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                            {row.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{row.name}</p>
                          {row.isLeadArtist && (
                            <Badge variant="default" className="gap-1 text-[10px]">
                              <Star className="h-3 w-3 fill-current" />
                              Lead artist
                            </Badge>
                          )}
                          {!row.isActive && (
                            <Badge variant="outline" className="text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {row.role}
                          {row.yearsExperience != null
                            ? ` · ${row.yearsExperience} yrs`
                            : ''}
                        </p>
                        {row.specialties && row.specialties.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {row.specialties.map((s) => (
                              <Badge
                                key={s}
                                variant="secondary"
                                className="text-[10px] gap-1"
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {row.bio && (
                          <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">
                            {row.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => moveBy(row.id, -1)}
                          disabled={!canMoveUp || reorderingId === row.id}
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => moveBy(row.id, 1)}
                          disabled={!canMoveDown || reorderingId === row.id}
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(row)}
                          aria-label="Edit team member"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmDelete(row)}
                          aria-label="Delete team member"
                          disabled={deletingId === row.id}
                        >
                          {deletingId === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit team member' : 'Add team member'}
            </DialogTitle>
            <DialogDescription>
              Customers love seeing the actual people they&apos;re booking.
              Photos + bios convert ~3× better than blank profiles.
            </DialogDescription>
          </DialogHeader>
          {/* 03-DRAFT-RESILIENCE — resume banner. Works for both CREATE
              and EDIT mode; edit-mode meaningfulness is gated by the
              hook's pristineState so we don't show a banner for "you
              opened this member but changed nothing". */}
          <DraftResumeBanner
            visible={memberDraft.hasResumableDraft}
            title={editing ? 'Resume your edits' : 'Resume your unfinished member'}
            meta={memberDraft.storedDraft ? `Last edited ${relativeTimeAgo(memberDraft.storedDraft.updatedAt)}` : undefined}
            onResume={() => {
              if (!memberDraft.storedDraft) return;
              form.reset(memberDraft.storedDraft.state);
              memberDraft.discard();
              toast.success(editing ? 'Restored your unsaved edits' : 'Restored your unsaved member');
            }}
            onDiscard={() => memberDraft.discard()}
          />
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 pt-2"
            >
              <div className="flex justify-end -mb-2">
                <AutoSaveIndicator lastSavedAt={memberDraft.lastSavedAt} saving={memberDraft.saving} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Aisha Khan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Lead Photographer, MUA, Bearer"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="profileImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      Upload to your portfolio first, then paste the link here.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="yearsExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of experience</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="e.g. 8"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialtiesText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialties</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Bridal, candid, drone"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Comma-separated. Surfaced as chips on profile.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short bio</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Tell customers about this team member's strengths and personality."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isLeadArtist"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0 pt-1">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(c) => field.onChange(!!c)}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-tight">
                      <FormLabel className="cursor-pointer">
                        Lead artist (featured on public profile)
                      </FormLabel>
                      <FormDescription className="text-[11px]">
                        Lead artists appear at the top of your team list and
                        on the public profile hero.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  {editing ? 'Save changes' : 'Add member'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.isLeadArtist
                ? 'This is your lead artist — your public profile will lose its featured team member until you mark another one as lead.'
                : 'You can always add them back later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamMembersTab;
