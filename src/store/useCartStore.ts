import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartLine {
  id: string; // productId or comboId
  isCombo: boolean;
  name: string;
  sku: string;
  packSize: string;
  unit: string;
  pricePaise: number;
  mrpPaise: number;
  quantity: number;
  image?: string;
  categorySlug?: string;
  colorFrom?: string;
  colorTo?: string;
}

interface CartState {
  items: CartLine[];
  selectedState: string;
  isHydrated: boolean;
  lastAddedItemId: string | null;
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setSelectedState: (state: string) => void;
  setHydrated: (hydrated: boolean) => void;
  triggerSpark: (id: string) => void;
  getTotalItems: () => number;
  getSubtotalPaise: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedState: "Tamil Nadu", // Sensible regional default
      isHydrated: false,
      lastAddedItemId: null,

      addItem: (item, quantity = 1) => {
        if (quantity <= 0) return;
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === item.id);
          let newItems: CartLine[];

          if (existingIndex > -1) {
            newItems = [...state.items];
            const existing = newItems[existingIndex]!;
            newItems[existingIndex] = {
              ...existing,
              quantity: Math.min(9999, existing.quantity + quantity),
            };
          } else {
            newItems = [...state.items, { ...item, quantity: Math.min(9999, quantity) }];
          }

          return {
            items: newItems,
            lastAddedItemId: item.id,
          };
        });
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.id !== id) };
          }
          return {
            items: state.items.map((i) =>
              i.id === id ? { ...i, quantity: Math.min(9999, quantity) } : i
            ),
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      setSelectedState: (state) => {
        set({ selectedState: state });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },

      triggerSpark: (id) => {
        set({ lastAddedItemId: id });
        setTimeout(() => {
          set({ lastAddedItemId: null });
        }, 600);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotalPaise: () => {
        return get().items.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0);
      },
    }),
    {
      name: "cracker_cart_v1",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage;
        }
        const memory = new Map<string, string>();
        return {
          getItem: (key: string) => memory.get(key) || null,
          setItem: (key: string, val: string) => {
            memory.set(key, val);
          },
          removeItem: (key: string) => {
            memory.delete(key);
          },
        };
      }),
      // Strictly persist ONLY cart items and selected state. Never personal details!
      partialize: (state) => ({
        items: state.items,
        selectedState: state.selectedState,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
