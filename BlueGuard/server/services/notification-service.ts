// Notification Service for SMS and Email alerts
import nodemailer from 'nodemailer';

interface NotificationConfig {
  sms: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  email: {
    apiKey: string;
    fromEmail: string;
  };
}

interface NotificationPayload {
  type: 'sms' | 'email' | 'push';
  recipient: string;
  subject?: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  alertId?: string;
}

export class NotificationService {
  private emailTransporter: any;
  private isConfigured = false;

  constructor() {
    this.setupEmailTransporter();
  }

  private setupEmailTransporter() {
    // Mock SMTP transporter for development
    this.emailTransporter = nodemailer.createTransporter({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SENDGRID_API_KEY || 'mock-api-key',
        pass: 'mock-password'
      }
    });
  }

  async sendNotification(payload: NotificationPayload): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      switch (payload.type) {
        case 'sms':
          return await this.sendSMS(payload);
        case 'email':
          return await this.sendEmail(payload);
        case 'push':
          return await this.sendPushNotification(payload);
        default:
          throw new Error(`Unsupported notification type: ${payload.type}`);
      }
    } catch (error) {
      console.error('Notification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendBulkNotifications(
    recipients: string[], 
    message: string, 
    type: 'sms' | 'email',
    priority: 'low' | 'medium' | 'high' | 'emergency' = 'medium'
  ): Promise<{
    sent: number;
    failed: number;
    details: Array<{ recipient: string; success: boolean; error?: string }>;
  }> {
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await this.sendNotification({
        type,
        recipient,
        message,
        priority,
        subject: type === 'email' ? 'BlueGuard Alert' : undefined
      });

      results.push({
        recipient,
        success: result.success,
        error: result.error
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Rate limiting for SMS
      if (type === 'sms') {
        await this.delay(100); // 100ms delay between SMS
      }
    }

    return { sent, failed, details: results };
  }

  async sendEmergencyAlert(
    alertData: {
      title: string;
      message: string;
      riskLevel: 'low' | 'medium' | 'high';
      location?: string;
      evacuationRoute?: string;
    },
    contacts: Array<{ type: 'sms' | 'email'; recipient: string }>
  ): Promise<void> {
    const urgencyMap = {
      low: 'Advisory',
      medium: 'Warning',
      high: 'EMERGENCY'
    };

    const urgency = urgencyMap[alertData.riskLevel];
    const enhancedMessage = this.formatEmergencyMessage(alertData, urgency);

    const notifications = contacts.map(contact => ({
      type: contact.type,
      recipient: contact.recipient,
      message: enhancedMessage,
      subject: `${urgency}: ${alertData.title}`,
      priority: alertData.riskLevel === 'high' ? 'emergency' as const : 'high' as const
    }));

    // Send all notifications concurrently for emergency alerts
    await Promise.allSettled(
      notifications.map(notification => this.sendNotification(notification))
    );
  }

  private async sendSMS(payload: NotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Mock Twilio SMS implementation
    console.log(`[SMS MOCK] Sending to ${payload.recipient}: ${payload.message}`);
    
    // In real implementation:
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    const message = await client.messages.create({
      body: payload.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: payload.recipient
    });
    
    return { success: true, messageId: message.sid };
    */

    // Mock success response
    await this.delay(200); // Simulate network delay
    
    if (Math.random() > 0.05) { // 95% success rate
      return {
        success: true,
        messageId: `mock_sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } else {
      return {
        success: false,
        error: 'SMS delivery failed - invalid phone number'
      };
    }
  }

  private async sendEmail(payload: NotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Mock SendGrid email implementation
    console.log(`[EMAIL MOCK] Sending to ${payload.recipient}: ${payload.subject}`);
    
    // In real implementation:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: payload.recipient,
      from: 'alerts@blueguard.coastal',
      subject: payload.subject,
      text: payload.message,
      html: this.generateEmailHTML(payload)
    };
    
    const [response] = await sgMail.send(msg);
    return { success: true, messageId: response.headers['x-message-id'] };
    */

    // Mock email sending
    await this.delay(300); // Simulate network delay
    
    if (this.isValidEmail(payload.recipient)) {
      return {
        success: true,
        messageId: `mock_email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } else {
      return {
        success: false,
        error: 'Invalid email address'
      };
    }
  }

  private async sendPushNotification(payload: NotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Mock push notification
    console.log(`[PUSH MOCK] Sending push notification: ${payload.message}`);
    
    await this.delay(100);
    
    return {
      success: true,
      messageId: `mock_push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  private formatEmergencyMessage(alertData: any, urgency: string): string {
    let message = `${urgency}: ${alertData.title}\n\n${alertData.message}`;
    
    if (alertData.location) {
      message += `\n\nLocation: ${alertData.location}`;
    }
    
    if (alertData.evacuationRoute) {
      message += `\n\nEvacuation Route: ${alertData.evacuationRoute}`;
    }
    
    message += '\n\nThis is an automated alert from BlueGuard Coastal Monitoring System.';
    
    return message;
  }

  private generateEmailHTML(payload: NotificationPayload): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>BlueGuard Alert</h1>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h2>${payload.subject}</h2>
            <p style="line-height: 1.6; font-size: 16px;">${payload.message}</p>
            <div style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3;">
              <strong>Important:</strong> This is an automated alert from the BlueGuard Coastal Monitoring System.
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666;">
            <p>BlueGuard - Protecting Coastal Communities</p>
          </div>
        </body>
      </html>
    `;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getNotificationStats(startDate: Date, endDate: Date): Promise<{
    total: number;
    sent: number;
    failed: number;
    byType: { [key: string]: number };
    byPriority: { [key: string]: number };
  }> {
    // Mock statistics
    return {
      total: 142,
      sent: 138,
      failed: 4,
      byType: {
        sms: 67,
        email: 71,
        push: 4
      },
      byPriority: {
        low: 23,
        medium: 89,
        high: 26,
        emergency: 4
      }
    };
  }
}

export const notificationService = new NotificationService();