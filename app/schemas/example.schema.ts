import { z } from "zod";

/**
 * One schema drives both validation and TypeScript types.
 * Co-locate feature-specific schemas under app/routes/<feature>/schema.ts;
 * this file is a shared reference example only.
 */
export const exampleFormSchema = z.object({
  fullName: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email address"),
  amount: z.coerce.number().positive("Must be greater than 0"),
});

export type ExampleFormValues = z.infer<typeof exampleFormSchema>;
