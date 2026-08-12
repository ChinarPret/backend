/* ==========================================================
   CHINAR — Cart Engine
   Persists to localStorage so the cart survives across pages
   and browser sessions. Pure vanilla JS, no dependencies.
   ========================================================== */
const Cart = (() => {
  const KEY = "chinar_cart_v1";
  const WISHLIST_KEY = "chinar_wishlist_v1";

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("cart:updated", { detail: { items } }));
  }

  function findProduct(id) {
    return (window.CHINAR_PRODUCTS || []).find((p) => p.id === Number(id));
  }

  function add(productId, size, qty = 1) {
    const items = read();
    const existing = items.find((i) => i.id === Number(productId) && i.size === size);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ id: Number(productId), size, qty });
    }
    write(items);
  }

  function updateQty(productId, size, qty) {
    let items = read();
    if (qty <= 0) {
      items = items.filter((i) => !(i.id === Number(productId) && i.size === size));
    } else {
      const item = items.find((i) => i.id === Number(productId) && i.size === size);
      if (item) item.qty = qty;
    }
    write(items);
  }

  function remove(productId, size) {
    updateQty(productId, size, 0);
  }

  function clear() {
    write([]);
  }

  function count() {
    return read().reduce((sum, i) => sum + i.qty, 0);
  }

  function detailedItems() {
    return read()
      .map((i) => {
        const p = findProduct(i.id);
        if (!p) return null;
        const unitPrice = p.sale_price || p.price;
        return { ...i, product: p, unitPrice, lineTotal: unitPrice * i.qty };
      })
      .filter(Boolean);
  }

  function subtotal() {
    return detailedItems().reduce((sum, i) => sum + i.lineTotal, 0);
  }

  // ---- Wishlist ----
  function wishRead() {
    try {
      return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function wishToggle(productId) {
    let ids = wishRead();
    productId = Number(productId);
    if (ids.includes(productId)) {
      ids = ids.filter((id) => id !== productId);
    } else {
      ids.push(productId);
    }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    document.dispatchEvent(new CustomEvent("wishlist:updated", { detail: { ids } }));
    return ids.includes(productId);
  }
  function wishHas(productId) {
    return wishRead().includes(Number(productId));
  }

  return { read, add, updateQty, remove, clear, count, detailedItems, subtotal, wishToggle, wishHas, wishRead };
})();

window.Cart = Cart;
