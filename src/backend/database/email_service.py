import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()


class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)

        if not all([self.smtp_username, self.smtp_password]):
            raise ValueError("SMTP credentials not configured")

    async def send_reset_code_email(self, to_email: str, reset_code: str) -> bool:
        """Send password reset code via email"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = "Mã khôi phục mật khẩu - OCR PDF Service"

            # Email body
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Khôi phục mật khẩu</h2>
                    <p>Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản của mình.</p>
                    <p>Mã khôi phục của bạn là:</p>
                    <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 8px;">{reset_code}</h1>
                    </div>
                    <p><strong>Lưu ý:</strong></p>
                    <ul>
                        <li>Mã này có hiệu lực trong <strong>5 phút</strong></li>
                        <li>Không chia sẻ mã này với bất kỳ ai</li>
                        <li>Nếu bạn không yêu cầu khôi phục mật khẩu, hãy bỏ qua email này</li>
                    </ul>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #666; font-size: 14px;">
                        Email này được gửi từ OCR PDF Service<br>
                        Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi.
                    </p>
                </div>
            </body>
            </html>
            """

            msg.attach(MIMEText(body, 'html', 'utf-8'))

            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
            server.quit()

            return True
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            return False


# Global instance
email_service = EmailService()