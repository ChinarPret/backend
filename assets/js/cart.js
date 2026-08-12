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

  // ---- Web3Forms Email Sender ----
  async function sendOrderEmail(data, accessKey) {
    const customer = data.customer || {};
    const items = data.items || detailedItems();
    const subtotalVal = data.subtotal !== undefined ? data.subtotal : subtotal();
    const shippingVal = data.shipping !== undefined ? data.shipping : (subtotalVal >= 6000 ? 0 : 250);
    const totalVal = data.total !== undefined ? data.total : (subtotalVal + shippingVal);
    const orderId = data.orderId || ("CHN-" + Math.floor(100000 + Math.random() * 900000));

    const paymentNames = {
      cod: "Cash on Delivery",
      bank: "Bank Transfer",
      card: "Credit / Debit Card"
    };
    const paymentMethod = paymentNames[customer.payment] || customer.payment || "Cash on Delivery";

    // Build Formatted Email Body
    let message = `NEW ORDER PLACED (${orderId})\n`;
    message += `=====================================\n\n`;

    message += `ORDERED ITEMS:\n`;
    if (items.length > 0) {
      items.forEach((item, index) => {
        const prod = item.product || {};
        const code = prod.code || `PROD-${item.id}`;
        const title = prod.name || prod.title || item.name || "Suit/Dress";
        const linePrice = item.lineTotal || (item.unitPrice ? item.unitPrice * item.qty : 0);

        message += `${index + 1}. ${code} — ${title}\n`;
        message += `   • Size: ${item.size}\n`;
        message += `   • Qty: ${item.qty}\n`;
        message += `   • Price: Rs. ${linePrice.toLocaleString()}\n`;

        let img = prod.images ? prod.images[0] : prod.image;
        if (img) {
          const imgUrl = img.startsWith('http')
            ? img
            : window.location.origin + '/' + img.replace(/^\//, '');
          message += `   • Image: ${imgUrl}\n`;
        }
        message += `\n`;
      });
    } else {
      message += `• No items in cart\n\n`;
    }

    message += `Subtotal: Rs. ${subtotalVal.toLocaleString()}\n`;
    message += `Shipping: ${shippingVal === 0 ? 'Free' : 'Rs. ' + shippingVal.toLocaleString()}\n`;
    message += `Total Amount: Rs. ${totalVal.toLocaleString()} (${paymentMethod})\n\n`;

    if (customer.notes && customer.notes.trim() !== "") {
      message += `Notes: ${customer.notes.trim()}\n\n`;
    }

    message += `DELIVERY DETAILS:\n`;
    message += `• Name: ${customer.fullName || 'Guest'}\n`;
    message += `• Phone: ${customer.phone || 'Not provided'}\n`;
    message += `• Email: ${customer.email || 'Not provided'}\n`;
    message += `• Address: ${customer.address || ''}${customer.city ? ', ' + customer.city : ''}${customer.province ? ', ' + customer.province : ''}\n`;

    // Send payload to Web3Forms API
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `🛍️ New Order #${orderId} from ${customer.fullName || 'Customer'}`,
          from_name: "Chinar Store Checkout",
          name: customer.fullName || "Customer",
          email: customer.email || "chinarclothing8@gmail.com",
          message: message,
        }),
      });
      return await response.json();
    } catch (err) {
      console.error("Web3Forms Email Error:", err);
      return { success: false, error: err.message };
    }
  }

  return {
    read, add, updateQty, remove, clear, count, detailedItems, subtotal,
    wishToggle, wishHas, wishRead, sendOrderEmail
  };
})();

window.Cart = Cart;