import { z } from "zod";

const groupTypeSchema = z.enum(["trip", "home", "couple", "friends", "other"]);

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(80, "Group name must be 80 characters or less")
    .transform((value) => value.trim()),
  type: groupTypeSchema,
  icon: z.string().min(1, "Group icon is required").max(8),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .default(""),
});

export const editGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(80, "Group name must be 80 characters or less")
    .transform((value) => value.trim()),
  icon: z.string().min(1, "Group icon is required").max(8),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .default(""),
});

export const inviteCodeSchema = z
  .string()
  .min(1, "Invite code is required")
  .max(64, "Invalid invite code")
  .transform((value) => value.trim());

export const addMemberByEmailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .transform((value) => value.trim().toLowerCase()),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type EditGroupInput = z.infer<typeof editGroupSchema>;
export const addMemberByNameSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(80, "Name must be 80 characters or less")
    .transform((value) => value.trim()),
});

export type AddMemberByNameInput = z.infer<typeof addMemberByNameSchema>;
