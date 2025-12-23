import { z } from "zod";

export const LeadInputSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" }),
  company: z
    .string()
    .trim()
    .min(2, { message: "Company name must be at least 2 characters" }),
  plan_interest: z.string().optional(),
  source: z.string().optional(),
});

export type LeadInput = z.infer<typeof LeadInputSchema>;
