# 📄 Contract System - Debug & Testing Guide

## ✅ Server Status
**Server is running with DEBUG LOGGING enabled!**

The terminal where your Flask server is running will now show detailed logs for every contract and notification action.

---

## 🧪 How to Test & Debug

### **Step 1: Generate Contract as Admin**

1. **Login to Admin Panel** → `http://localhost:8000/admin`
2. Go to **"📄 Contracts"** tab
3. Click **"Generate Contract"** for an NGO
4. **Watch your terminal!** You should see:
   ```
   ✅ Contract generated for NGO: [Organization Name]
   ✅ Notification created: ID=[number], NGO=[Organization Name]
   ```

### **Step 2: Check NGO Panel**

1. **Login as that NGO** → `http://localhost:8000/ngo-login`
2. Go to **"🔔 Notifications"** tab
3. **Watch your terminal!** You should see:
   ```
   🔔 NGO '[Organization Name]' requesting notifications
      Total notifications in system: [number]
      Notifications for this NGO: [number]
      Latest: 📄 Your partnership contract has been generated...
   ```

4. Go to **"📄 Contracts"** tab
5. **Watch your terminal!** You should see:
   ```
   📄 NGO '[Organization Name]' (ID: [number]) requesting contracts
      Total contracts in system: [number]
      Contracts for this NGO: [number]
      Contract IDs: [1, 2, etc.]
   ```

---

## 🔍 What to Look For in Terminal Logs

### ✅ **If Contract Generation Works:**
```
✅ Contract generated for NGO: Test Organization
✅ Notification created: ID=1, NGO=Test Organization
```

### ✅ **If Notifications Load Correctly:**
```
🔔 NGO 'Test Organization' requesting notifications
   Total notifications in system: 5
   Notifications for this NGO: 2
   Latest: 📄 Your partnership contract has been generated...
```

### ✅ **If Contracts Load Correctly:**
```
📄 NGO 'Test Organization' (ID: 3) requesting contracts
   Total contracts in system: 4
   Contracts for this NGO: 2
   Contract IDs: [1, 3]
```

---

## ❌ Common Issues & Solutions

### **Issue 1: NGO Name Mismatch**
**Symptoms:**
```
🔔 NGO 'test org' requesting notifications
   Total notifications in system: 5
   Notifications for this NGO: 0  ← ZERO!
```

**Cause:** The NGO name in the notification doesn't match the session NGO name (case-sensitive!)

**Solution:**
- Check `ngo_registrations.json` for the **exact** organization name
- The notification uses `ngo["org_name"]` from registrations
- The session uses the name from login

---

### **Issue 2: NGO Not Found in Registrations**
**Symptoms:**
```
❌ NGO 'Some Name' not found in registrations
```

**Cause:** The NGO is not in `ngo_registrations.json` or not approved

**Solution:**
- Ensure the NGO is registered and `"approved": true` in `ngo_registrations.json`

---

### **Issue 3: Contract File Missing**
**Symptoms:**
```
⚠️ Contracts file doesn't exist yet
```

**Cause:** `contracts.json` hasn't been created yet

**Solution:** 
- The file is automatically created on first contract generation
- Just generate a contract as admin

---

## 🐛 Debugging Steps

### **Step A: Check JSON Files**

1. **Open `ngo_registrations.json`**
   - Find your NGO
   - Copy the **exact** value of `"org_name"`
   - Example: `"Test NGO"` (with exact capitalization)

2. **Open `contracts.json`**
   - Check if your contract exists
   - Verify the `"ngo_id"` matches your NGO's ID
   - Verify the `"ngo_name"` matches exactly

3. **Open `ngo_notifications.json`**
   - Check if notification exists
   - Verify the `"ngo_name"` matches exactly

### **Step B: Match the Names**

The system requires **EXACT** matches:
- Registration: `"org_name": "Test Organization"`
- Notification: `"ngo_name": "Test Organization"` ✅
- Session: `session['ngo'] = "Test Organization"` ✅

**Case-sensitive! Spaces matter!**

---

## 🔧 Manual Fix (If Needed)

If names don't match, you can manually edit the JSON files:

### **Edit `ngo_notifications.json`:**
```json
{
  "id": 1,
  "ngo_name": "Test Organization",  ← Must match exactly
  "type": "contract_generated",
  "message": "📄 Your partnership contract has been generated...",
  "metadata": {...},
  "read": false,
  "timestamp": "2025-10-25T..."
}
```

### **Edit `contracts.json`:**
```json
{
  "id": 1,
  "ngo_id": 3,  ← Must match NGO's ID in registrations
  "ngo_name": "Test Organization",  ← Must match exactly
  "filename": "contract_3_20251025223045.pdf",
  "status": "pending_signature",
  "generated_date": "2025-10-25T..."
}
```

---

## ✅ Expected Behavior

### **After Admin Generates Contract:**
1. ✅ PDF file created in `uploads/` folder
2. ✅ Entry added to `contracts.json`
3. ✅ Notification added to `ngo_notifications.json`
4. ✅ Terminal shows success logs

### **When NGO Checks Notifications:**
1. ✅ Notification appears with contract icon
2. ✅ Message says "Your partnership contract has been generated"
3. ✅ Clicking notification can navigate to Contracts tab

### **When NGO Checks Contracts:**
1. ✅ Contract card appears
2. ✅ Shows status: "⏳ Awaiting Your Signature"
3. ✅ Download button for PDF
4. ✅ Upload form for signed contract

---

## 📞 Need More Help?

If contracts or notifications still don't appear:

1. **Share the terminal logs** from:
   - Contract generation
   - Notification loading
   - Contract loading

2. **Share the relevant JSON content** from:
   - `ngo_registrations.json` (your NGO entry)
   - `contracts.json` (all contracts)
   - `ngo_notifications.json` (all notifications)

3. **Note the exact steps** you took

---

**Server is ready with debug logging! Try generating a contract now and watch the terminal!** 🎉

