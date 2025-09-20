# 🚀 Hướng dẫn khởi động nhanh EduPlatform

## ❌ Lỗi MongoDB thường gặp

```
MongooseServerSelectionError: connect ECONNREFUSED ::1:27017
```

## ⚡ Giải pháp nhanh

### **Tùy chọn A: MongoDB Atlas (Cloud) - Khuyến nghị**

```bash
# 1. Tạo file .env trong backend/ với MongoDB Atlas URI
# 2. Test kết nối
cd backend
npm run test:atlas

# 3. Khởi động ứng dụng
npm run start:dev
```

### **Tùy chọn B: MongoDB Local**

```bash
# 1. Kiểm tra MongoDB
cd backend
npm run check:mongodb

# 2. Khởi động MongoDB (nếu cần)
npm run start:mongodb
```

### **Bước 3: Khởi động ứng dụng**

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## 🔧 Cài đặt MongoDB (nếu chưa có)

### **Windows:**

1. Tải MongoDB: https://www.mongodb.com/try/download/community
2. Cài đặt với tùy chọn "Install as Service"
3. Khởi động: `net start MongoDB`

### **macOS:**

```bash
brew install mongodb-community
brew services start mongodb-community
```

### **Linux:**

```bash
sudo apt-get install mongodb-org
sudo systemctl start mongod
```

## 🌐 Sử dụng MongoDB Atlas (Cloud)

1. Tạo tài khoản: https://www.mongodb.com/atlas
2. Tạo cluster miễn phí
3. Lấy connection string
4. Tạo file `.env` trong `backend/`:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eduplatform
```

## 📞 Hỗ trợ

- **MongoDB Atlas:** Xem `MONGODB_ATLAS_SETUP.md`
- **MongoDB Local:** Xem `MONGODB_SETUP.md`
- **Test Atlas:** Chạy `npm run test:atlas`
- **Test Local:** Chạy `npm run check:mongodb`

## 🎯 Truy cập ứng dụng

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api
