import { createContext, useContext, useSyncExternalStore } from "react";
import { readJSON, writeJSON } from "@/lib/storage";

const StoreContext = createContext(null);

const STORAGE_KEY = "dis-shop-state";
const MAX_COMPARE = 4;
const EMPTY_STATE = {
  cart: [],
  wishlist: [],
  compareList: [],
  user: null,
  orders: [],
  currency: "USD",
  couponCode: null,
};

function readPersistedState() {
  const saved = readJSON(STORAGE_KEY, EMPTY_STATE);
  return {
    cart: saved.cart || [],
    wishlist: saved.wishlist || [],
    compareList: saved.compareList || [],
    user: saved.user || null,
    orders: saved.orders || [],
    currency: saved.currency || "USD",
    couponCode: saved.couponCode || null,
  };
}

// A small module-level store (client-only in practice — see getServerSnapshot
// below) so cart/wishlist/currency stay in sync with localStorage without a
// setState-in-effect hydration dance: useSyncExternalStore already renders
// getServerSnapshot() on the server and on the first client pass, then swaps
// to the real getSnapshot() value right after mount, matching the SSR HTML
// exactly with no manual guarding needed.
let cache = null;
const listeners = new Set();

function getState() {
  if (!cache) cache = readPersistedState();
  return cache;
}

function setStoreState(updater) {
  const prev = getState();
  const next = typeof updater === "function" ? updater(prev) : updater;
  cache = next;
  writeJSON(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return getState();
}

function getServerSnapshot() {
  return EMPTY_STATE;
}

export function StoreProvider({ children }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { cart, wishlist, compareList, user, orders, currency, couponCode } = state;

  const setCart = (updater) =>
    setStoreState((prev) => ({
      ...prev,
      cart: typeof updater === "function" ? updater(prev.cart) : updater,
    }));

  const setWishlist = (updater) =>
    setStoreState((prev) => ({
      ...prev,
      wishlist: typeof updater === "function" ? updater(prev.wishlist) : updater,
    }));

  const setCompareList = (updater) =>
    setStoreState((prev) => ({
      ...prev,
      compareList: typeof updater === "function" ? updater(prev.compareList) : updater,
    }));

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { ...product, qty }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty } : item))
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) return prev.filter((item) => item.id !== product.id);
      return [...prev, product];
    });
  };

  const isWishlisted = (id) => wishlist.some((item) => item.id === id);

  // Caps at MAX_COMPARE so the comparison table stays readable — silently
  // ignores further adds past the limit rather than erroring.
  const toggleCompare = (product) => {
    setCompareList((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) return prev.filter((item) => item.id !== product.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, product];
    });
  };

  const isCompared = (id) => compareList.some((item) => item.id === id);
  const clearCompare = () => setCompareList([]);

  const login = (nextUser) =>
    setStoreState((prev) => ({ ...prev, user: nextUser }));
  const logout = () => setStoreState((prev) => ({ ...prev, user: null }));

  const addOrder = (order) =>
    setStoreState((prev) => ({ ...prev, orders: [order, ...prev.orders] }));

  const setCurrency = (nextCurrency) =>
    setStoreState((prev) => ({ ...prev, currency: nextCurrency }));

  const applyCoupon = (code) =>
    setStoreState((prev) => ({ ...prev, couponCode: code }));
  const removeCoupon = () =>
    setStoreState((prev) => ({ ...prev, couponCode: null }));

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  const value = {
    cart,
    wishlist,
    compareList,
    user,
    orders,
    currency,
    couponCode,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    toggleWishlist,
    isWishlisted,
    toggleCompare,
    isCompared,
    clearCompare,
    maxCompare: MAX_COMPARE,
    login,
    logout,
    addOrder,
    setCurrency,
    applyCoupon,
    removeCoupon,
    cartCount,
    cartTotal,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
