"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Receipt,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useAddGuestByName, useGroup, useGroups } from "@/features/groups/hooks/use-groups";
import { AddMemberByNameForm } from "@/features/groups/components/add-member-by-name-form";
import { getGroupsErrorMessage } from "@/features/groups/services/groups.errors";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/features/expenses/components/amount-input";
import { ExpenseFormSection } from "@/features/expenses/components/expense-form-section";
import { ExpenseOptionPicker } from "@/features/expenses/components/expense-option-picker";
import { GroupPicker } from "@/features/expenses/components/group-picker";
import { ParticipantSelector } from "@/features/expenses/components/participant-selector";
import { SplitLivePreview } from "@/features/expenses/components/split-live-preview";
import type {
  ExpenseFormValues,
  ExpenseParticipant,
  SplitType,
} from "@/features/expenses/types";
import type { PickerOption } from "@/features/expenses/types/picker";
import { defaultSplitValues } from "@/features/expenses/utils/split-preview";
import { cn } from "@/lib/utils";

interface ExpenseFormProps {
  initialValues?: Partial<ExpenseFormValues>;
  onSubmit: (values: ExpenseFormValues) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
  showHero?: boolean;
  presetGroupId?: string;
}

function mapMembersToParticipants(
  members: {
    id: string;
    name: string;
    initials: string;
    avatarUrl?: string;
    isCurrentUser?: boolean;
    isGuest?: boolean;
  }[],
): ExpenseParticipant[] {
  return members.map((member) => ({
    id: member.id,
    name: member.name,
    initials: member.initials,
    avatarUrl: member.avatarUrl,
    isCurrentUser: member.isCurrentUser,
    isGuest: member.isGuest,
  }));
}

function buildEmptyValues(userId?: string): ExpenseFormValues {
  return {
    title: "",
    amount: "",
    paidById: userId ?? "",
    participantIds: [],
    splitType: "equal",
    splitValues: {},
    notes: "",
    groupId: "",
  };
}

export function ExpenseForm({
  initialValues,
  onSubmit,
  submitLabel = "Save expense",
  isSubmitting = false,
  className,
  showHero = true,
  presetGroupId,
}: ExpenseFormProps) {
  const { user } = useAuth();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const isEditing = !!initialValues?.groupId;

  const [values, setValues] = useState<ExpenseFormValues>(() => ({
    ...buildEmptyValues(user?.id),
    ...initialValues,
    splitValues: initialValues?.splitValues ?? {},
  }));
  const [titleError, setTitleError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const resolvedGroupId =
    values.groupId ||
    presetGroupId ||
    initialValues?.groupId ||
    (!groupsLoading ? groups[0]?.id : "") ||
    "";

  const { data: group, isLoading: groupLoading, refetch: refetchGroup } =
    useGroup(resolvedGroupId);
  const addGuest = useAddGuestByName(resolvedGroupId);

  const groupOptions = useMemo(
    () => groups.map((g) => ({ id: g.id, name: g.name, icon: g.icon })),
    [groups],
  );

  const participants = useMemo(
    () => (group ? mapMembersToParticipants(group.members) : []),
    [group],
  );

  const memberIds = useMemo(() => participants.map((p) => p.id), [participants]);

  /** New expenses default to everyone in the group; edits keep saved participants. */
  const resolvedParticipantIds = useMemo(() => {
    if (isEditing) return values.participantIds;
    if (values.participantIds.length > 0) return values.participantIds;
    return memberIds;
  }, [isEditing, values.participantIds, memberIds]);

  const resolvedPaidById =
    values.paidById && memberIds.includes(values.paidById)
      ? values.paidById
      : memberIds.includes(user?.id ?? "")
        ? user!.id
        : memberIds[0] ?? values.paidById;

  const resolvedSplitValues = useMemo(() => {
    if (Object.keys(values.splitValues).length > 0) {
      return values.splitValues;
    }
    return defaultSplitValues(
      resolvedParticipantIds,
      values.splitType,
      Number.parseFloat(values.amount) || 0,
    );
  }, [values.splitValues, values.splitType, values.amount, resolvedParticipantIds]);

  const formSnapshot: ExpenseFormValues = {
    ...values,
    groupId: resolvedGroupId,
    participantIds: resolvedParticipantIds,
    paidById: resolvedPaidById,
    splitValues: resolvedSplitValues,
    splitType: "equal",
  };

  const paidByOptions: PickerOption[] = useMemo(
    () =>
      participants.map((participant) => ({
        id: participant.id,
        label: participant.name,
        initials: participant.initials,
        isCurrentUser: participant.isCurrentUser,
        description: participant.isCurrentUser ? "You paid for this" : "Tap to set as payer",
      })),
    [participants],
  );


  function handleGroupChange(groupId: string) {
    setValues((current) => ({
      ...current,
      groupId,
      participantIds: [],
      paidById: user?.id ?? "",
      splitValues: {},
    }));
  }

  function updateSplitValues(
    participantIds: string[],
    splitType: SplitType,
    amount: string,
    existing: Record<string, string>,
  ) {
    const parsedAmount = Number.parseFloat(amount);
    const defaults = defaultSplitValues(
      participantIds,
      splitType,
      Number.isNaN(parsedAmount) ? 0 : parsedAmount,
    );

    const next: Record<string, string> = {};
    for (const id of participantIds) {
      next[id] = existing[id] ?? defaults[id] ?? "";
    }
    return next;
  }

  function handleSplitTypeChange(splitType: SplitType) {
    setValues((current) => ({
      ...current,
      splitType,
      splitValues: defaultSplitValues(
        resolvedParticipantIds,
        splitType,
        Number.parseFloat(current.amount) || 0,
      ),
    }));
  }

  function handleAddGuest(name: string) {
    addGuest.mutate(name, {
      onSuccess: async (guestId) => {
        await refetchGroup();
        setValues((current) => ({
          ...current,
          participantIds: [...new Set([...resolvedParticipantIds, guestId])],
        }));
        toast.success(`"${name}" added and included in this expense`);
      },
      onError: (error) => toast.error(getGroupsErrorMessage(error)),
    });
  }

  function handleParticipantChange(participantIds: string[]) {
    setValues((current) => ({
      ...current,
      participantIds,
      splitValues: updateSplitValues(
        participantIds,
        current.splitType,
        current.amount,
        current.splitValues,
      ),
    }));
  }

  function handleAmountChange(amount: string) {
    setValues((current) => {
      const next = { ...current, amount };
      if (current.splitType === "equal") {
        next.splitValues = defaultSplitValues(
          resolvedParticipantIds,
          "equal",
          Number.parseFloat(amount) || 0,
        );
      }
      return next;
    });
    if (amountError) setAmountError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = values.title.trim();
    let hasError = false;

    if (!trimmedTitle) {
      setTitleError("Expense title is required.");
      hasError = true;
    } else {
      setTitleError(null);
    }

    const parsedAmount = Number.parseFloat(values.amount);
    if (!values.amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError("Enter a valid amount greater than zero.");
      hasError = true;
    } else {
      setAmountError(null);
    }

    if (!resolvedGroupId) {
      hasError = true;
    }

    if (resolvedParticipantIds.length === 0) {
      hasError = true;
    }

    if (hasError) return;

    onSubmit({
      ...formSnapshot,
      title: trimmedTitle,
      splitType: "equal",
    });
  }

  const membersLoading = !!resolvedGroupId && groupLoading;

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-5 min-[375px]:gap-6", className)}>
      {showHero && (
        <>
          <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/90 p-4 shadow-sm min-[375px]:rounded-3xl min-[375px]:p-5">
            <div className="aurora pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
            <div className="relative">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                Total amount
              </p>
              <AmountInput
                value={values.amount}
                onChange={handleAmountChange}
                variant="hero"
                aria-invalid={!!amountError}
              />
              {amountError && (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  {amountError}
                </p>
              )}
            </div>
          </section>

          <SplitLivePreview
            amount={values.amount}
            participants={participants}
            participantIds={resolvedParticipantIds}
            paidById={resolvedPaidById}
            splitType={values.splitType}
            splitValues={resolvedSplitValues}
            onSplitTypeChange={handleSplitTypeChange}
            onSplitValueChange={(participantId, value) =>
              setValues((current) => ({
                ...current,
                splitValues: { ...current.splitValues, [participantId]: value },
              }))
            }
          />
        </>
      )}

      <ExpenseFormSection
        title="Group & details"
        description="Where does this expense belong?"
        icon={<Receipt className="size-5" />}
      >
        <div className="flex flex-col gap-5">
          <GroupPicker
            groups={groupOptions}
            value={resolvedGroupId}
            onChange={handleGroupChange}
            isLoading={groupsLoading}
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="expense-title" className="text-sm font-medium text-foreground">
              Expense title
            </label>
            <Input
              id="expense-title"
              value={values.title}
              onChange={(event) => {
                setValues((current) => ({ ...current, title: event.target.value }));
                if (titleError) setTitleError(null);
              }}
              placeholder="e.g. Dinner at Monal"
              aria-invalid={!!titleError}
              className="h-11 border-primary/15 bg-background/50"
              autoComplete="off"
            />
            {titleError && (
              <p role="alert" className="text-sm text-destructive">
                {titleError}
              </p>
            )}
          </div>

          {!showHero && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="expense-amount-inline" className="text-sm font-medium text-foreground">
                  Amount
                </label>
                <AmountInput
                  id="expense-amount-inline"
                  value={values.amount}
                  onChange={handleAmountChange}
                  aria-invalid={!!amountError}
                />
                {amountError && (
                  <p role="alert" className="text-sm text-destructive">
                    {amountError}
                  </p>
                )}
              </div>
              <SplitLivePreview
                amount={values.amount}
                participants={participants}
                participantIds={resolvedParticipantIds}
                paidById={resolvedPaidById}
                splitType={values.splitType}
                splitValues={resolvedSplitValues}
                onSplitTypeChange={handleSplitTypeChange}
                onSplitValueChange={(participantId, value) =>
                  setValues((current) => ({
                    ...current,
                    splitValues: { ...current.splitValues, [participantId]: value },
                  }))
                }
              />
            </div>
          )}
        </div>
      </ExpenseFormSection>

      <ExpenseFormSection
        title="Who paid?"
        description="Select the person who covered the bill."
        icon={<Wallet className="size-5" />}
        variant="glow"
      >
        {membersLoading ? (
          <div className="h-12 animate-pulse rounded-xl bg-muted" />
        ) : paidByOptions.length > 0 ? (
          <ExpenseOptionPicker
            id="expense-paid-by"
            label="Paid by"
            hideLabel
            value={resolvedPaidById}
            options={paidByOptions}
            onChange={(paidById) => setValues((current) => ({ ...current, paidById }))}
            sheetTitle="Who paid?"
            sheetDescription="Choose who covered this expense upfront."
          />
        ) : (
          <p className="text-sm text-muted-foreground">Select a group with members first.</p>
        )}
      </ExpenseFormSection>

      <ExpenseFormSection
        title="Who's splitting?"
        description="Choose who shares this expense — saved as an equal split."
        icon={<Users className="size-5" />}
      >
        {membersLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : participants.length > 0 ? (
          <div className="flex flex-col gap-5">
            <ParticipantSelector
              participants={participants}
              selectedIds={resolvedParticipantIds}
              onChange={handleParticipantChange}
            />
            {resolvedGroupId && (
              <AddMemberByNameForm
                compact
                onSubmit={handleAddGuest}
                isSubmitting={addGuest.isPending}
              />
            )}
          </div>
        ) : resolvedGroupId ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Add someone by name to start splitting with them.
            </p>
            <AddMemberByNameForm
              compact
              onSubmit={handleAddGuest}
              isSubmitting={addGuest.isPending}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a group to load members.</p>
        )}
      </ExpenseFormSection>

      <ExpenseFormSection
        title="Notes"
        description="Optional — receipts, tips, or context."
        icon={<FileText className="size-5" />}
      >
        <textarea
          id="expense-notes"
          value={values.notes}
          onChange={(event) =>
            setValues((current) => ({ ...current, notes: event.target.value }))
          }
          placeholder="Add details about this expense…"
          rows={3}
          className={cn(
            "w-full resize-none rounded-xl border border-primary/15 bg-background/50 px-3 py-2.5 text-sm",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          )}
        />
      </ExpenseFormSection>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 -mx-1 bg-gradient-to-t from-background via-background/95 to-transparent px-1 pt-3 pb-1 xl:static xl:mx-0 xl:bg-none xl:p-0">
        <Button
          type="submit"
          disabled={isSubmitting || groups.length === 0}
          className="h-12 w-full rounded-xl bg-gradient-to-r from-primary via-primary to-violet-600 text-base font-bold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-[0.99]"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
