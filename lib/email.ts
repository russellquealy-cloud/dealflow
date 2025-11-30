// lib/email.ts
// Re-export email functionality from app/lib/email.ts
// This allows @/lib/email imports to work correctly
export { sendViaSMTP, sendBasicTest, type SendParams } from "../app/lib/email";

