
# **ImpactEcho — Transparent Donation Tracking Platform**

ImpactEcho is a donation-tracking platform built to bridge the gap between donors and the causes that need them most. It ensures complete transparency, verification, and trust by combining **blockchain**, **AI models**, and a **dynamic NGO management system**.

---

## 🚀 **Why ImpactEcho?**

Most donors never actually know whether their contributions made a real-world impact. ImpactEcho solves this by ensuring that every donation, every claim, and every document flows through a **verified, tamper-proof pipeline**.

---

## ✅ **Key Features**

### **1. Blockchain-Backed Donation Tracking**

* Every donation and agreement is hashed on-chain.
* Ensures records cannot be manipulated by donors, NGOs, or admins.
* Provides an auditable trail for transparent impact verification.

### **2. AI-Driven NGO Document Verification**

* Uses machine learning to validate NGO certificates and documents.
* Flags fraud, inconsistencies, or fake registrations.
* Ensures only authentic NGOs make it into the system.

### **3. OCR-Powered Bill & Receipt Extraction**

* Accepts images of real purchase bills.
* OCR model automatically extracts:

  * Item names
  * Prices
  * Vendors
  * Total spend
* Provides donors with proof of fund utilization.

### **4. Virtual Agreements**

* Generates digital contracts between **NGO ↔ Admin** with structured terms.
* Stored immutably via blockchain hashing.
* Ensures both sides follow transparent commitments.

### **5. Dynamic Cause & NGO Management**

* Admins create, update, or archive causes in real-time.
* NGOs upload receipts, verification requests, and expenditure logs.
* Donors browse verified causes and track progress instantly.

---

## 🧠 **Tech Stack**

### **Backend**

* Python (Flask / FastAPI depending on your implementation)
* JSON-based datastore (for hackathon speed)
* Blockchain hashing (SHA-256 / smart contract layer if used)

### **AI & OCR**

* Custom OCR pipeline
* Verification heuristics
* Image preprocessing (OpenCV / Tesseract / your model)

### **Frontend**

* HTML / CSS / JS
* Dynamic cause visualizations
* Real-time updates for logs and usage

### **Other Integrations**

* Virtual agreement generator
* Logging + audit trails
* API endpoints for NGO/admin workflows

---

## 📦 **Features for Hackathon Demo**

ImpactEcho includes a polished, end-to-end flow:

1. **Admin registers NGOs**
2. **NGOs submit verification documents**
3. **AI verifies authenticity**
4. **Admin approves**
5. **NGOs create causes & receive donations**
6. **Spending receipts uploaded → OCR extracts data**
7. **Blockchain stores hashes for transparency**
8. **Donors see real proof of impact**

---

## 🏁 **How to Run (Local Setup)**

1. Clone the repository:

   ```bash
   git clone <your-repo-url>
   cd ImpactEcho
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the server:

   ```bash
   python app.py
   ```

4. Open the app in your browser:

   ```
   http://localhost:5000
   ```

---

## 📂 **Project Structure**

```
ImpactEcho/
│
├── app.py                 # Main backend
├── templates/             # Frontend HTML
├── static/                # CSS, JS, images
├── ocr_model/             # OCR + AI utilities
├── contracts/             # Virtual agreements
├── data/                  # NGOs, causes, logs (ignored in Git)
└── README.md              # You're here
```

---

## 🤝 **Team & Credits**

Built with urgency, creativity, and sleepless enthusiasm for our hackathon.
Focused on solving a real-world problem with **technology that builds trust**.

## Contributors

- **Shikshith V** — AI Systems & AI Verification  
- **Manaswi Guntupalli** — Blockchain Integration  
- **Aditya Singhal** — Frontend Development  
- **Samhitha Sudarshan** — Backend Development
