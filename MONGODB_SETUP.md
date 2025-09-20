# 🗄️ Hướng dẫn cài đặt MongoDB cho EduPlatform

## ❌ Lỗi hiện tại

```
MongooseServerSelectionError: connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017
```

Lỗi này xảy ra vì MongoDB chưa được cài đặt hoặc chưa chạy trên máy.

## 🚀 Giải pháp

### **Tùy chọn 1: Cài đặt MongoDB Local (Khuyến nghị)**

#### **Windows:**

1. **Tải MongoDB Community Server:**

   - Truy cập: https://www.mongodb.com/try/download/community
   - Chọn Windows x64
   - Tải file `.msi`

2. **Cài đặt:**

   - Chạy file `.msi` vừa tải
   - Chọn "Complete" installation
   - ✅ Tick "Install MongoDB as a Service"
   - ✅ Tick "Run service as Network Service user"
   - ✅ Tick "Install MongoDB Compass" (GUI tool)

3. **Khởi động MongoDB:**

   ```bash
   # Kiểm tra service
   net start MongoDB

   # Hoặc khởi động thủ công
   mongod --dbpath "C:\data\db"
   ```

#### **macOS:**

```bash
# Cài đặt qua Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Khởi động MongoDB
brew services start mongodb/brew/mongodb-community
```

#### **Linux (Ubuntu/Debian):**

```bash
# Import public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update và cài đặt
sudo apt-get update
sudo apt-get install -y mongodb-org

# Khởi động MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### **Tùy chọn 2: Sử dụng MongoDB Atlas (Cloud)**

1. **Tạo tài khoản MongoDB Atlas:**

   - Truy cập: https://www.mongodb.com/atlas
   - Đăng ký tài khoản miễn phí

2. **Tạo cluster:**

   - Chọn "Build a Database"
   - Chọn "FREE" tier (M0)
   - Chọn region gần nhất
   - Tạo cluster

3. **Cấu hình kết nối:**

   - Vào "Database Access" → "Add New Database User"
   - Tạo username/password
   - Vào "Network Access" → "Add IP Address" → "Allow access from anywhere"

4. **Lấy connection string:**

   - Vào "Database" → "Connect" → "Connect your application"
   - Copy connection string

5. **Cập nhật environment:**
   ```bash
   # Tạo file .env trong thư mục backend
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eduplatform?retryWrites=true&w=majority
   ```

### **Tùy chọn 3: Sử dụng Docker**

```bash
# Chạy MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Hoặc sử dụng docker-compose
```

Tạo file `docker-compose.yml`:

```yaml
version: "3.8"
services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

Chạy:

```bash
docker-compose up -d
```

## 🔧 Kiểm tra kết nối

### **Kiểm tra MongoDB đang chạy:**

```bash
# Windows
net start | findstr MongoDB

# macOS/Linux
brew services list | grep mongodb
# hoặc
sudo systemctl status mongod
```

### **Test kết nối:**

```bash
# Kết nối MongoDB shell
mongosh

# Hoặc với authentication
mongosh "mongodb://localhost:27017/eduplatform"
```

### **Kiểm tra port:**

```bash
# Windows
netstat -an | findstr 27017

# macOS/Linux
lsof -i :27017
```

## 🚀 Khởi động ứng dụng

Sau khi MongoDB đã chạy:

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (terminal khác)
cd frontend
npm install
npm run dev
```

## 🔍 Troubleshooting

### **Lỗi "Port 27017 already in use":**

```bash
# Tìm process đang sử dụng port
lsof -i :27017

# Kill process
kill -9 <PID>
```

### **Lỗi "Permission denied":**

```bash
# Tạo thư mục data
sudo mkdir -p /data/db
sudo chown -R $USER /data/db
```

### **Lỗi "MongoDB service won't start":**

```bash
# Kiểm tra log
tail -f /var/log/mongodb/mongod.log

# Restart service
sudo systemctl restart mongod
```

## 📝 Environment Variables

Tạo file `.env` trong thư mục `backend`:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/eduplatform

# Hoặc cho MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eduplatform?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Port
PORT=3000
```

## 🎯 Khuyến nghị

- **Development:** Sử dụng MongoDB local
- **Production:** Sử dụng MongoDB Atlas
- **Team collaboration:** Sử dụng MongoDB Atlas để đồng bộ dữ liệu

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy:

1. Kiểm tra MongoDB đã chạy chưa
2. Kiểm tra port 27017 có bị chiếm không
3. Kiểm tra firewall settings
4. Kiểm tra connection string trong `.env`
