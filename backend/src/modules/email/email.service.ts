import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendOtpEmail(email: string, otp: string, type: 'registration' | 'password_reset'): Promise<boolean> {
    try {
      const subject = type === 'registration' 
        ? 'Xác nhận đăng ký tài khoản EduLearn' 
        : 'Đặt lại mật khẩu EduLearn';

      const htmlContent = this.generateOtpEmailTemplate(otp, type);

      const mailOptions = {
        from: `"EduLearn" <${this.configService.get('SMTP_USER')}>`,
        to: email,
        subject,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP email sent to ${email}: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}:`, error);
      return false;
    }
  }

  private generateOtpEmailTemplate(otp: string, type: 'registration' | 'password_reset'): string {
    const action = type === 'registration' ? 'đăng ký tài khoản' : 'đặt lại mật khẩu';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận ${action}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                background: linear-gradient(45deg, #EF5B5B, #FF7B7B);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .otp-code {
                background: linear-gradient(45deg, #EF5B5B, #FF7B7B);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 5px;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(239, 91, 91, 0.3);
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">EduLearn</div>
                <h2>Xác nhận ${action}</h2>
            </div>
            
            <p>Xin chào!</p>
            
            <p>Bạn đã yêu cầu ${action} trên nền tảng EduLearn. Để hoàn tất quá trình này, vui lòng sử dụng mã OTP bên dưới:</p>
            
            <div class="otp-code">${otp}</div>
            
            <div class="warning">
                <strong>⚠️ Lưu ý quan trọng:</strong>
                <ul>
                    <li>Mã OTP này chỉ có hiệu lực trong <strong>10 phút</strong></li>
                    <li>Không chia sẻ mã này với bất kỳ ai</li>
                    <li>Nếu bạn không yêu cầu ${action}, vui lòng bỏ qua email này</li>
                </ul>
            </div>
            
            <p>Nếu bạn gặp bất kỳ vấn đề nào, vui lòng liên hệ với chúng tôi qua email hỗ trợ.</p>
            
            <div class="footer">
                <p>Trân trọng,<br>Đội ngũ EduLearn</p>
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async sendCourseInvitationEmail(
    studentEmail: string, 
    studentName: string, 
    courseTitle: string, 
    teacherName: string,
    courseId: string,
    invitationId?: string
  ): Promise<boolean> {
    try {
      const subject = `Mời tham gia môn học: ${courseTitle}`;
      const htmlContent = this.generateCourseInvitationTemplate(
        studentName, 
        courseTitle, 
        teacherName, 
        courseId,
        invitationId
      );

      const mailOptions = {
        from: `"EduLearn" <${this.configService.get('SMTP_USER')}>`,
        to: studentEmail,
        subject,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Course invitation email sent to ${studentEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send course invitation email to ${studentEmail}:`, error);
      return false;
    }
  }

  async sendClassroomInvitationEmail(
    studentEmail: string, 
    studentName: string, 
    classroomTitle: string, 
    teacherName: string,
    inviteCode: string
  ): Promise<boolean> {
    try {
      const subject = `Mời tham gia lớp học: ${classroomTitle}`;
      const htmlContent = this.generateClassroomInvitationTemplate(
        studentName, 
        classroomTitle, 
        teacherName, 
        inviteCode
      );

      const mailOptions = {
        from: `"EduLearn" <${this.configService.get('SMTP_USER')}>`,
        to: studentEmail,
        subject,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Classroom invitation email sent to ${studentEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send classroom invitation email to ${studentEmail}:`, error);
      return false;
    }
  }

  private generateCourseInvitationTemplate(
    studentName: string, 
    courseTitle: string, 
    teacherName: string, 
    courseId: string,
    invitationId?: string
  ): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const joinUrl = invitationId 
      ? `${frontendUrl}/invitations/course/${invitationId}`
      : `${frontendUrl}/courses/${courseId}`;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mời tham gia môn học</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                background: linear-gradient(45deg, #EF5B5B, #FF7B7B);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .course-card {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border: 2px solid #EF5B5B;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
            }
            .course-title {
                font-size: 24px;
                font-weight: bold;
                color: #EF5B5B;
                margin-bottom: 10px;
            }
            .teacher-info {
                color: #666;
                font-size: 16px;
                margin-bottom: 20px;
            }
            .join-button {
                display: inline-block;
                background: linear-gradient(45deg, #EF5B5B, #FF7B7B);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(239, 91, 91, 0.3);
                transition: transform 0.2s;
            }
            .join-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(239, 91, 91, 0.4);
            }
            .info-box {
                background-color: #e3f2fd;
                border-left: 4px solid #2196F3;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">EduLearn</div>
                <h2>Mời tham gia môn học</h2>
            </div>
            
            <p>Xin chào <strong>${studentName}</strong>!</p>
            
            <p>Giáo viên <strong>${teacherName}</strong> đã mời bạn tham gia môn học của họ trên nền tảng EduLearn.</p>
            
            <div class="course-card">
                <div class="course-title">${courseTitle}</div>
                <div class="teacher-info">👨‍🏫 Giảng dạy bởi: ${teacherName}</div>
                <a href="${joinUrl}" class="join-button">Xem lời mời và xác nhận</a>
            </div>
            
            <div class="info-box">
                <strong>📚 Thông tin môn học:</strong>
                <ul>
                    <li>Bạn sẽ có quyền truy cập vào tất cả nội dung môn học</li>
                    <li>Theo dõi tiến độ học tập của mình</li>
                    <li>Tham gia các hoạt động và bài tập</li>
                    <li>Nhận thông báo về cập nhật môn học</li>
                </ul>
            </div>
            
            <p>Nếu bạn không muốn tham gia môn học này, bạn có thể bỏ qua email này.</p>
            
            <div class="footer">
                <p>Trân trọng,<br>Đội ngũ EduLearn</p>
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateClassroomInvitationTemplate(
    studentName: string, 
    classroomTitle: string, 
    teacherName: string, 
    inviteCode: string
  ): string {
    const joinUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join-classroom?code=${inviteCode}`;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mời tham gia lớp học</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                background: linear-gradient(45deg, #EF5B5B, #FF7B7B);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .classroom-card {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border: 2px solid #EF5B5B;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
            }
            .classroom-title {
                font-size: 24px;
                font-weight: bold;
                color: #EF5B5B;
                margin-bottom: 10px;
            }
            .teacher-info {
                color: #666;
                font-size: 16px;
                margin-bottom: 15px;
            }
            .invite-code {
                background: linear-gradient(45deg, #EF5B5B, #FF7B7B);
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 18px;
                letter-spacing: 2px;
                margin: 15px 0;
                display: inline-block;
            }
            .join-button {
                display: inline-block;
                background: linear-gradient(45deg, #EF5B5B, #FF7B7B);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(239, 91, 91, 0.3);
                transition: transform 0.2s;
                margin-top: 10px;
            }
            .join-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(239, 91, 91, 0.4);
            }
            .info-box {
                background-color: #e3f2fd;
                border-left: 4px solid #2196F3;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">EduLearn</div>
                <h2>Mời tham gia lớp học</h2>
            </div>
            
            <p>Xin chào <strong>${studentName}</strong>!</p>
            
            <p>Giáo viên <strong>${teacherName}</strong> đã mời bạn tham gia lớp học của họ trên nền tảng EduLearn.</p>
            
            <div class="classroom-card">
                <div class="classroom-title">${classroomTitle}</div>
                <div class="teacher-info">👨‍🏫 Giảng dạy bởi: ${teacherName}</div>
                <div class="invite-code">Mã lớp: ${inviteCode}</div>
                <a href="${joinUrl}" class="join-button">Tham gia lớp học</a>
            </div>
            
            <div class="info-box">
                <strong>🏫 Thông tin lớp học:</strong>
                <ul>
                    <li>Bạn sẽ có quyền truy cập vào tất cả nội dung lớp học</li>
                    <li>Tham gia các bài học và hoạt động</li>
                    <li>Nộp bài tập và nhận phản hồi từ giáo viên</li>
                    <li>Nhận thông báo về cập nhật lớp học</li>
                </ul>
            </div>
            
            <p><strong>Cách tham gia:</strong></p>
            <ol>
                <li>Nhấn nút "Tham gia lớp học" ở trên</li>
                <li>Hoặc đăng nhập vào EduLearn và sử dụng mã lớp: <strong>${inviteCode}</strong></li>
            </ol>
            
            <p>Nếu bạn không muốn tham gia lớp học này, bạn có thể bỏ qua email này.</p>
            
            <div class="footer">
                <p>Trân trọng,<br>Đội ngũ EduLearn</p>
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed:', error);
      return false;
    }
  }
}
