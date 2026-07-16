import { z } from "zod";

const participantIdSchema = z.string().uuid("Invalid participant");

export const createSettlementSchema = z
  .object({
    groupId: z.string().uuid("Invalid group"),
    fromUserId: participantIdSchema,
    toUserId: participantIdSchema,
    amount: z
      .number()
      .finite("Enter a valid amount")
      .positive("Amount must be greater than zero")
      .max(999_999_999.99, "Amount is too large"),
    notes: z
      .string()
      .max(500, "Notes must be 500 characters or less")
      .transform((value) => value.trim())
      .optional(),
    clientSettlementId: z.string().uuid("Invalid settlement retry key").optional(),
  })
  .refine((value) => value.fromUserId !== value.toUserId, {
    message: "Payer and recipient must be different people",
    path: ["toUserId"],
  });

export function parseSettlementFormValues(values: {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: string;
  notes: string;
  maximumAmount: number;
}) {
  const result = createSettlementSchema.safeParse({
    groupId: values.groupId,
    fromUserId: values.fromUserId,
    toUserId: values.toUserId,
    amount: Number.parseFloat(values.amount),
    notes: values.notes,
  });

  if (!result.success || result.data.amount <= values.maximumAmount + 0.001) {
    return result;
  }

  return {
    success: false as const,
    error: new z.ZodError([
      {
        code: "custom",
        message: "Amount cannot exceed the outstanding balance",
        path: ["amount"],
        input: result.data.amount,
      },
    ]),
  };
}

export type CreateSettlementPayload = z.infer<typeof createSettlementSchema>;
