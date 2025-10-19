from flask import Flask, render_template, request, jsonify, redirect, url_for
import json, os

app = Flask(__name__)

# --- Path to store all hashes ---
HASH_FILE = "hash_store.json"

# --- Ensure the file exists ---
if not os.path.exists(HASH_FILE):
    with open(HASH_FILE, "w") as f:
        json.dump({}, f)


def load_hashes():
    with open(HASH_FILE, "r") as f:
        return json.load(f)


def save_hashes(data):
    with open(HASH_FILE, "w") as f:
        json.dump(data, f, indent=4)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/store-hash", methods=["POST"])
def store_hash():
    """Receive and store the hash info sent from frontend."""
    data = request.get_json()
    if not data or "hash" not in data:
        return jsonify({"error": "Invalid data"}), 400

    all_hashes = load_hashes()
    hash_key = data["hash"]
    all_hashes[hash_key] = {
        "address": data.get("address"),
        "timestamp": data.get("timestamp"),
        "nonce": data.get("nonce")
    }

    save_hashes(all_hashes)
    return jsonify({"message": "Hash stored successfully!"})


@app.route("/dashboard.html")
def dashboard_redirect():
    """Redirect dashboard.html?hash=xxx to /dashboard/<hash>"""
    hash_val = request.args.get("hash")
    if not hash_val:
        return redirect(url_for("home"))
    return redirect(url_for("dashboard", hash_val=hash_val))


@app.route("/dashboard/<hash_val>")
def dashboard(hash_val):
    """Display personalized dashboard based on the hash"""
    all_hashes = load_hashes()
    user_data = all_hashes.get(hash_val)

    if not user_data:
        return render_template("dashboard.html", error="Invalid or unknown session hash.")

    return render_template("dashboard.html", hash_val=hash_val, user=user_data)


if __name__ == "__main__":
    app.run(debug=True, port=8000)
