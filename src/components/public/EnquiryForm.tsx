"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  Phone,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatPaise } from "@/lib/utils/money";
import { Button } from "../ui/Button";
import { resolveDeliveryRuleForState } from "@/lib/rules/deliveryResolver";

interface StateOption {
  id: string;
  name: string;
  code: string;
}

interface DeliveryRuleData {
  id: string;
  name: string;
  minOrderPaise: number;
  freeDeliveryThresholdPaise: number | null;
  shippingWording: string;
  isDefault: boolean;
  states: Array<{ id: string; name: string }>;
}

export function EnquiryForm() {
  const router = useRouter();
  const {
    items,
    selectedState,
    setSelectedState,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotalPaise,
    getTotalItems,
  } = useCartStore();

  const [states, setStates] = useState<StateOption[]>([]);
  const [deliveryRules, setDeliveryRules] = useState<DeliveryRuleData[]>([]);

  // Form State
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [preferredContact, setPreferredContact] = useState<"WHATSAPP" | "CALL">("WHATSAPP");
  const [notes, setNotes] = useState("");
  const [consent18Plus, setConsent18Plus] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [priceChangeWarning, setPriceChangeWarning] = useState<any[] | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  // Initialize idempotency key once per form session
  useEffect(() => {
    setIdempotencyKey(`enq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  }, []);

  // Fetch states and delivery rules
  useEffect(() => {
    async function fetchStatesAndRules() {
      try {
        const res = await fetch("/api/states");
        const json = await res.json();
        if (json.ok) {
          setStates(json.data.states);
          setDeliveryRules(json.data.deliveryRules);
        }
      } catch (err) {
        console.error("Failed to load states:", err);
      }
    }
    fetchStatesAndRules();
  }, []);

  // Resolve current active delivery rule
  const resolvedRule = resolveDeliveryRuleForState(deliveryRules as any, selectedState);

  const subtotalPaise = getSubtotalPaise();
  const totalCount = getTotalItems();
  const minOrderPaise = resolvedRule.minOrderPaise;
  const isMinMet = subtotalPaise >= minOrderPaise;
  const shortfallPaise = Math.max(0, minOrderPaise - subtotalPaise);
  const progressPercent = Math.min(100, Math.round((subtotalPaise / (minOrderPaise || 1)) * 100));

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = "Please enter your full name (at least 2 characters).";
    }

    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      errors.mobile = "Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).";
    }

    const effectiveWhatsapp = sameAsMobile ? mobile.trim() : whatsapp.trim();
    if (effectiveWhatsapp && !/^[6-9]\d{9}$/.test(effectiveWhatsapp)) {
      errors.whatsapp = "Please enter a valid 10-digit WhatsApp number.";
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!selectedState) {
      errors.state = "Please select your delivery state.";
    }

    if (!city.trim() || city.trim().length < 2) {
      errors.city = "Please enter your city / town.";
    }

    if (!/^[1-9]\d{5}$/.test(pincode.trim())) {
      errors.pincode = "Please enter a valid 6-digit Indian PIN code.";
    }

    if (!address.trim() || address.trim().length < 5) {
      errors.address = "Please enter your delivery address / landmark.";
    }

    if (!consent18Plus) {
      errors.consent18Plus = "You must confirm you are 18 years or older.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPriceChangeWarning(null);

    if (items.length === 0) {
      setErrorMessage("Your enquiry list is empty. Please add items to proceed.");
      return;
    }

    if (!isMinMet) {
      setErrorMessage(`Minimum enquiry amount of ${formatPaise(minOrderPaise)} required for ${selectedState}.`);
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Prepare payload
    const effectiveWhatsapp = sameAsMobile ? mobile.trim() : whatsapp.trim();
    const payload = {
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      whatsapp: effectiveWhatsapp || undefined,
      email: email.trim() || undefined,
      state: selectedState,
      city: city.trim(),
      pincode: pincode.trim(),
      address: address.trim(),
      preferredContact,
      notes: notes.trim() || undefined,
      consent18Plus: true,
      honeypot: honeypot || undefined,
      items: items.map((i) => ({
        productId: i.isCombo ? undefined : i.id,
        comboId: i.isCombo ? i.id : undefined,
        quantity: i.quantity,
      })),
    };

    // Client provided prices map to detect price updates
    const clientProvidedPrices: Record<string, number> = {};
    items.forEach((i) => {
      clientProvidedPrices[i.id] = i.pricePaise;
    });

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          idempotencyKey,
          clientProvidedPrices,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        if (result.code === "PRICE_CHANGED") {
          setPriceChangeWarning(result.details || []);
          setErrorMessage("Some item prices were updated by the warehouse. Please review below and confirm.");
          // Generate new idempotency key for updated submission attempt
          setIdempotencyKey(`enq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
        } else if (result.code === "ITEM_UNAVAILABLE") {
          setErrorMessage(result.message || "One or more items in your cart are currently out of stock.");
        } else if (result.code === "BELOW_MINIMUM") {
          setErrorMessage(result.message || "Enquiry is below the minimum required amount.");
        } else if (result.code === "RATE_LIMITED") {
          setErrorMessage(result.message || "Too many submissions. Please wait a few moments.");
        } else {
          setErrorMessage(result.message || "Unable to submit enquiry. Please try again or contact us directly.");
        }
        setIsSubmitting(false);
        return;
      }

      // Success! Clear cart and redirect to success page
      clearCart();
      const enquiryNumber = result.data.enquiryNumber;
      const token = result.data.token;
      router.push(`/enquiry/success/${enquiryNumber}?token=${encodeURIComponent(token)}`);
    } catch (err) {
      console.error("Enquiry submission network failure:", err);
      setErrorMessage("Network error occurred. Your connection may be unstable. Please try again — duplicate submissions are prevented.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-2 flex items-center justify-center text-muted">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold font-heading mb-2">Your Enquiry List is Empty</h2>
        <p className="text-muted mb-8 max-w-md mx-auto">
          You haven&apos;t added any festival sparklers or fireworks to your enquiry list yet.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/price-list">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              Browse Price List
            </Button>
          </Link>
          <Link href="/combos">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              View Festive Combos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Banner / Notice */}
      <div className="mb-8 p-4 rounded-xl bg-surface-1 border border-border flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-accent-gold shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-text">Direct Factory Enquiry &amp; Estimate System</p>
          <p className="text-muted mt-0.5">
            This platform facilitates direct factory price estimates and enquiry processing.{" "}
            <strong>No online payment is collected.</strong> Our dispatch coordinator will verify stock and contact you to confirm transport options.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Items Review (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-1 border border-border rounded-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-xl font-bold font-heading">Review Items</h2>
                <p className="text-xs text-muted mt-0.5">{totalCount} items in your list</p>
              </div>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            </div>

            {/* Items List */}
            <div className="divide-y divide-border/50">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-surface-2 shrink-0 border border-border">
                    <Image
                      src={item.image || "/placeholders/sparkler.svg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-text truncate">{item.name}</h4>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-muted hover:text-red-400 p-1 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                      <span>{item.packSize}</span>
                      <span>•</span>
                      <span className="font-price font-bold text-accent-gold">
                        {formatPaise(item.pricePaise)}
                      </span>
                    </div>

                    {/* Stepper + Line Total */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border rounded-md bg-surface-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-surface-1 text-muted hover:text-text transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-surface-1 text-muted hover:text-text transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-price font-bold text-text">
                        {formatPaise(item.pricePaise * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick summary line */}
            <div className="pt-4 border-t border-border flex justify-between items-center text-sm font-semibold">
              <span className="text-muted">Estimated Subtotal:</span>
              <span className="text-lg font-price font-bold text-accent-gold">
                {formatPaise(subtotalPaise)}
              </span>
            </div>
          </div>

          {/* Price Change Alert if returned by server */}
          {priceChangeWarning && priceChangeWarning.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
              <div className="flex items-center gap-2 font-bold mb-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                Catalogue Prices Recently Updated
              </div>
              <p className="text-xs text-amber-200/80 mb-3">
                The warehouse revised rates for the following items. Please confirm to proceed with current rates:
              </p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                {priceChangeWarning.map((pc, idx) => (
                  <li key={idx}>
                    {pc.name}: was {formatPaise(pc.oldPaise)} → updated to {formatPaise(pc.newPaise)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safe Shopping Guarantee */}
          <div className="p-4 rounded-xl bg-surface-1 border border-border text-xs text-muted space-y-1.5">
            <p className="font-semibold text-text">Packaging &amp; Transport Policy</p>
            <p>
              All fireworks orders are packed in heavy-duty wooden/cardboard cartons with moisture barrier lining.
              Transport and handling are handled via licensed parcel cargo carriers directly from Sivakasi.
            </p>
          </div>
        </div>

        {/* Right Column: Customer Details & Submission Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSubmit} className="bg-surface-1 border border-border rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold font-heading">Customer &amp; Location</h2>
              <p className="text-xs text-muted mt-0.5">Please provide delivery details for rate estimation</p>
            </div>

            {/* Honeypot field (hidden from screen, detected if bots fill it) */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* State Selection */}
            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">
                Delivery State <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:border-accent-gold"
              >
                {states.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name}
                  </option>
                ))}
              </select>
              {formErrors.state && <p className="text-xs text-red-400 mt-1">{formErrors.state}</p>}
            </div>

            {/* Minimum Order Indicator */}
            <div className="p-3.5 rounded-lg bg-surface-2 border border-border/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-text">Minimum Requirement for {selectedState}:</span>
                <span className="font-price font-bold text-accent-gold">{formatPaise(minOrderPaise)}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-surface-1 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isMinMet ? "bg-green-500" : "bg-accent-gold"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                {isMinMet ? (
                  <span className="text-green-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Minimum reached ({formatPaise(subtotalPaise)})
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold">
                    Add {formatPaise(shortfallPaise)} more to qualify
                  </span>
                )}
                <span className="text-muted">{progressPercent}%</span>
              </div>

              {resolvedRule.messageText && (
                <p className="text-[11px] text-muted border-t border-border/50 pt-1.5 mt-1.5">
                  {resolvedRule.messageText}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:border-accent-gold"
              />
              {formErrors.fullName && <p className="text-xs text-red-400 mt-1">{formErrors.fullName}</p>}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Mobile Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-muted font-medium">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-11 pr-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:border-accent-gold"
                />
              </div>
              {formErrors.mobile && <p className="text-xs text-red-400 mt-1">{formErrors.mobile}</p>}
            </div>

            {/* WhatsApp Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text">WhatsApp Number</label>
                <label className="text-xs text-muted flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsMobile}
                    onChange={(e) => setSameAsMobile(e.target.checked)}
                    className="rounded accent-accent-gold"
                  />
                  Same as Mobile
                </label>
              </div>
              {!sameAsMobile && (
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-xs text-muted font-medium">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-11 pr-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:border-accent-gold"
                  />
                </div>
              )}
              {formErrors.whatsapp && <p className="text-xs text-red-400 mt-1">{formErrors.whatsapp}</p>}
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Email Address <span className="text-muted font-normal">(Optional, for summary copy)</span>
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:border-accent-gold"
              />
              {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
            </div>

            {/* City & Pincode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  City / Town <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Madurai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:border-accent-gold"
                />
                {formErrors.city && <p className="text-xs text-red-400 mt-1">{formErrors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  PIN Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="625001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:border-accent-gold"
                />
                {formErrors.pincode && <p className="text-xs text-red-400 mt-1">{formErrors.pincode}</p>}
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Address / Area / Landmark <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Street name, landmark, or nearest parcel transport office"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:border-accent-gold resize-none"
              />
              {formErrors.address && <p className="text-xs text-red-400 mt-1">{formErrors.address}</p>}
            </div>

            {/* Preferred Contact Method */}
            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">
                Preferred Mode of Contact
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferredContact("WHATSAPP")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    preferredContact === "WHATSAPP"
                      ? "bg-green-600/20 border-green-500 text-green-300"
                      : "bg-surface-2 border-border text-muted hover:text-text"
                  }`}
                >
                  <MessageCircle className="w-4 h-4 text-green-400" />
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredContact("CALL")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    preferredContact === "CALL"
                      ? "bg-accent-gold/20 border-accent-gold text-accent-gold"
                      : "bg-surface-2 border-border text-muted hover:text-text"
                  }`}
                >
                  <Phone className="w-4 h-4 text-accent-gold" />
                  Phone Call
                </button>
              </div>
            </div>

            {/* Special Notes / Instructions */}
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Special Remarks / Transport Request <span className="text-muted font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Call after 5 PM, or preferred transport service"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:border-accent-gold"
              />
            </div>

            {/* Statutory 18+ Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent18Plus}
                  onChange={(e) => setConsent18Plus(e.target.checked)}
                  className="mt-0.5 rounded accent-accent-gold"
                />
                <span className="text-xs text-muted leading-relaxed">
                  I confirm that I am <strong className="text-text">18 years of age or older</strong> and agree to handle festive sparklers under adult supervision following Indian fireworks safety regulations.
                </span>
              </label>
              {formErrors.consent18Plus && (
                <p className="text-xs text-red-400 mt-1">{formErrors.consent18Plus}</p>
              )}
            </div>

            {/* Privacy note */}
            <p className="text-[11px] text-muted/70 leading-relaxed">
              Privacy Notice: Your information is saved securely to prepare your estimate and contact you regarding parcel transport. We do not share your contact details.
            </p>

            {/* Global Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit CTA */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center text-base py-3"
              disabled={isSubmitting || !isMinMet}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating Enquiry...
                </>
              ) : isMinMet ? (
                <>
                  Send Enquiry ({formatPaise(subtotalPaise)})
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                `Minimum ${formatPaise(minOrderPaise)} Required`
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
