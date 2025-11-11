# 💳 Payment Gateway Setup Guide

Complete guide to test VNPay and PayPal sandbox payments in Lensor.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [VNPay Sandbox Setup](#vnpay-sandbox-setup)
3. [PayPal Sandbox Setup](#paypal-sandbox-setup)
4. [Testing Payment Flow](#testing-payment-flow)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### 1. Environment Configuration

The `.env` file already includes VNPay sandbox credentials. You only need to add PayPal credentials.

```bash
# VNPay - READY TO USE ✅
VNPAY_TMN_CODE=LDY7BZ35
VNPAY_HASH_SECRET=JT6NS5XSWD2FYMLFLGEBBVB5B1ZF2GUR
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3005/payment/vnpay-return

# PayPal - NEEDS YOUR CREDENTIALS ⚠️
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=YOUR_CLIENT_ID_HERE
PAYPAL_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
PAYPAL_RETURN_URL=http://localhost:3005/payment/paypal-return
PAYPAL_CANCEL_URL=http://localhost:3005/payment/paypal-cancel
```

### 2. Start the Server

```bash
npm run start:dev
```

### 3. Open Test Page

Open `test-payment-gateway.html` in your browser:
- Double-click the file, or
- Use Live Server extension in VS Code, or
- Open directly: `file:///path/to/test-payment-gateway.html`

---

## 🏦 VNPay Sandbox Setup

### ✅ Already Configured!

VNPay sandbox credentials are already in your `.env` file. You can start testing immediately.

### Test Card Information

Use these test card details when testing VNPay payments:

```
Card Number:  9704198526191432198
Card Holder:  NGUYEN VAN A
Issue Date:   07/15
OTP Code:     123456
```

### Payment Flow

1. Select **VNPay** as payment channel
2. Enter amount (e.g., 50000 VND)
3. Click "Pay with VNPay"
4. Enter test card details
5. Enter OTP: `123456`
6. Confirm payment

### Expected Result

- Redirected to VNPay sandbox
- Payment page displays order info
- After confirmation, redirected back to your return URL
- Order status updated to "completed"

---

## 💰 PayPal Sandbox Setup

### Step 1: Get PayPal Developer Account

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
2. Login with your PayPal account (or create one)
3. If first time, you'll see the Developer Dashboard

### Step 2: Create Sandbox App

1. Click **"Apps & Credentials"** in the left menu
2. Make sure **"Sandbox"** tab is selected (top of page)
3. Click **"Create App"** button
4. Enter App Name: `Lensor Payment` (or any name)
5. Click **"Create App"**

### Step 3: Get Credentials

After creating the app, you'll see:

```
Client ID:      AXXXXXxxxxxxxxxxxxxxx...
Secret:         EYYYYYyyyyyyyyyyyyyyy...
```

**Copy these values!**

### Step 4: Update .env File

Replace the placeholder values in `.env`:

```bash
PAYPAL_CLIENT_ID=AXXXXXxxxxxxxxxxxxxxx...    # Paste your Client ID
PAYPAL_CLIENT_SECRET=EYYYYYyyyyyyyyyyyyyyy...  # Paste your Secret
```

### Step 5: Restart Server

```bash
# Press Ctrl+C to stop, then:
npm run start:dev
```

### PayPal Test Accounts

PayPal automatically creates test accounts for you. To view/create more:

1. Go to [Sandbox Accounts](https://developer.paypal.com/dashboard/accounts)
2. You'll see Business and Personal test accounts
3. Click on any account to see login credentials

**Example Test Account (pre-created):**
```
Email:    sb-tbt4q47331523@personal.example.com
Password: Nd8f=2>X
```

### Payment Flow

1. Select **PayPal** as payment channel
2. Enter amount (will be converted to USD)
3. Click "Pay with PayPal"
4. Login with PayPal test account
5. Confirm payment
6. Redirected back to your app

---

## 🧪 Testing Payment Flow

### 1. Get JWT Token

First, login to get your JWT token:

```bash
POST http://localhost:3005/auth/login
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "yourpassword"
}
```

Copy the `access_token` from response.

### 2. Open Test Page

Open `test-payment-gateway.html` in browser.

### 3. Test VNPay Payment

1. Paste JWT token
2. Select **VNPay** payment channel
3. Choose amount preset or enter custom amount
4. Click "Pay with VNPay"
5. Use test card info (shown on page)
6. Complete payment

### 4. Test PayPal Payment

1. Paste JWT token
2. Select **PayPal** payment channel
3. Choose amount (will convert VND → USD)
4. Click "Pay with PayPal"
5. Login with sandbox account
6. Confirm payment

### 5. Verify Results

Check your terminal logs for:
- Payment creation
- Order status updates
- Transaction IDs

---

## 🛠️ Troubleshooting

### CORS Errors

**Problem:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:** Already fixed in `main.ts`. Restart server:
```bash
npm run start:dev
```

### PayPal: "Authentication failed"

**Problem:** Invalid credentials

**Solutions:**
1. Verify Client ID and Secret in `.env`
2. Make sure you copied from **Sandbox** tab (not Live)
3. No extra spaces in credentials
4. Restart server after updating `.env`

### PayPal: "Order could not be captured"

**Problem:** Order already processed or expired

**Solution:**
- PayPal orders expire after 3 hours
- Don't reuse old approval URLs
- Create new payment for each test

### VNPay: "Invalid signature"

**Problem:** Incorrect hash secret or parameters

**Solutions:**
1. Verify `VNPAY_HASH_SECRET` in `.env`
2. Check system time (must be correct)
3. Ensure no special characters in order info

### Server Not Responding

**Problem:** API calls timeout

**Solutions:**
1. Check if server is running: `http://localhost:3005`
2. Verify port 3005 is not in use
3. Check firewall settings
4. Look at terminal for errors

### JWT Token Expired

**Problem:** "Unauthorized" or "Token expired"

**Solution:**
1. Login again to get fresh token
2. Check `JWT_EXPIRES_IN` in `.env` (default: 7d)
3. Make sure token is pasted correctly (no spaces)

---

## 📊 Payment Endpoints

### Unified Payment Endpoint (Recommended)

```bash
POST http://localhost:3005/payment/create
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "amount": 100000,
  "paymentChannel": "vnpay",  // or "paypal"
  "orderInfo": "Purchase Lightroom Presets"
}
```

### VNPay Specific

```bash
POST http://localhost:3005/payment/vnpay/create
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "amount": 100000,
  "orderInfo": "Test VNPay Payment"
}
```

### PayPal Specific

```bash
POST http://localhost:3005/payment/paypal/create
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "amount": 100000,
  "orderInfo": "Test PayPal Payment"
}
```

### Return URLs

- **VNPay Return:** `GET http://localhost:3005/payment/vnpay-return`
- **PayPal Return:** `GET http://localhost:3005/payment/paypal-return`
- **PayPal Cancel:** `GET http://localhost:3005/payment/paypal-cancel`

---

## 💡 Tips & Best Practices

### Currency Conversion

- VNPay: Uses VND directly
- PayPal: Auto-converts VND to USD (rate: 23,000)
- Example: 100,000 VND = $4.35 USD

### Testing Amounts

Use these preset amounts in test page:
- 10,000 VND ($0.43)
- 50,000 VND ($2.17)
- 100,000 VND ($4.35)
- 500,000 VND ($21.74)
- 1,000,000 VND ($43.48)
- 5,000,000 VND ($217.39)

### Order Tracking

Each payment creates an order in database with:
- Unique order ID
- Payment channel (vnpay/paypal)
- Transaction ID (after capture)
- Status (pending → completed/failed)
- Amount and currency

### Security Notes

- Never commit `.env` to git (already in `.gitignore`)
- Use different credentials for production
- Sandbox credentials are safe to share in docs
- Always validate JWT tokens server-side
- Verify payment signatures (VNPay HMAC-SHA512)

---

## 🎯 Next Steps

### For Development

1. ✅ Test both payment channels
2. ✅ Verify order status updates
3. ✅ Check database records
4. ✅ Test error scenarios (insufficient funds, cancelled payments)
5. ✅ Validate webhook/IPN handlers

### For Production

1. ⚠️ Get production credentials from VNPay
2. ⚠️ Get production credentials from PayPal
3. ⚠️ Update environment variables
4. ⚠️ Configure production return URLs
5. ⚠️ Set up SSL/HTTPS
6. ⚠️ Configure production CORS origins
7. ⚠️ Test with real payment amounts
8. ⚠️ Set up monitoring and alerts

---

## 📞 Support

### VNPay Support
- Website: https://vnpay.vn
- Sandbox: https://sandbox.vnpayment.vn
- Docs: https://sandbox.vnpayment.vn/apis/

### PayPal Support
- Developer Portal: https://developer.paypal.com
- Sandbox: https://www.sandbox.paypal.com
- Docs: https://developer.paypal.com/docs/api/overview/

---

## ✅ Checklist

Before testing, ensure:

- [x] `.env` file has VNPay credentials
- [ ] `.env` file has PayPal Client ID and Secret
- [x] Server is running on port 3005
- [x] CORS is configured in `main.ts`
- [x] JWT token is valid
- [x] Database is connected
- [x] Test page can access localhost:3005

---

**Happy Testing! 🚀**

If you encounter any issues not covered here, check the server logs for detailed error messages.
