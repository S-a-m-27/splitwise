import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required.")
    .max(80, "Name must be 80 characters or less."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updatePreferredCurrencySchema = z.object({
  currencyCode: z.enum([
    "PKR",
    "USD",
    "EUR",
    "GBP",
    "INR",
    "AED",
    "SAR",
    "CAD",
    "AUD",
    "JPY",
    "SGD",
    "MYR",
    "BDT",
    "TRY",
    "CNY",
  ]),
});

export type UpdatePreferredCurrencyInput = z.infer<typeof updatePreferredCurrencySchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters."),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
