import { formatPaise } from "../utils/money";

export interface WhatsAppEnquiryDetails {
  businessName: string;
  whatsappNumber: string;
  enquiryNumber: string;
  customerName: string;
  location: string; // e.g. "Chennai, Tamil Nadu"
  items: Array<{ name: string; quantity: number }>;
  totalEstimatePaise: number;
  summaryUrl?: string;
}

/**
 * Generates a clean, url-encoded wa.me link with fallback truncation
 * keeping total URL string comfortably under 1,500 characters.
 */
export function buildWhatsAppLink(details: WhatsAppEnquiryDetails): string {
  const cleanNumber = details.whatsappNumber.replace(/[^0-9]/g, "");

  const header = `*${details.businessName} — Enquiry Confirmation*\n\n` +
    `Hello, I would like to confirm my cracker enquiry.\n` +
    `*Enquiry No:* ${details.enquiryNumber}\n` +
    `*Name:* ${details.customerName}\n` +
    `*Location:* ${details.location}\n\n` +
    `*Items:*\n`;

  const footer = `\n*Estimated Total:* ${formatPaise(details.totalEstimatePaise)}\n` +
    (details.summaryUrl ? `*View Summary:* ${details.summaryUrl}\n` : "") +
    `\nPlease verify availability and confirm my order via call or WhatsApp. Thank you!`;

  // Start with all items and progressively truncate if encoded length > 1400
  let itemsText = "";
  let itemsCount = details.items.length;

  for (let limit = itemsCount; limit >= 0; limit--) {
    const included = details.items.slice(0, limit);
    const omitted = itemsCount - limit;

    itemsText = included
      .map((it, idx) => `${idx + 1}. ${it.name} x ${it.quantity}`)
      .join("\n");

    if (omitted > 0) {
      itemsText += `\n... + ${omitted} more items`;
    }

    const fullMessage = header + itemsText + footer;
    const testUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(fullMessage)}`;

    if (testUrl.length <= 1400 || limit === 0) {
      return testUrl;
    }
  }

  // Fallback minimal message
  const minimalMsg = header + `(Total items: ${itemsCount})\n` + footer;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(minimalMsg)}`;
}
