import { formatPaise } from "../utils/money";

export interface WhatsAppEnquiryDetails {
  businessName: string;
  whatsappNumber: string;
  enquiryNumber: string;
  customerName?: string;
  location: string; // e.g. "Chennai, Tamil Nadu"
  items: Array<{ name: string; quantity: number }>;
  totalEstimatePaise: number;
  summaryUrl?: string;
}

/**
 * Generates a clean, url-encoded wa.me link matching the canonical template:
 * 
 * Hello {{businessName}},
 * 
 * I would like to enquire about:
 * 
 * Enquiry ID: {{enquiryId}}
 * 
 * Products:
 * {{productList}}
 * 
 * Total:
 * ₹{{total}}
 * 
 * Location:
 * {{state}}, {{city}}
 * 
 * Please confirm availability and delivery details.
 */
export function buildWhatsAppLink(details: WhatsAppEnquiryDetails): string {
  const cleanNumber = details.whatsappNumber.replace(/[^0-9]/g, "");

  const greeting = `Hello ${details.businessName},\n\n` +
    `I would like to enquire about:\n\n` +
    `Enquiry ID: ${details.enquiryNumber}\n\n` +
    (details.customerName ? `Customer: ${details.customerName}\n\n` : "") +
    `Products:\n`;

  const footer = `\nTotal:\n${formatPaise(details.totalEstimatePaise)}\n\n` +
    `Location:\n${details.location}\n\n` +
    `Please confirm availability and delivery details.` +
    (details.summaryUrl ? `\n\nView Summary: ${details.summaryUrl}` : "");

  let itemsText = "";
  const itemsCount = details.items.length;

  for (let limit = itemsCount; limit >= 0; limit--) {
    const included = details.items.slice(0, limit);
    const omitted = itemsCount - limit;

    itemsText = included
      .map((it, idx) => `${idx + 1}. ${it.name} x ${it.quantity}`)
      .join("\n");

    if (omitted > 0) {
      itemsText += `\n... + ${omitted} more items`;
    }

    const fullMessage = greeting + itemsText + footer;
    const testUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(fullMessage)}`;

    if (testUrl.length <= 1400 || limit === 0) {
      return testUrl;
    }
  }

  // Fallback minimal message for huge lists
  const minimalMsg = greeting + `(${itemsCount} items selected)` + footer;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(minimalMsg)}`;
}
