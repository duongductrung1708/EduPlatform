# 📧 Email Invitations Setup Guide

## **Tính năng Email Invitations**

Hệ thống EduLearn đã được cập nhật để tự động gửi email mời khi:
- **Giáo viên thêm học sinh vào môn học**
- **Giáo viên thêm học sinh vào lớp học**

## **🔧 Cấu hình Environment Variables**

Thêm các biến môi trường sau vào file `.env` của backend:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

## **📧 Email Templates**

### **Course Invitation Email**
- **Subject**: `Mời tham gia môn học: [Course Title]`
- **Content**: 
  - Thông tin môn học
  - Tên giáo viên
  - Nút "Tham gia môn học" với link trực tiếp
  - Hướng dẫn sử dụng

### **Classroom Invitation Email**
- **Subject**: `Mời tham gia lớp học: [Classroom Title]`
- **Content**:
  - Thông tin lớp học
  - Tên giáo viên
  - Mã lớp học (invite code)
  - Nút "Tham gia lớp học" với link trực tiếp
  - Hướng dẫn sử dụng

## **🎯 User Flow**

### **Course Enrollment Flow:**
1. **Giáo viên thêm học sinh** vào môn học
2. **Hệ thống tự động gửi email** mời tham gia
3. **Học sinh nhận email** với thông tin môn học
4. **Click nút "Tham gia môn học"** → Redirect đến trang môn học
5. **Hoặc đăng nhập** và truy cập môn học từ dashboard

### **Classroom Enrollment Flow:**
1. **Giáo viên thêm học sinh** vào lớp học
2. **Hệ thống tự động gửi email** mời tham gia
3. **Học sinh nhận email** với thông tin lớp học và mã lớp
4. **Click nút "Tham gia lớp học"** → Redirect đến trang join với mã lớp
5. **Hoặc đăng nhập** và sử dụng mã lớp để join

## **🔗 Email Links**

### **Course Links:**
```
http://localhost:3000/courses/[courseId]
```

### **Classroom Links:**
```
http://localhost:3000/join-classroom?code=[inviteCode]
```

## **⚙️ Technical Implementation**

### **Backend Changes:**
- ✅ **EmailService**: Thêm methods `sendCourseInvitationEmail()` và `sendClassroomInvitationEmail()`
- ✅ **CoursesService**: Cập nhật `enrollInCourse()` để gửi email
- ✅ **ClassroomsService**: Cập nhật `addStudent()` để gửi email
- ✅ **Email Templates**: HTML templates với responsive design

### **Email Features:**
- ✅ **Responsive Design**: Tương thích với mobile và desktop
- ✅ **Brand Colors**: Sử dụng color palette của EduLearn
- ✅ **Direct Links**: Nút CTA với link trực tiếp
- ✅ **Error Handling**: Không làm fail enrollment nếu email lỗi
- ✅ **Logging**: Log chi tiết cho debugging

## **🚀 Testing**

### **Test Course Invitation:**
1. Tạo môn học mới
2. Thêm học sinh vào môn học
3. Kiểm tra email được gửi
4. Click link trong email
5. Verify redirect đến đúng trang môn học

### **Test Classroom Invitation:**
1. Tạo lớp học mới
2. Thêm học sinh vào lớp học
3. Kiểm tra email được gửi
4. Click link trong email
5. Verify redirect đến trang join với mã lớp

## **📱 Email Preview**

### **Course Invitation:**
```
┌─────────────────────────────────────┐
│            EduLearn                 │
│        Mời tham gia môn học         │
├─────────────────────────────────────┤
│ Xin chào [Student Name]!            │
│                                     │
│ Giáo viên [Teacher Name] đã mời     │
│ bạn tham gia môn học của họ.        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        [Course Title]           │ │
│ │ 👨‍🏫 Giảng dạy bởi: [Teacher]    │ │
│ │                                 │ │
│ │    [Tham gia môn học]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📚 Thông tin môn học:              │
│ • Truy cập tất cả nội dung         │
│ • Theo dõi tiến độ học tập         │
│ • Tham gia hoạt động và bài tập    │
│ • Nhận thông báo cập nhật          │
└─────────────────────────────────────┘
```

### **Classroom Invitation:**
```
┌─────────────────────────────────────┐
│            EduLearn                 │
│        Mời tham gia lớp học         │
├─────────────────────────────────────┤
│ Xin chào [Student Name]!            │
│                                     │
│ Giáo viên [Teacher Name] đã mời     │
│ bạn tham gia lớp học của họ.        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      [Classroom Title]          │ │
│ │ 👨‍🏫 Giảng dạy bởi: [Teacher]    │ │
│ │                                 │ │
│ │      Mã lớp: [ABC123]           │ │
│ │                                 │ │
│ │    [Tham gia lớp học]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🏫 Thông tin lớp học:              │
│ • Truy cập tất cả nội dung         │
│ • Tham gia bài học và hoạt động    │
│ • Nộp bài tập và nhận phản hồi     │
│ • Nhận thông báo cập nhật          │
│                                     │
│ Cách tham gia:                      │
│ 1. Nhấn nút "Tham gia lớp học"     │
│ 2. Hoặc sử dụng mã lớp: ABC123     │
└─────────────────────────────────────┘
```

## **✅ Benefits**

### **For Teachers:**
- ✅ **Automated Communication**: Không cần gửi email thủ công
- ✅ **Professional Appearance**: Email template đẹp, chuyên nghiệp
- ✅ **Easy Tracking**: Biết được ai đã nhận email
- ✅ **Direct Access**: Học sinh có thể join ngay từ email

### **For Students:**
- ✅ **Clear Information**: Thông tin rõ ràng về môn học/lớp học
- ✅ **Easy Access**: Click một lần để tham gia
- ✅ **Multiple Options**: Có thể join qua email hoặc mã lớp
- ✅ **Professional Experience**: Trải nghiệm chuyên nghiệp

### **For System:**
- ✅ **Improved Engagement**: Tăng tỷ lệ tham gia
- ✅ **Better Communication**: Giao tiếp hiệu quả hơn
- ✅ **Reduced Manual Work**: Giảm công việc thủ công
- ✅ **Enhanced UX**: Trải nghiệm người dùng tốt hơn

## **🎉 Ready to Use!**

Email invitations đã sẵn sàng sử dụng! Chỉ cần:
1. ✅ Cấu hình SMTP trong `.env`
2. ✅ Set `FRONTEND_URL` cho links
3. ✅ Thêm học sinh vào môn học/lớp học
4. ✅ Email sẽ được gửi tự động!

**🚀 Hệ thống EduLearn giờ đây có khả năng giao tiếp chuyên nghiệp với học sinh thông qua email invitations!**
