import { Injectable } from '@nestjs/common';
import { EmailTemplateType } from '../dto/send-email.input';

/**
 * Email template rendering service
 * Handles rendering of email templates with dynamic data
 */
@Injectable()
export class EmailTemplatesService {
  /**
   * Render email template based on type and data
   */
  renderTemplate(
    template: EmailTemplateType,
    data: Record<string, any> = {},
  ): { subject: string; html: string; text: string } {
    switch (template) {
      case EmailTemplateType.WELCOME:
        return this.renderWelcomeEmail(data);
      case EmailTemplateType.DOCUMENT_COMPLETED:
        return this.renderDocumentCompletedEmail(data);
      case EmailTemplateType.DOCUMENT_FAILED:
        return this.renderDocumentFailedEmail(data);
      case EmailTemplateType.SYSTEM_NOTIFICATION:
        return this.renderSystemNotificationEmail(data);
      default:
        throw new Error(`Unknown email template: ${template}`);
    }
  }

  /**
   * Welcome email template
   */
  private renderWelcomeEmail(data: Record<string, any>): {
    subject: string;
    html: string;
    text: string;
  } {
    const { firstName, email } = data;
    const displayName = firstName || email;

    return {
      subject: 'Welcome to Legal AI Platform',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Legal AI Platform</h1>
              </div>
              <div class="content">
                <h2>Hello ${displayName}!</h2>
                <p>Thank you for joining Legal AI Platform. We're excited to have you on board!</p>
                <p>With Legal AI Platform, you can:</p>
                <ul>
                  <li>Generate legal documents using AI</li>
                  <li>Ask legal questions and get instant answers</li>
                  <li>Search through legal rulings and case law</li>
                  <li>Collaborate with your team on legal documents</li>
                </ul>
                <p>Get started by logging in to your account:</p>
                <a href="${data.loginUrl || 'http://localhost:3000'}" class="button">Go to Dashboard</a>
                <p>If you have any questions, feel free to reach out to our support team.</p>
              </div>
              <div class="footer">
                <p>Legal AI Platform - Your AI-Powered Legal Assistant</p>
                <p>This is an automated message, please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Welcome to Legal AI Platform

Hello ${displayName}!

Thank you for joining Legal AI Platform. We're excited to have you on board!

With Legal AI Platform, you can:
- Generate legal documents using AI
- Ask legal questions and get instant answers
- Search through legal rulings and case law
- Collaborate with your team on legal documents

Get started by logging in to your account at: ${data.loginUrl || 'http://localhost:3000'}

If you have any questions, feel free to reach out to our support team.

Legal AI Platform - Your AI-Powered Legal Assistant
This is an automated message, please do not reply to this email.
      `,
    };
  }

  /**
   * Document completed email template
   */
  private renderDocumentCompletedEmail(data: Record<string, any>): {
    subject: string;
    html: string;
    text: string;
  } {
    const { documentId, documentType, firstName, documentUrl } = data;
    const displayName = firstName || 'User';

    return {
      subject: 'Your Legal Document is Ready',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .info-box { background-color: white; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✓ Document Ready</h1>
              </div>
              <div class="content">
                <h2>Hello ${displayName}!</h2>
                <p>Great news! Your legal document has been successfully generated and is ready for review.</p>
                <div class="info-box">
                  <p><strong>Document Type:</strong> ${documentType || 'Legal Document'}</p>
                  <p><strong>Document ID:</strong> ${documentId}</p>
                </div>
                <p>You can now view, edit, and download your document from your dashboard.</p>
                <a href="${documentUrl || 'http://localhost:3000/documents'}" class="button">View Document</a>
                <p>The document is saved in your account and you can access it anytime.</p>
              </div>
              <div class="footer">
                <p>Legal AI Platform - Your AI-Powered Legal Assistant</p>
                <p>This is an automated message, please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Your Legal Document is Ready

Hello ${displayName}!

Great news! Your legal document has been successfully generated and is ready for review.

Document Type: ${documentType || 'Legal Document'}
Document ID: ${documentId}

You can now view, edit, and download your document from your dashboard.
View document at: ${documentUrl || 'http://localhost:3000/documents'}

The document is saved in your account and you can access it anytime.

Legal AI Platform - Your AI-Powered Legal Assistant
This is an automated message, please do not reply to this email.
      `,
    };
  }

  /**
   * Document failed email template
   */
  private renderDocumentFailedEmail(data: Record<string, any>): {
    subject: string;
    html: string;
    text: string;
  } {
    const { documentId, documentType, firstName, errorMessage } = data;
    const displayName = firstName || 'User';

    return {
      subject: 'Document Generation Failed',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .error-box { background-color: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠ Document Generation Failed</h1>
              </div>
              <div class="content">
                <h2>Hello ${displayName},</h2>
                <p>We encountered an issue while generating your legal document.</p>
                <div class="error-box">
                  <p><strong>Document Type:</strong> ${documentType || 'Legal Document'}</p>
                  <p><strong>Document ID:</strong> ${documentId}</p>
                  ${errorMessage ? `<p><strong>Error:</strong> ${errorMessage}</p>` : ''}
                </div>
                <p>Our team has been notified and is working to resolve this issue. Please try again in a few minutes, or contact our support team if the problem persists.</p>
                <a href="http://localhost:3000/documents" class="button">Try Again</a>
              </div>
              <div class="footer">
                <p>Legal AI Platform - Your AI-Powered Legal Assistant</p>
                <p>This is an automated message, please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Document Generation Failed

Hello ${displayName},

We encountered an issue while generating your legal document.

Document Type: ${documentType || 'Legal Document'}
Document ID: ${documentId}
${errorMessage ? `Error: ${errorMessage}` : ''}

Our team has been notified and is working to resolve this issue. Please try again in a few minutes, or contact our support team if the problem persists.

Try again at: http://localhost:3000/documents

Legal AI Platform - Your AI-Powered Legal Assistant
This is an automated message, please do not reply to this email.
      `,
    };
  }

  /**
   * System notification email template
   */
  private renderSystemNotificationEmail(data: Record<string, any>): {
    subject: string;
    html: string;
    text: string;
  } {
    const { title, message, firstName, actionUrl, actionText } = data;
    const displayName = firstName || 'User';

    return {
      subject: title || 'System Notification',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${title || 'System Notification'}</h1>
              </div>
              <div class="content">
                <h2>Hello ${displayName},</h2>
                <p>${message || 'You have a new notification from Legal AI Platform.'}</p>
                ${actionUrl ? `<a href="${actionUrl}" class="button">${actionText || 'View Details'}</a>` : ''}
              </div>
              <div class="footer">
                <p>Legal AI Platform - Your AI-Powered Legal Assistant</p>
                <p>This is an automated message, please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
${title || 'System Notification'}

Hello ${displayName},

${message || 'You have a new notification from Legal AI Platform.'}

${actionUrl ? `${actionText || 'View Details'}: ${actionUrl}` : ''}

Legal AI Platform - Your AI-Powered Legal Assistant
This is an automated message, please do not reply to this email.
      `,
    };
  }
}
