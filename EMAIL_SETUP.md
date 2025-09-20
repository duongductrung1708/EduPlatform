# 📧 Hướng dẫn cấu hình Email OTP

## 🎯 Tổng quan

EduPlatform đã được tích hợp chức năng xác thực email với OTP (One-Time Password) để tăng cường bảo mật. Khi người dùng đăng ký, hệ thống sẽ gửi mã OTP 6 chữ số đến email để xác thực tài khoản.

## ⚙️ Cấu hình SMTP

### 1. Gmail Setup (Khuyến nghị)

#### Bước 1: Tạo App Password

1. Đăng nhập vào Gmail
2. Vào **Google Account Settings** → **Security**
3. Bật **2-Step Verification** nếu chưa có
4. Tạo **App Password**:
   - Vào **Security** → **App passwords**
   - Chọn **Mail** và **Other (Custom name)**
   - Nhập tên: "EduPlatform"
   - Copy mật khẩu được tạo (16 ký tự)

#### Bước 2: Cấu hình .env

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
```

### 2. Outlook/Hotmail Setup

```env
# Email Configuration
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

### 3. Yahoo Mail Setup

```env
# Email Configuration
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your_email@yahoo.com
SMTP_PASS=your_app_password
```

## 🔧 Cấu hình Backend

### 1. Cài đặt Dependencies

```bash
cd backend
npm install nodemailer @types/nodemailer @nestjs/config
```

### 2. Cập nhật .env

Thêm các biến môi trường sau vào file `.env`:

```env
# Database
MONGO_URI=mongodb://localhost:27017/eduplatform

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES=15m
REFRESH_SECRET=your_refresh_secret_here
REFRESH_EXPIRES=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# Server
PORT=3000
NODE_ENV=development
```

### 3. Test Email Connection

```bash
# Test email service
npm run start:dev
```

## 🎨 Tính năng Frontend

### 1. Registration Flow

1. User điền form đăng ký
2. Hệ thống tạo tài khoản (unverified)
3. Gửi OTP đến email
4. Hiển thị dialog nhập OTP
5. User nhập mã OTP
6. Xác thực thành công → Đăng nhập tự động

### 2. Login Flow

1. User đăng nhập với tài khoản chưa verify
2. Hệ thống hiển thị dialog OTP
3. User nhập mã OTP
4. Xác thực thành công → Đăng nhập

### 3. OTP Features

- **6-digit OTP**: Mã xác thực 6 chữ số
- **10-minute expiry**: Hết hạn sau 10 phút
- **Resend functionality**: Gửi lại OTP (cooldown 60s)
- **Beautiful UI**: Dialog đẹp với countdown timer
- **Error handling**: Thông báo lỗi chi tiết

## 📧 Email Template

Email OTP được thiết kế với:

- **Professional design**: Giao diện chuyên nghiệp
- **Brand colors**: Màu sắc EduLearn theme
- **Security warnings**: Cảnh báo bảo mật
- **Responsive**: Tương thích mobile
- **Multi-language ready**: Sẵn sàng đa ngôn ngữ

## 🚀 Testing

### 1. Test Registration

```bash
# Start backend
cd backend
npm run start:dev

# Start frontend
cd frontend
npm run dev
```

### 2. Test Flow

1. Truy cập `/auth/register`
2. Điền thông tin đăng ký
3. Kiểm tra email nhận OTP
4. Nhập mã OTP
5. Xác thực thành công

### 3. Test Resend

1. Đăng ký tài khoản mới
2. Đợi 60 giây
3. Click "Gửi lại mã OTP"
4. Kiểm tra email mới

## 🔒 Security Features

### 1. OTP Security

- **Random generation**: Mã OTP ngẫu nhiên
- **Time-limited**: Hết hạn sau 10 phút
- **One-time use**: Chỉ sử dụng 1 lần
- **Auto-cleanup**: Tự động xóa OTP hết hạn

### 2. Rate Limiting

- **Resend cooldown**: 60 giây giữa các lần gửi lại
- **Email validation**: Kiểm tra định dạng email
- **Account verification**: Bắt buộc xác thực để đăng nhập

## 🐛 Troubleshooting

### 1. Email không gửi được

```bash
# Check SMTP configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 2. Gmail App Password

- Đảm bảo đã bật 2-Step Verification
- Sử dụng App Password, không phải mật khẩu thường
- Kiểm tra App Password có 16 ký tự

### 3. Firewall/Network

- Port 587 phải được mở
- Không bị chặn bởi firewall
- Kiểm tra kết nối internet

### 4. Debug Logs

```bash
# Check backend logs
npm run start:dev

# Look for email service logs
[EmailService] OTP email sent to user@example.com: <messageId>
```

## 📱 Mobile Support

OTP dialog được tối ưu cho mobile:

- **Responsive design**: Tự động điều chỉnh kích thước
- **Touch-friendly**: Nút bấm dễ chạm
- **Keyboard support**: Hỗ trợ bàn phím số
- **Auto-focus**: Tự động focus vào input

## 🎯 Next Steps

1. **Production Setup**: Cấu hình SMTP production
2. **Email Templates**: Tùy chỉnh template email
3. **Analytics**: Theo dõi tỷ lệ xác thực
4. **Multi-language**: Hỗ trợ đa ngôn ngữ
5. **SMS OTP**: Thêm xác thực SMS

## 📞 Support

Nếu gặp vấn đề:

1. Kiểm tra logs backend
2. Verify SMTP configuration
3. Test với email khác
4. Check network connectivity

---

**🎉 Chúc mừng! Email OTP system đã sẵn sàng sử dụng!**
