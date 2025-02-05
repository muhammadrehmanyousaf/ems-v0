import { z } from "zod";

export const formSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    phoneNumber: z
    .coerce
    .number({ message: "Phone number must be numeric" })
    .refine((value) => value.toString().length === 10, {
      message: "Phone number must be exactly 10 digits",
    })
    .refine((value) => value.toString().startsWith("3"), {
      message: "Phone number must start with 3",
    }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type FormData = z.infer<typeof formSchema>