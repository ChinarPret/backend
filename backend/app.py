#!/usr/bin/env python3
"""
Chinar Clothing Store — Backend
--------------------------------
A small Flask app that:
  1. Serves the static website (the folder above this one)
  2. Provides a JSON product API      -> GET  /api/products
  3. Accepts checkout orders          -> POST /api/order
  4. Lists orders for the shop owner  -> GET  /api/orders  (simple, no auth — see note below)
  5. Lets you add a new product       -> POST /api/admin/products

Run it with:
    pip install -r requirements.txt
    python3 app.py

Then open http://localhost:5000 in your browser.

NOTE ON GOING LIVE: this demo keeps orders in a local JSON file and has no
login system on the admin endpoints. Before using this for real payments or
a public launch, put it behind proper authentication and swap the JSON
"database" for a real one (SQLite/Postgres) plus a real payment gateway
(JazzCash / EasyPaisa / Stripe).

DEPLOYMENT NOTE: this backend is deployed separately (e.g. on Render) from
the static frontend (e.g. on Netlify). CORS is enabled so the frontend,
hosted on a different domain, can call these API routes. The static-file
routes below (`/` and `/<path:path>`) are only useful when running this
locally next to the `site` folder — on Render, only the /api/... routes
are actually used.
"""
import json
import os
import random
import string
from datetime import datetime

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.path.dirname(BASE_DIR)  # the folder containing index.html etc.
PRODUCTS_FILE = os.path.join(BASE_DIR, "products.json")
ORDERS_FILE = os.path.join(BASE_DIR, "orders.json")

app = Flask(__name__, static_folder=None)
CORS(app)  # allow requests from your Netlify frontend domain


def load_products():
    with open(PRODUCTS_FILE, "r") as f:
        return json.load(f)


def save_products(products):
    with open(PRODUCTS_FILE, "w") as f:
        json.dump(products, f, indent=2)


def load_orders():
    if not os.path.exists(ORDERS_FILE):
        return []
    with open(ORDERS_FILE, "r") as f:
        return json.load(f)


def save_orders(orders):
    with open(ORDERS_FILE, "w") as f:
        json.dump(orders, f, indent=2)


def make_order_id():
    return "CHN-" + "".join(random.choices(string.digits, k=6))


# ---------------------------------------------------------------- Static site
# NOTE: on Render, only backend/ is deployed, so SITE_DIR (one level up)
# won't exist there — these routes are only useful for local development.
@app.route("/")
def home():
    index_path = os.path.join(SITE_DIR, "index.html")
    if not os.path.isfile(index_path):
        return jsonify({"status": "Chinar backend is running"}), 200
    return send_from_directory(SITE_DIR, "index.html")


@app.route("/<path:path>")
def static_files(path):
    # Serves every page/css/js/image the same way a normal static host would.
    full_path = os.path.join(SITE_DIR, path)
    if os.path.isfile(full_path):
        directory, filename = os.path.split(full_path)
        return send_from_directory(directory, filename)
    return jsonify({"error": "not found"}), 404


# ---------------------------------------------------------------- Product API
@app.route("/api/products", methods=["GET"])
def get_products():
    products = load_products()

    category = request.args.get("category")
    if category:
        products = [p for p in products if p["category"] == category]

    on_sale = request.args.get("sale")
    if on_sale:
        products = [p for p in products if p.get("sale_price")]

    return jsonify(products)


@app.route("/api/products/<slug>", methods=["GET"])
def get_product(slug):
    products = load_products()
    product = next((p for p in products if p["slug"] == slug), None)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(product)


# ---------------------------------------------------------------- Admin: add a product
# Pairs with process_images.py — after processing raw photos into
# assets/images/products/<slug>/clip-N.jpg, POST the product details here
# (or just hand-edit backend/products.json — either works).
@app.route("/api/admin/products", methods=["POST"])
def add_product():
    data = request.get_json(force=True)
    required = ["slug", "name", "category", "price", "images"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    products = load_products()
    if any(p["slug"] == data["slug"] for p in products):
        return jsonify({"error": "A product with this slug already exists"}), 409

    new_product = {
        "id": max((p["id"] for p in products), default=0) + 1,
        "slug": data["slug"],
        "name": data["name"],
        "collection": data.get("collection", "Chinar Signature Collection"),
        "category": data["category"],  # "unstitched" or "ready-to-wear"
        "fabric": data.get("fabric", "Embroidered Lawn"),
        "color": data.get("color", ""),
        "description": data.get("description", ""),
        "long_description": data.get("long_description", data.get("description", "")),
        "price": data["price"],
        "sale_price": data.get("sale_price"),
        "currency": "PKR",
        "sizes": data.get("sizes", ["Unstitched (One Size)"]),
        "in_stock": data.get("in_stock", True),
        "badge": data.get("badge"),
        "images": data["images"],
        "thumb": data.get("thumb", data["images"][0]),
        "sku": data.get("sku", f"CHN-{data['slug'].upper()}"),
    }
    products.append(new_product)
    save_products(products)
    return jsonify(new_product), 201


# ---------------------------------------------------------------- Orders
@app.route("/api/order", methods=["POST"])
def create_order():
    data = request.get_json(force=True)
    orders = load_orders()

    order = {
        "orderId": make_order_id(),
        "customer": data.get("customer", {}),
        "items": data.get("items", []),
        "subtotal": data.get("subtotal", 0),
        "shipping": data.get("shipping", 0),
        "total": data.get("total", 0),
        "status": "pending",
        "placedAt": datetime.utcnow().isoformat() + "Z",
    }
    orders.append(order)
    save_orders(orders)
    return jsonify({"orderId": order["orderId"], "status": "received"}), 201


@app.route("/api/orders", methods=["GET"])
def list_orders():
    # Simple shop-owner view. Add authentication before exposing this
    # outside your own machine / a trusted admin panel.
    return jsonify(load_orders())


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # debug=False and host 0.0.0.0 are required for production hosts like Render
    app.run(host="0.0.0.0", port=port, debug=False)
