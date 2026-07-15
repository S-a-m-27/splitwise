import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid selection");

export const expenseSplitTypeSchema = z.literal("equal");

export const createExpenseSchema = z.object({
  groupId: uuidSchema,
  title: z
    .string()
    .min(1, "Expense title is required")
    .max(120, "Title must be 120 characters or less")
    .transform((value) => value.trim()),
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .max(999_999_999.99, "Amount is too large"),
  paidById: uuidSchema,
  participantIds: z
    .array(uuidSchema)
    .min(1, "Select at least one participant"),
  splitType: expenseSplitTypeSchema,
  notes: z
    .string()
    .max(500, "Notes must be 500 characters or less")
    .optional()
    .default(""),
});

export const updateExpenseSchema = createExpenseSchema;

export const expenseIdSchema = z.string().uuid("Invalid expense");

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

/** Parses UI form values into a validated create/update payload (equal split only). */
export function parseExpenseFormValues(values: {
  groupId: string;
  title: string;
  amount: string;
  paidById: string;
  participantIds: string[];
  splitType: string;
  notes: string;
}) {
  const parsedAmount = Number.parseFloat(values.amount);

  return createExpenseSchema.safeParse({
    groupId: values.groupId,
    title: values.title,
    amount: parsedAmount,
    paidById: values.paidById,
    participantIds: values.participantIds,
    splitType: "equal" as const,
    notes: values.notes,
  });
}
