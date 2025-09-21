# AWS S3 Setup Guide

## 1. Tạo S3 Bucket

1. Đăng nhập vào AWS Console
2. Vào S3 service
3. Tạo bucket mới với tên: `eduplatform-files` (hoặc tên khác)
4. Cấu hình bucket:
   - Region: `ap-southeast-1` (Singapore)
   - Block public access: Disable (để có thể truy cập file public)
   - Versioning: Enable (tùy chọn)

## 2. Tạo IAM User

1. Vào IAM service
2. Tạo user mới: `eduplatform-s3-user`
3. Attach policy: `AmazonS3FullAccess` (hoặc tạo custom policy)
4. Lưu Access Key ID và Secret Access Key

## 3. Cấu hình Environment Variables

Thêm vào file `.env`:

```env
# AWS S3 Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=eduplatform-files
```

## 4. Cấu hình Bucket Policy

Thêm policy sau vào bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## 5. CORS Configuration

Thêm CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## 6. Test Upload

Sau khi cấu hình xong, restart backend server và test upload file trong lesson creation form.
