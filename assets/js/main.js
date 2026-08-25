/* ==========================================================
   CHINAR — Shared site behavior
   ========================================================== */

// ---- Product loading (tries Flask API, falls back to static data) ----
async function loadProducts() {
  try {
    const res = await fetch("/api/products", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      window.CHINAR_PRODUCTS = data;
      return data;
    }
  } catch (e) {
    /* backend not running — use bundled data */
  }
  window.CHINAR_PRODUCTS = window.CHINAR_PRODUCTS || CHINAR_PRODUCTS_STATIC;
  return window.CHINAR_PRODUCTS;
}

// Kick off product loading immediately (don't wait for any page's own script)
// so the cart drawer can reliably wait on it before rendering items.
const productsReadyPromise = loadProducts();

function formatPrice(n) {
  return "Rs. " + Number(n).toLocaleString("en-PK");
}

function discountPercent(p) {
  if (!p.sale_price) return 0;
  return Math.round(((p.price - p.sale_price) / p.price) * 100);
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  document.getElementById("toastMsg").textContent = msg;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

// ---- Product card template (used on home + shop pages) ----
function productCardHTML(p) {
  const pct = discountPercent(p);
  const imgB = p.images[1] || p.images[0];
  const wished = window.Cart ? Cart.wishHas(p.id) : false;
  return `
  <article class="product-card" data-id="${p.id}">
    <a href="product.html?slug=${p.slug}" class="product-media">
      <img class="img-a" src="${p.images[0]}" alt="${p.name} — ${p.color}" loading="lazy" />
      <img class="img-b" src="${imgB}" alt="" loading="lazy" />
      <div class="tag-row">
        ${!p.in_stock ? `<span class="tag tag-out">Sold Out</span>` : ""}
        ${p.in_stock && pct > 0 ? `<span class="tag tag-sale">-${pct}%</span>` : ""}
        ${p.in_stock && p.badge && p.badge !== "Sale" ? `<span class="tag ${p.badge === "New Arrival" ? "tag-new" : "tag-limited"}">${p.badge}</span>` : ""}
      </div>
      <button class="wish-btn ${wished ? "active" : ""}" data-wish="${p.id}" title="Save to wishlist" onclick="event.preventDefault(); handleWishClick(${p.id}, this)">${ICONS.heart}</button>
      ${p.images.length > 1 ? `<div class="clip-dots">${p.images.map((_, i) => `<span class="${i === 0 ? "on" : ""}"></span>`).join("")}</div>` : ""}
      <div class="quick-add">
        <button onclick="event.preventDefault(); quickAdd(${p.id})" ${!p.in_stock ? "disabled" : ""}>${p.in_stock ? "Quick Add" : "Sold Out"}</button>
      </div>
    </a>
    <a href="product.html?slug=${p.slug}" class="product-info">
      <span class="p-collection">${p.fabric}</span>
      <h3>${p.name}</h3>
      <div class="price-row">
        <span class="price">${formatPrice(p.sale_price || p.price)}</span>
        ${p.sale_price ? `<span class="price-old">${formatPrice(p.price)}</span>` : ""}
      </div>
    </a>
  </article>`;
}

function handleWishClick(id, btn) {
  const active = Cart.wishToggle(id);
  btn.classList.toggle("active", active);
  showToast(active ? "Saved to wishlist" : "Removed from wishlist");
}

function quickAdd(id) {
  const p = (window.CHINAR_PRODUCTS || []).find((x) => x.id === id);
  if (!p || !p.in_stock) return;
  Cart.add(id, p.sizes[0], 1);
  showToast(`${p.name} added to bag`);
  openCart();
}

// ---- Cart drawer rendering ----
function renderCartDrawerContents() {
  const itemsMount = document.getElementById("cartItemsMount");
  const footMount = document.getElementById("cartFootMount");
  if (!itemsMount) return;
  const items = Cart.detailedItems();

  if (items.length === 0) {
    itemsMount.innerHTML = `<div class="cart-empty">${ICONS.bag}<p>Your bag is empty.</p><a href="shop.html" class="btn btn-outline btn-sm">Start Shopping</a></div>`;
    footMount.innerHTML = "";
    return;
  }

  itemsMount.innerHTML = items
    .map(
      (i) => `
    <div class="cart-item">
      <img src="${i.product.images[0]}" alt="${i.product.name}" />
      <div class="cart-item-info">
        <h4>${i.product.name}</h4>
        <div class="meta">${i.size} · ${formatPrice(i.unitPrice)}</div>
        <div class="cart-item-row">
          <div class="mini-stepper">
            <button onclick="Cart.updateQty(${i.id}, '${i.size}', ${i.qty - 1})">−</button>
            <span>${i.qty}</span>
            <button onclick="Cart.updateQty(${i.id}, '${i.size}', ${i.qty + 1})">+</button>
          </div>
          <button class="cart-item-remove" onclick="Cart.remove(${i.id}, '${i.size}')">Remove</button>
        </div>
      </div>
    </div>`
    )
    .join("");

  const subtotal = Cart.subtotal();
  footMount.innerHTML = `
    <div class="cart-subtotal"><span>Subtotal</span><strong>${formatPrice(subtotal)}</strong></div>
    <p class="cart-note">Shipping &amp; taxes calculated at checkout.</p>
    <a href="checkout.html" class="btn btn-primary btn-block">Checkout</a>
    <a href="cart.html" class="btn btn-outline btn-block" style="margin-top:10px;">View Bag</a>`;
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (el) el.textContent = Cart.count();
}

function openCart() {
  document.getElementById("cartDrawer")?.classList.add("open");
  document.getElementById("cartScrim")?.classList.add("open");
}
function closeCart() {
  document.getElementById("cartDrawer")?.classList.remove("open");
  document.getElementById("cartScrim")?.classList.remove("open");
}

// ---- Global event wiring ----
document.addEventListener("partials:ready", () => {
  updateCartCount();
  productsReadyPromise.then(renderCartDrawerContents);

  document.getElementById("cartOpenBtn")?.addEventListener("click", openCart);
  document.getElementById("cartCloseBtn")?.addEventListener("click", closeCart);
  document.getElementById("cartScrim")?.addEventListener("click", closeCart);

  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  const navScrim = document.getElementById("navScrim");
  menuToggle?.addEventListener("click", () => {
    navLinks.classList.add("open");
    navScrim.classList.add("open");
  });
  navScrim?.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navScrim.classList.remove("open");
  });

  const navSearch = document.getElementById("navSearch");
  navSearch?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && navSearch.value.trim()) {
      location.href = `shop.html?q=${encodeURIComponent(navSearch.value.trim())}`;
    }
  });
});

document.addEventListener("cart:updated", () => {
  updateCartCount();
  productsReadyPromise.then(renderCartDrawerContents);
});

/* ==========================================================
   CHINAR — Scroll reveal + counter animations
   Works across every page, including product/category cards
   that get injected into the DOM after an async fetch.
   ========================================================== */
(function () {
  const REVEAL_SELECTOR = [
    ".section-head",
    ".cat-card",
    ".product-card",
    ".story img",
    ".story-copy",
    ".testi-card",
    ".newsletter",
    ".value-list li",
    ".stat-strip > div",
    ".contact-info li",
    ".page-hero h1",
    ".page-hero p",
    ".pdp-main-media",
    ".pdp-info",
    ".pdp-thumbs",
    ".related-title",
    ".pay-opt",
    ".order-summary",
  ].join(",");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let io;
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
  }

  function primeElement(el, i) {
    if (el.dataset.revealBound) return;
    el.dataset.revealBound = "1";
    if (prefersReducedMotion) return;
    el.classList.add("reveal");
    el.style.transitionDelay = Math.min(i * 70, 420) + "ms";
    if (io) io.observe(el);
    else el.classList.add("in-view");
  }

  function scanAndBind(root) {
    const groups = new Map();
    root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
      if (el.dataset.revealBound) return;
      const parent = el.parentElement || root;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach((els) => els.forEach((el, i) => primeElement(el, i)));
  }

  function animateCounter(el) {
    const raw = el.textContent.trim();
    const match = raw.match(/^(\d+(\.\d+)?)/);
    if (!match) return;
    const end = parseFloat(match[1]);
    const suffix = raw.slice(match[1].length);
    const decimals = match[1].includes(".") ? match[1].split(".")[1].length : 0;
    const duration = 1000;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = raw;
    }
    requestAnimationFrame(tick);
  }

  function bindCounters(root) {
    const nums = root.querySelectorAll(".hero-stats strong, .stat-strip strong");
    nums.forEach((el) => {
      if (el.dataset.countBound) return;
      el.dataset.countBound = "1";
      if (prefersReducedMotion || !("IntersectionObserver" in window)) return;
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      cio.observe(el);
    });
  }

  function init() {
    scanAndBind(document);
    bindCounters(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  document.addEventListener("partials:ready", init);

  // Catch product/category grids that render asynchronously after fetch
  const mo = new MutationObserver((mutations) => {
    let touched = false;
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) { touched = true; break; }
    }
    if (touched) {
      scanAndBind(document);
      bindCounters(document);
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();
