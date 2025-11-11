# Quick Testing Guide - Task T013

## 🚀 Quick Start

### 1. Run the Application
```powershell
npm run start:dev
```

### 2. Connect WebSocket (Chat)
Open `test-chat.html` in browser or use socket.io-client:
```javascript
const socket = io('http://localhost:3000');
socket.emit('authenticate', { userId: 'your-uuid' });
socket.emit('joinRoom', { roomId: 'room-uuid' });
```

---

## 🧪 API Testing Commands (PowerShell)

### Post Likes
```powershell
# Like a post
$token = "your-jwt-token"
$postId = "post-uuid"

Invoke-RestMethod -Uri "http://localhost:3000/posts/$postId/like" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" }

# Get likes
Invoke-RestMethod -Uri "http://localhost:3000/posts/$postId/likes" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" }

# Check if liked
Invoke-RestMethod -Uri "http://localhost:3000/posts/$postId/is-liked" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" }

# Unlike
Invoke-RestMethod -Uri "http://localhost:3000/posts/$postId/like" `
  -Method DELETE `
  -Headers @{ Authorization = "Bearer $token" }
```

### Post Comments
```powershell
# Create comment
$body = @{
  content = "Great photo!"
  parentId = $null
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/posts/$postId/comments" `
  -Method POST `
  -Headers @{ 
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body

# Get comments
Invoke-RestMethod -Uri "http://localhost:3000/posts/$postId/comments" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" }

# Delete comment
$commentId = "comment-uuid"
Invoke-RestMethod -Uri "http://localhost:3000/posts/$postId/comments/$commentId" `
  -Method DELETE `
  -Headers @{ Authorization = "Bearer $token" }
```

### Cart Operations
```powershell
# Get cart
Invoke-RestMethod -Uri "http://localhost:3000/cart" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" }

# Add to cart
$body = @{
  productId = "product-uuid"
  quantity = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/cart/add" `
  -Method POST `
  -Headers @{ 
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body

# Update quantity
$itemId = "cart-item-uuid"
$body = @{ quantity = 5 } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/cart/update/$itemId" `
  -Method PATCH `
  -Headers @{ 
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body

# Remove item
Invoke-RestMethod -Uri "http://localhost:3000/cart/remove/$itemId" `
  -Method DELETE `
  -Headers @{ Authorization = "Bearer $token" }

# Clear cart
Invoke-RestMethod -Uri "http://localhost:3000/cart/clear" `
  -Method DELETE `
  -Headers @{ Authorization = "Bearer $token" }
```

### Payment Flow
```powershell
# Create VNPay payment
$body = @{
  amount = 100000
  orderInfo = "Order #123 - Product purchase"
} | ConvertTo-Json

$payment = Invoke-RestMethod -Uri "http://localhost:3000/payment/vnpay/create" `
  -Method POST `
  -Headers @{ 
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body

# Open payment URL in browser
Start-Process $payment.data.paymentUrl

# After payment, VNPay redirects to:
# GET http://localhost:3000/payment/vnpay/callback?vnp_ResponseCode=00&...
```

### Orders
```powershell
# Get all orders
Invoke-RestMethod -Uri "http://localhost:3000/orders" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" }

# Get specific order
$orderId = "order-uuid"
Invoke-RestMethod -Uri "http://localhost:3000/orders/$orderId" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" }
```

### Chat (REST API)
```powershell
# Create chat room
$body = @{
  name = "Photography Discussion"
  type = "group"
  participantIds = @("user1-uuid", "user2-uuid")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/chat/rooms" `
  -Method POST `
  -Headers @{ 
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body

# Get user's rooms
Invoke-RestMethod -Uri "http://localhost:3000/chat/rooms" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" }

# Get room details
$roomId = "room-uuid"
Invoke-RestMethod -Uri "http://localhost:3000/chat/rooms/$roomId" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" }

# Get room messages
Invoke-RestMethod -Uri "http://localhost:3000/chat/rooms/$roomId/messages?limit=50" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" }
```

---

## 🔌 WebSocket Testing (JavaScript)

### Client-side test file: `test-chat.html`
```html
<!DOCTYPE html>
<html>
<head>
  <title>Chat Test</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Chat Test</h1>
  <div id="messages"></div>
  <input id="messageInput" placeholder="Type a message..." />
  <button onclick="sendMessage()">Send</button>

  <script>
    const socket = io('http://localhost:3000', {
      transports: ['websocket'],
    });

    const userId = 'your-user-uuid';
    const roomId = 'your-room-uuid';

    // Authenticate
    socket.emit('authenticate', { userId });

    // Join room
    socket.emit('joinRoom', { roomId });

    // Listen for new messages
    socket.on('newMessage', (message) => {
      console.log('New message:', message);
      const div = document.getElementById('messages');
      div.innerHTML += `<p><strong>${message.userId}:</strong> ${message.content}</p>`;
    });

    // Send message
    function sendMessage() {
      const input = document.getElementById('messageInput');
      const content = input.value;
      
      socket.emit('sendMessage', {
        roomId,
        content,
        userId,
      });

      input.value = '';
    }

    // Typing indicator
    document.getElementById('messageInput').addEventListener('input', (e) => {
      socket.emit('typing', {
        roomId,
        userId,
        isTyping: e.target.value.length > 0,
      });
    });

    socket.on('userTyping', (data) => {
      console.log(`User ${data.userId} is typing: ${data.isTyping}`);
    });
  </script>
</body>
</html>
```

### Or use Node.js
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
});

const userId = 'your-user-uuid';
const roomId = 'your-room-uuid';

socket.on('connect', () => {
  console.log('Connected to WebSocket');
  
  // Authenticate
  socket.emit('authenticate', { userId }, (response) => {
    console.log('Auth response:', response);
  });
  
  // Join room
  socket.emit('joinRoom', { roomId }, (response) => {
    console.log('Join room response:', response);
  });
  
  // Send message
  socket.emit('sendMessage', {
    roomId,
    content: 'Hello from Node.js!',
    userId,
  }, (response) => {
    console.log('Message sent:', response);
  });
});

// Listen for new messages
socket.on('newMessage', (message) => {
  console.log('New message received:', message);
});

// Listen for typing indicators
socket.on('userTyping', (data) => {
  console.log(`User ${data.userId} typing: ${data.isTyping}`);
});
```

---

## 🖼️ Image Upload with EXIF Testing

```powershell
# Upload image (will extract EXIF automatically)
$imagePath = "C:\path\to\photo.jpg"

$form = @{
  file = Get-Item -Path $imagePath
}

Invoke-RestMethod -Uri "http://localhost:3000/upload" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -Form $form

# Response includes metadata:
{
  "data": {
    "original": "https://...",
    "thumbnail": "https://...",
    "filename": "photo.jpg",
    "metadata": {
      "camera": "Canon EOS R5",
      "lens": "RF24-105mm F4 L IS USM",
      "iso": 100,
      "aperture": 4.0,
      "shutterSpeed": "1/125",
      "focalLength": 50,
      "dateTaken": "2024:01:15 10:30:00",
      "cameraMake": "Canon",
      "width": 6000,
      "height": 4000
    }
  }
}
```

---

## 📦 Preset File Upload Testing

```powershell
# Upload .xmp preset file
$presetPath = "C:\path\to\preset.xmp"

$form = @{
  presetFile = Get-Item -Path $presetPath
}

Invoke-RestMethod -Uri "http://localhost:3000/products/upload-preset" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -Form $form
```

---

## 💳 VNPay Sandbox Test Cards

Use these test cards in VNPay sandbox:

**Card Number:** 9704 0000 0000 0018  
**Card Holder:** NGUYEN VAN A  
**Issue Date:** 03/07  
**OTP:** 123456

**Success Flow:**
1. Create payment → Returns payment URL
2. Open URL in browser
3. Enter test card details
4. Enter OTP: 123456
5. Payment success → Redirects to callback
6. Order status updated to 'completed'

**Failed Payment:**
Use invalid OTP to test failed payment flow.

---

## 🎯 Complete E-commerce Flow Test

```powershell
# 1. Add products to cart
$product1 = "product-uuid-1"
$product2 = "product-uuid-2"

$body = @{ productId = $product1; quantity = 2 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/cart/add" -Method POST `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body

$body = @{ productId = $product2; quantity = 1 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/cart/add" -Method POST `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body

# 2. View cart
$cart = Invoke-RestMethod -Uri "http://localhost:3000/cart" -Method GET `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "Cart Total: $($cart.data.total)"

# 3. Create payment
$body = @{
  amount = $cart.data.total
  orderInfo = "Order from Lensor - $($cart.data.items.Count) items"
} | ConvertTo-Json

$payment = Invoke-RestMethod -Uri "http://localhost:3000/payment/vnpay/create" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body

Write-Host "Order ID: $($payment.data.orderId)"
Write-Host "Payment URL: $($payment.data.paymentUrl)"

# 4. Open payment URL
Start-Process $payment.data.paymentUrl

# 5. After payment, check order status
Start-Sleep -Seconds 30  # Wait for payment
$orderId = $payment.data.orderId
$order = Invoke-RestMethod -Uri "http://localhost:3000/orders/$orderId" -Method GET `
  -Headers @{ Authorization = "Bearer $token" }

Write-Host "Order Status: $($order.data.status)"

# 6. Clear cart after successful order
if ($order.data.status -eq "completed") {
  Invoke-RestMethod -Uri "http://localhost:3000/cart/clear" -Method DELETE `
    -Headers @{ Authorization = "Bearer $token" }
}
```

---

## 📊 Database Verification

### Check new tables
```sql
-- Post likes
SELECT * FROM post_likes;

-- Post comments
SELECT * FROM post_comments;

-- Cart items
SELECT * FROM cart_items;

-- Orders
SELECT * FROM orders;

-- Chat rooms
SELECT * FROM chat_rooms;

-- Chat messages
SELECT * FROM chat_messages;
```

---

## ✅ Test Checklist

- [ ] Like a post → See like count increase
- [ ] Unlike a post → See like count decrease
- [ ] Create comment → Comment appears in list
- [ ] Reply to comment → See nested reply
- [ ] Delete comment → Comment marked as deleted
- [ ] Add item to cart → Cart total updates
- [ ] Update cart quantity → Total recalculates
- [ ] Remove cart item → Item disappears
- [ ] Clear cart → All items removed
- [ ] Create VNPay payment → Get payment URL
- [ ] Complete payment → Order status becomes 'completed'
- [ ] Failed payment → Order status becomes 'failed'
- [ ] View order history → See all orders
- [ ] Connect WebSocket → See connection log
- [ ] Join chat room → Can send/receive messages
- [ ] Send message → Other users receive in realtime
- [ ] Typing indicator → Other users see typing status
- [ ] Upload image with EXIF → Metadata extracted
- [ ] Upload preset file (.xmp) → File accepted

---

## 🐛 Troubleshooting

### WebSocket connection fails
```javascript
// Check CORS settings in chat.gateway.ts
@WebSocketGateway({
  cors: {
    origin: '*', // Change to your frontend URL
  },
})
```

### Payment callback not working
- Ensure VNPay callback URL is public (no JWT required)
- Check if ngrok or similar is needed for local testing
- Verify VNPay credentials in .env

### EXIF data not extracted
- Check if image-service is running: `python app.py`
- Verify PIL/Pillow is installed: `pip install Pillow`
- Test with image that has EXIF data (not screenshots)

### Cart items not appearing
- Verify JWT token is valid
- Check userId matches between cart items and logged-in user
- Ensure product exists in database

---

## 📞 Support

For issues, check:
1. Console logs in VS Code terminal
2. Network tab in browser dev tools
3. Database tables for data persistence
4. WebSocket connection status

---

**Happy Testing! 🎉**
