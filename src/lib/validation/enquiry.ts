import { z } from "zod";

export const IndianMobileRegex = /^[6-9]\d{9}$/;
export const IndianPincodeRegex = /^[1-9]\d{5}$/;

export const EnquiryItemSchema = z.object({
  productId: z.string().uuid().optional(),
  comboId: z.string().uuid().optional(),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Minimum quantity is 1")
    .max(9999, "Maximum quantity is 9,999"),
}).refine(
  (data) => (data.productId && !data.comboId) || (!data.productId && data.comboId),
  { message: "Item must specify either a productId or a comboId, not both." }
);

export const CustomerFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  mobile: z
    .string()
    .trim()
    .regex(IndianMobileRegex, "Enter a valid 10-digit Indian mobile number (starting with 6-9)"),
  whatsapp: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || IndianMobileRegex.test(val), {
      message: "Enter a valid 10-digit WhatsApp number",
    }),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  state: z
    .string()
    .trim()
    .min(2, "Please select your state"),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(60, "City cannot exceed 60 characters"),
  pincode: z
    .string()
    .trim()
    .regex(IndianPincodeRegex, "Enter a valid 6-digit Indian PIN code (cannot start with 0)"),
  address: z
    .string()
    .trim()
    .min(5, "Delivery address / area must be at least 5 characters")
    .max(300, "Address cannot exceed 300 characters"),
  preferredContact: z.enum(["WHATSAPP", "CALL"], {
    errorMap: () => ({ message: "Please select your preferred contact method" }),
  }),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  consent18Plus: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must confirm you are 18 years of age or older to submit an enquiry",
    }),
  honeypot: z.string().max(0, "Bot detected").optional().or(z.literal("")),
});

export const SubmitEnquiryPayloadSchema = CustomerFormSchema.extend({
  items: z
    .array(EnquiryItemSchema)
    .min(1, "Enquiry must have at least 1 item")
    .max(200, "Enquiry cannot exceed 200 item lines"),
});

export type CustomerFormData = z.infer<typeof CustomerFormSchema>;
export type SubmitEnquiryPayload = z.infer<typeof SubmitEnquiryPayloadSchema>;
export type EnquiryItemInput = z.infer<typeof EnquiryItemSchema>;
