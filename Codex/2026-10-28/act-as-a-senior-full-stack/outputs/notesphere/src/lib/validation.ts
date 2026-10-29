import { z } from "zod";
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(10).max(128),
});
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  college: z.string().trim().max(150),
  course: z.string().max(100),
  branch: z.string().max(100),
  semester: z.coerce.number().int().min(1).max(12),
  interests: z.string().max(500),
  avatar: z
    .string()
    .max(300000)
    .refine(
      (s) =>
        s === "" ||
        /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s),
      "Use a PNG, JPEG or WebP image smaller than 200 KB.",
    ),
});
export const noteSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(20).max(5000),
  subject_id: z.string().min(1),
  course_id: z.string().min(1),
  branch: z.string().max(100),
  college: z.string().max(150),
  semester: z.coerce.number().int().min(1).max(12),
  topic: z.string().max(150),
  academic_year: z.string().regex(/^\d{4}-\d{4}$/),
  language: z.string().min(2).max(50),
  visibility: z.enum(["public", "private"]),
  status: z.enum(["pending", "draft"]),
  tags: z.string().max(250),
});
export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().trim().min(10).max(2000),
});
