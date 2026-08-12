# Chinar Clothing Store — Website

A full storefront for **Chinar Clothing Store**: hand-embroidered unstitched
suits + ready-to-wear pieces. Built with plain HTML/CSS/JS on the front end
and a small Python (Flask) backend for the product API and order handling.

Theme: light green + off-white, deep "chinar" green accents, gold highlights —
built around your logo. Fonts: Cormorant Garamond (headings) + Jost (body).

---

## 1. Quick start

**Option A — just open it (no backend, still fully working):**
Double-click `index.html`. The cart, filters, checkout form etc. all work
using data baked into `assets/js/products-data.js` and your browser's
localStorage. Orders placed this way are stored in the browser only.

**Option B — run the Python backend (recommended):**
```bash
cd backend
pip install -r requirements.txt
python3 app.py
```
Then open **http://localhost:5000** — the same site, now backed by a real
product API (`/api/products`) and orders saved to `backend/orders.json`
(`/api/order`, `/api/orders`).

The front end automatically prefers the backend if it's running, and falls
back to the built-in data if it isn't — so nothing breaks either way.

---

## 2. Project structure

```
chinar-website/
├── index.html            Home page
├── shop.html              Full catalog with filters/sort/search
├── product.html           Product detail (gallery "clips", size, add-to-cart)
├── cart.html               Full-page cart
├── checkout.html           Shipping form + payment method + place order
├── order-success.html      Confirmation page
├── about.html               Brand story + size guide + FAQ
├── contact.html              Contact form + store info
├── assets/
│   ├── css/style.css       All styling (design tokens at the top)
│   ├── js/
│   │   ├── icons.js         Inline SVG icon set (leaf motif + UI icons)
│   │   ├── products-data.js Static product catalog (fallback data)
│   │   ├── cart.js           Cart + wishlist engine (localStorage)
│   │   ├── partials.js        Shared header/footer/cart-drawer markup
│   │   └── main.js             Shared UI behavior, product card rendering
│   └── images/
│       ├── logo/               Your Chinar logo
│       └── products/p01 … p38/ Auto-processed product photos
└── backend/
    ├── app.py                 Flask app (serves site + API + orders)
    ├── products.json           The product database (edit this to change
    │                            names, prices, discounts, stock, etc.)
    ├── requirements.txt
    ├── process_images.py       Auto image-resizer (see section 4)
    └── raw_uploads/             Drop new, unprocessed photos here
```

---

## 3. What's in the catalog right now

Your 75 uploaded photos were grouped automatically into **38 products** (most
suits had 2 "clips" — an overview + an embroidery close-up; a couple only had
one). Each product was given a name, colorway, fabric, price and — for about
45% of them — a discounted "sale" price, picked to look like a realistic
boutique catalog. All 38 are currently listed under **Ready to Wear** (sizes
Small/Medium/Large) since the photos show fully styled, stitched suits. The
**Unstitched** category is intentionally empty for now — add fabric-only
pieces there whenever you're ready (see below).

**This grouping and pricing is a first draft.** To fine-tune it, open
`backend/products.json` (or `assets/js/products-data.js` if you're not
running the backend) — it's a plain list, easy to edit:

```json
{
  "slug": "p01",
  "name": "Sana Blush",
  "category": "ready-to-wear",
  "fabric": "Embroidered Chiffon",
  "color": "Peach & Rose Gold",
  "price": 7500,
  "sale_price": 6000,
  "sizes": ["Small", "Medium", "Large"],
  "in_stock": true,
  "badge": "New Arrival",
  "images": ["assets/images/products/p01/clip-1.jpg", "assets/images/products/p01/clip-2.jpg"]
}
```
- Set `"sale_price": null` to remove a discount.
- `"badge"` can be `"Bestseller"`, `"New Arrival"`, `"Limited Edition"`, `"Sale"`, or `null`.
- For unstitched fabric pieces, set `"category": "unstitched"` and
  `"sizes": ["Unstitched (One Size)"]`.
- If you're **not** running the Flask backend, copy the same edits into
  `assets/js/products-data.js` (it's the same JSON, just assigned to a JS
  variable) so the static version matches.

---

## 4. Adding new product photos (auto-resizing)

You said you want new images to "just work" without manual resizing —
that's what `process_images.py` does:

1. Put new photos into `backend/raw_uploads/<a-new-product-slug>/`, e.g.
   `backend/raw_uploads/emerald-eid-suit/1.jpg`, `2.jpg`, `3.jpg` (as many
   "clips" as you have).
2. Run:
   ```bash
   cd backend
   python3 process_images.py
   ```
3. It automatically: fixes phone/WhatsApp rotation, crops everything to a
   clean 3:4 product ratio, and saves optimized full + thumbnail JPEGs into
   `assets/images/products/<slug>/`.
4. It writes `backend/image_manifest.json` listing exactly what was
   generated — copy the relevant `images` array into a new entry in
   `products.json` (or POST it to `/api/admin/products` — see `app.py`).

You never have to think about image dimensions again — just drop photos in
and run the script.

---

## 5. About the "AI-generated model wearing hijab" request

I want to flag this honestly rather than fake it: **I can't generate new
photos of models in this environment** — I only have your original product
photos to work with, plus a web image search tool (which finds *existing*
photos on the internet, not new ones I can create, so it can't produce
"your suit on a new model").

What I did instead, and why it still works well for this brand:
- Kept your original photos — flatlay + embroidery close-up shots are
  actually the industry-standard presentation for **unstitched** suits (this
  is exactly how Qalamkar, Republic, Limelight etc. shoot unstitched pieces,
  since there's no fixed size to model on a person).
- Built the gallery/"clip" system so each product cleanly shows all its
  angles, with smooth switching.

If you'd still like styled model photography with hijab later, your options:
- Hire a local photographer/stylist for a proper shoot — this is what most
  competitor brands actually do for their ready-to-wear line.
- Use an AI image tool (Midjourney, Leonardo, etc.) yourself with your
  product photo as reference, then drop the results into
  `backend/raw_uploads/<slug>/` and run `process_images.py` — the site will
  pick them up with zero other changes needed.

---

## 6. Payments

Checkout currently supports **Cash on Delivery**, **Bank Transfer**, and a
**Card** option that's wired up as a UI/flow demo (no real payment gateway is
connected). To accept real card payments, you'd integrate a Pakistani
gateway such as **JazzCash**, **Easypaisa**, or **Stripe** (if you can use
it in your region) — this requires a merchant account and backend changes
in `backend/app.py`'s `/api/order` route. Happy to wire this up once you've
picked a provider.

---

## 7. Before going live — a few honest notes

- The Flask dev server (`python3 app.py`) is for local testing. For a real
  launch, deploy behind a production server (gunicorn + nginx, or a host
  like Render/Railway/PythonAnywhere) and use a real database instead of
  the `products.json` / `orders.json` files.
- Add authentication before exposing `/api/orders` or
  `/api/admin/products` publicly — right now anyone who finds the URL can
  view orders or add products.
- Update the placeholder address/phone/email in the footer and Contact page
  with your real details.
