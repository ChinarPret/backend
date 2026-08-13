function renderTopMarquee() {
  const words = [
    "Free Shipping Across Pakistan on Orders Over Rs. 6,000",
    "Eid Sale — Up to 25% Off",
    "Hand Embroidered",
    "Ready to Wear — Small · Medium · Large",
    "Modest by Design",
  ];
  const track = [...words, ...words, ...words].map((w) => `<span>${w}</span>`).join("");
  return `<div class="strip"><div class="strip-track">${track}</div></div>`;
}

function renderHeader(activePage) {
  const links = [
    { href: "index.html", label: "Home", key: "home" },
    { href: "shop.html", label: "Shop All", key: "shop" },
    { href: "shop.html?category=unstitched", label: "Unstitched", key: "unstitched" },
    { href: "shop.html?category=ready-to-wear", label: "Ready to Wear", key: "rtw" },
    { href: "about.html", label: "Our Story", key: "about" },
    { href: "contact.html", label: "Contact", key: "contact" },
  ];
  const linkHtml = links
    .map(
      (l) =>
        `<a href="${l.href}" class="${activePage === l.key ? "active" : ""}">${l.label}</a>`
    )
    .join("");

  return `
  <div class="nav container">
    <div class="nav-left">
      <button class="menu-toggle" id="menuToggle" aria-label="Open menu">${ICONS.menu}</button>
      <div class="search-box">
        ${ICONS.search}
        <input type="text" id="navSearch" placeholder="Search suits, colors..." />
      </div>
    </div>
    <a href="index.html" class="brand">
      <img src="assets/images/logo/chinar-logo.png" alt="Chinar Clothing Store logo" />
      <span class="brand-text">CHINAR<span>CLOTHING STORE</span></span>
    </a>
    <div class="nav-right">
      <ul class="nav-links" id="navLinks">${linkHtml}</ul>
      <button class="icon-btn" id="wishToggleNav" title="Wishlist" onclick="location.href='shop.html?view=wishlist'">${ICONS.heart}</button>
      <button class="icon-btn" id="cartOpenBtn" title="Cart">
        ${ICONS.bag}
        <span class="badge-count" id="cartCount">0</span>
      </button>
    </div>
  </div>
  <div class="nav-scrim" id="navScrim"></div>`;
}

function renderFooter() {
  return `
  <div class="container footer-grid">
    <div class="footer-brand">
      <img src="assets/images/logo/chinar-logo.png" alt="Chinar logo" />
      <p>Rooted in tradition, styled for today. Hand-embroidered ready-to-wear suits for the modern, modest woman.</p>
      <div class="social-row">
        <a href="#" aria-label="Facebook" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 9h3V6h-3a4 4 0 0 0-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2a1 1 0 0 1 1-1Z"/></svg></a>
        <a href="#" aria-label="Instagram" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg></a>
        <a href="#" aria-label="TikTok" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3v9.5a3.5 3.5 0 1 1-3-3.46"/><path d="M13 3c.3 2.2 1.8 3.9 4 4.2"/></svg></a>
      </div>
    </div>
    <div class="footer-col">
      <h4>Shop</h4>
      <ul>
        <li><a href="shop.html">All Products</a></li>
        <li><a href="shop.html?category=unstitched">Unstitched Suits</a></li>
        <li><a href="shop.html?category=ready-to-wear">Ready to Wear</a></li>
        <li><a href="shop.html?sale=1">Sale</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Help</h4>
      <ul>
        <li><a href="contact.html">Contact Us</a></li>
        <li><a href="about.html#faq">Size Guide</a></li>
        <li><a href="about.html#faq">Shipping &amp; Returns</a></li>
        <li><a href="track-order.html">Track Order</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Visit</h4>
      <ul class="contact-info" style="display:grid;gap:14px;">
        <li>${ICONS.pin}<span>Misq ul mall, Faisalabad, Pakistan</span></li>
        <li>${ICONS.phone}<span>+92 3239898913</span></li>
        <li>${ICONS.mail}<span>chinarclothing8@gmail.com</span></li>
      </ul>
    </div>
  </div>
  <div class="container footer-bottom">
    <span>© <span id="year"></span> Chinar Clothing Store. All rights reserved.</span>
    <span>Designed with care in Pakistan</span>
  </div>`;
}

function renderCartDrawer() {
  return `
  <div class="cart-scrim" id="cartScrim"></div>
  <aside class="cart-drawer" id="cartDrawer" aria-label="Shopping cart">
    <div class="cart-head">
      <h3>Your Bag</h3>
      <button class="cart-close" id="cartCloseBtn">${ICONS.close}</button>
    </div>
    <div class="cart-items" id="cartItemsMount"></div>
    <div class="cart-foot" id="cartFootMount"></div>
  </aside>
  <div class="toast" id="toast">${ICONS.check}<span id="toastMsg">Added to bag</span></div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const marqueeMount = document.getElementById("top-marquee");
  const headerMount = document.getElementById("site-header");
  const footerMount = document.getElementById("site-footer");
  const cartMount = document.getElementById("cart-drawer-mount");
  if (marqueeMount) marqueeMount.innerHTML = renderTopMarquee();
  if (headerMount) headerMount.innerHTML = renderHeader(headerMount.dataset.active || "");
  if (footerMount) footerMount.innerHTML = renderFooter();
  if (cartMount) cartMount.innerHTML = renderCartDrawer();

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  document.dispatchEvent(new Event("partials:ready"));
});
