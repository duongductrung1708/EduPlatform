# ☁️ Hướng dẫn sử dụng MongoDB Atlas (Cloud)

## ✅ Có thể sử dụng MongoDB Atlas!

Nếu bạn đã có MongoDB Atlas trong file `.env`, hãy làm theo các bước sau:

## 🔧 Cấu hình MongoDB Atlas

### **Bước 1: Tạo file .env**

Tạo file `.env` trong thư mục `backend/` với nội dung:

```env
# MongoDB Atlas (Cloud)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eduplatform?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=3000

# Environment
NODE_ENV=development
```

### **Bước 2: Thay thế thông tin thực tế**

Thay thế các thông tin sau trong `MONGO_URI`:

- `username`: Tên đăng nhập MongoDB Atlas
- `password`: Mật khẩu MongoDB Atlas
- `cluster`: Tên cluster của bạn
- `eduplatform`: Tên database (có thể thay đổi)

**Ví dụ thực tế:**

```env
MONGO_URI=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/eduplatform?retryWrites=true&w=majority
```

## 🚀 Kiểm tra kết nối

### **Test kết nối MongoDB Atlas:**

```bash
cd backend
npm run check:mongodb
```

Script sẽ kiểm tra:

- ✅ Kết nối đến MongoDB Atlas
- ✅ Database và collections
- ✅ Số lượng documents

### **Khởi động ứng dụng:**

```bash
# Backend
cd backend
npm run start:dev

# Frontend (terminal khác)
cd frontend
npm run dev
```

## 🔍 Troubleshooting MongoDB Atlas

### **Lỗi "Authentication failed":**

```bash
# Kiểm tra username/password
# Đảm bảo user có quyền truy cập database
```

### **Lỗi "Network timeout":**

```bash
# Kiểm tra Network Access trong MongoDB Atlas
# Thêm IP address hiện tại vào whitelist
```

### **Lỗi "Database not found":**

```bash
# Database sẽ được tạo tự động khi ứng dụng chạy
# Hoặc tạo thủ công trong MongoDB Atlas
```

## 🌐 Cấu hình MongoDB Atlas

### **1. Network Access:**

- Vào MongoDB Atlas Dashboard
- Chọn "Network Access"
- Click "Add IP Address"
- Chọn "Allow access from anywhere" (0.0.0.0/0)
- Hoặc thêm IP cụ thể của bạn

### **2. Database Access:**

- Vào "Database Access"
- Click "Add New Database User"
- Tạo username/password
- Chọn "Read and write to any database"

### **3. Connection String:**

- Vào "Database" → "Connect"
- Chọn "Connect your application"
- Copy connection string
- Thay thế `<password>` bằng password thực tế

## 📊 Lợi ích MongoDB Atlas

### **✅ Ưu điểm:**

- **Không cần cài đặt** MongoDB local
- **Tự động backup** và scaling
- **Truy cập từ mọi nơi** (cloud)
- **Miễn phí** với M0 tier
- **Dễ chia sẻ** với team

### **⚠️ Lưu ý:**

- **Internet required** - cần kết nối mạng
- **Latency** - có thể chậm hơn local
- **Data limit** - M0 tier có giới hạn 512MB

## 🎯 So sánh Local vs Atlas

| Tính năng     | MongoDB Local | MongoDB Atlas  |
| ------------- | ------------- | -------------- |
| **Cài đặt**   | Cần cài đặt   | Không cần      |
| **Tốc độ**    | Nhanh nhất    | Phụ thuộc mạng |
| **Backup**    | Thủ công      | Tự động        |
| **Scaling**   | Thủ công      | Tự động        |
| **Chi phí**   | Miễn phí      | Miễn phí (M0)  |
| **Team work** | Khó chia sẻ   | Dễ chia sẻ     |

## 🚀 Khuyến nghị

### **Sử dụng MongoDB Atlas khi:**

- ✅ Làm việc nhóm
- ✅ Deploy production
- ✅ Cần backup tự động
- ✅ Không muốn cài đặt local

### **Sử dụng MongoDB Local khi:**

- ✅ Development cá nhân
- ✅ Cần tốc độ cao
- ✅ Không có internet ổn định
- ✅ Muốn kiểm soát hoàn toàn

## 📞 Hỗ trợ

Nếu gặp vấn đề với MongoDB Atlas:

1. **Kiểm tra connection string** trong `.env`
2. **Kiểm tra Network Access** trong Atlas dashboard
3. **Kiểm tra Database Access** permissions
4. **Chạy** `npm run check:mongodb` để test
5. **Xem logs** trong MongoDB Atlas dashboard

## 🔗 Links hữu ích

- **MongoDB Atlas:** https://www.mongodb.com/atlas
- **Connection String Guide:** https://docs.atlas.mongodb.com/driver-connection/
- **Network Access:** https://docs.atlas.mongodb.com/security-whitelist/
