# 🚀 VNPay Payment Integration - Testing Guide

## ✅ Setup Complete!

### 📋 Environment Configuration Added
All VNPay sandbox credentials have been added to `.env` file:
- **Terminal ID (vnp_TmnCode)**: `LDY7BZ35`
- **Hash Secret**: `JT6NS5XSWD2FYMLFLGEBBVB5B1ZF2GUR`
- **Payment URL**: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- **Return URL**: `http://localhost:3005/payment/vnpay-return`

## 🧪 Testing Payment Flow

### Step 1: Start the Application
```bash
# Terminal 1: Start NestJS application
npm run start:dev

# Terminal 2: Start Python Image Service (if needed)
cd image-service
python app.py
```

### Step 2: Get JWT Token
First, you need to login and get a JWT token:

**Option A: Register New User**
```bash
POST http://localhost:3005/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```

**Option B: Login Existing User**
```bash
POST http://localhost:3005/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### Step 3: Test Payment Using HTML Page
1. Open `test-vnpay-payment.html` in your browser
2. Paste your JWT token from Step 2
3. Enter amount (e.g., 100000 VND) or click preset buttons
4. Enter order information (optional)
5. Click "Create VNPay Payment"

### Step 4: Complete Payment on VNPay Sandbox

You'll be redirected to VNPay payment page. Use these **test cards**:

#### 💳 Test Card Information:
- **Card Number**: `9704198526191432198`
- **Card Holder**: `NGUYEN VAN A`
- **Expiry Date**: `07/15`
- **OTP**: `123456`

### Step 5: Verify Payment Result

After payment, you'll be redirected back to:
- **Success**: `http://localhost:3000/payment/success?orderId=xxx`
- **Failed**: `http://localhost:3000/payment/failed?orderId=xxx&code=yyy`

## 📡 API Endpoints

### 1. Create VNPay Payment
```http
POST /payment/vnpay/create
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "amount": 100000,
  "orderInfo": "Payment for Lightroom Preset Pack"
}
```

**Response:**
```json
{
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Version=2.1.0&...",
    "orderId": "uuid-order-id",
    "params": { ... }
  }
}
```

### 2. VNPay Return URL (Auto-redirect)
```http
GET /payment/vnpay-return?vnp_Amount=...&vnp_SecureHash=...
```
This endpoint receives the callback from VNPay and redirects to frontend.

### 3. VNPay IPN (Instant Payment Notification)
```http
GET /payment/vnpay-ipn?vnp_Amount=...&vnp_SecureHash=...
```
This endpoint is called by VNPay server to confirm payment status.

## 🔍 Testing with Postman/Thunder Client

### Create Payment Request:
```json
POST http://localhost:3005/payment/vnpay/create
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json

Body:
{
  "amount": 100000,
  "orderInfo": "Test Payment"
}
```

### Expected Flow:
1. **Request** → NestJS creates order and generates VNPay URL
2. **Redirect** → User redirected to VNPay payment page
3. **Payment** → User enters card info and completes payment
4. **Callback** → VNPay redirects back to `/payment/vnpay-return`
5. **Verify** → NestJS verifies signature and updates order status
6. **Redirect** → User redirected to frontend success/fail page

## 📊 Payment Status Codes

### VNPay Response Codes:
- **00**: Success
- **07**: Transaction suspected
- **09**: Card not registered for Internet Banking
- **10**: Incorrect card authentication
- **11**: Payment timeout
- **12**: Card locked
- **13**: Invalid OTP
- **24**: Transaction canceled by user
- **51**: Insufficient balance
- **65**: Daily transaction limit exceeded
- **75**: Payment bank under maintenance
- **79**: Payment timeout (customer entered wrong OTP too many times)

## 🛠️ Troubleshooting

### Issue: "Invalid signature" error
**Solution**: Check that `VNPAY_HASH_SECRET` in `.env` matches the sandbox credentials.

### Issue: Payment URL not generated
**Solution**: Ensure JWT token is valid and user is authenticated.

### Issue: Order not found after payment
**Solution**: Check that `orderId` in VNPay callback matches the created order.

### Issue: Redirect URL not working
**Solution**: Update `VNPAY_RETURN_URL` in `.env` to match your frontend URL.

## 📝 Order Status Flow

1. **pending**: Order created, waiting for payment
2. **completed**: Payment successful
3. **failed**: Payment failed
4. **cancelled**: User cancelled payment

## 🔐 Security Features Implemented

✅ **HMAC-SHA512 Signature**: All VNPay requests signed with secure hash
✅ **Signature Verification**: All callbacks verified before processing
✅ **JWT Authentication**: Only authenticated users can create payments
✅ **Order Validation**: Each payment linked to a valid order
✅ **IP Address Tracking**: User IP recorded for fraud prevention

## 🎯 Next Steps

1. ✅ VNPay integration complete
2. ⏳ PayPal integration (requires PayPal SDK setup)
3. ⏳ Add payment history page
4. ⏳ Add refund functionality
5. ⏳ Add webhook for async payment notifications

## 📞 Support

If you encounter any issues:
1. Check console logs in both NestJS and browser
2. Verify JWT token is valid
3. Ensure all environment variables are set
4. Check VNPay sandbox status

---

**Happy Testing! 🎉**
