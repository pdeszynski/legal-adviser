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
      case EmailTemplateType.DEMO_REQUEST_CONFIRMATION:
        return this.renderDemoRequestConfirmationEmail(data);
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

  /**
   * Demo request confirmation email template
   * Sent to users who submit demo requests
   */
  private renderDemoRequestConfirmationEmail(data: Record<string, any>): {
    subject: string;
    html: string;
    text: string;
  } {
    const { firstName, email, company, referenceId, qualified, timeline } =
      data;
    const displayName = firstName || email?.split('@')[0] || 'there';
    const frontendUrl = data.frontendUrl || 'http://localhost:3000';

    // Timeline message based on qualification
    const timelineMessage = this.getTimelineMessage(timeline, qualified);
    const responseTime = qualified ? '24 hours' : '1-2 business days';

    return {
      subject: 'Thank You for Your Demo Request - Legal AI Platform',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 30px 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .info-box { background-color: white; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 4px; }
              .section-title { color: #1e40af; font-size: 18px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; }
              .link-list { list-style: none; padding: 0; }
              .link-list li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
              .link-list li:last-child { border-bottom: none; }
              .link-list a { color: #2563eb; text-decoration: none; font-weight: 500; }
              .link-list a:hover { text-decoration: underline; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
              .social-links { margin-top: 15px; }
              .social-links a { margin: 0 10px; color: #6b7280; text-decoration: none; }
              .reference-box { background-color: #eff6ff; padding: 12px; border-radius: 4px; font-size: 13px; color: #1e40af; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thank You for Your Interest!</h1>
              </div>
              <div class="content">
                <h2>Hi ${displayName},</h2>
                <p>Thank you for requesting a demo of Legal AI Platform. We're excited to show you how our AI-powered solution can transform your legal workflow.</p>

                <div class="info-box">
                  <p><strong>Your Reference ID:</strong> ${referenceId}</p>
                  <p><strong>Company:</strong> ${company}</p>
                  <p><strong>Email:</strong> ${email}</p>
                </div>

                <div class="section-title">What Happens Next?</div>
                <p>${timelineMessage}</p>
                <ul style="line-height: 1.8;">
                  <li><strong>Review:</strong> Our team is reviewing your request and requirements</li>
                  <li><strong>Contact:</strong> We'll reach out within <strong>${responseTime}</strong> to schedule your personalized demo</li>
                  <li><strong>Demo:</strong> See our platform in action with your specific use cases</li>
                  <li><strong>Follow-up:</strong> Receive answers to all your questions and discuss next steps</li>
                </ul>

                <div class="section-title">Learn More While You Wait</div>
                <p>Explore our resources to learn more about Legal AI Platform:</p>
                <ul class="link-list">
                  <li><a href="${frontendUrl}/docs">📚 Documentation</a> - Comprehensive guides and API references</li>
                  <li><a href="${frontendUrl}/blog">📝 Blog</a> - Latest updates, tips, and industry insights</li>
                  <li><a href="${frontendUrl}/pricing">💰 Pricing</a> - Transparent pricing plans for all team sizes</li>
                  <li><a href="${frontendUrl}/contact">📞 Contact Us</a> - Need immediate assistance? Get in touch</li>
                </ul>

                <div class="section-title">Join Our Community</div>
                <p>Stay connected with us on social media for product updates and legal tech insights:</p>
                <p class="social-links">
                  <a href="https://twitter.com/legalai">Twitter</a> •
                  <a href="https://linkedin.com/company/legalai">LinkedIn</a> •
                  <a href="https://github.com/legalai">GitHub</a>
                </p>

                <div class="reference-box">
                  <strong>Reference ID:</strong> ${referenceId}<br>
                  Please keep this for your records. If you need to contact us about this request, please mention this ID.
                </div>
              </div>
              <div class="footer">
                <p>Legal AI Platform - Your AI-Powered Legal Assistant</p>
                <p>This is an automated message, please do not reply to this email.</p>
                <p style="margin-top: 10px;">
                  <a href="${frontendUrl}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #6b7280;">Unsubscribe from marketing emails</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Thank You for Your Demo Request!

Hi ${displayName},

Thank you for requesting a demo of Legal AI Platform. We're excited to show you how our AI-powered solution can transform your legal workflow.

YOUR REFERENCE ID: ${referenceId}
Company: ${company}
Email: ${email}

WHAT HAPPENS NEXT?

${timelineMessage}

- Review: Our team is reviewing your request and requirements
- Contact: We'll reach out within ${responseTime} to schedule your personalized demo
- Demo: See our platform in action with your specific use cases
- Follow-up: Receive answers to all your questions and discuss next steps

LEARN MORE WHILE YOU WAIT

Explore our resources to learn more about Legal AI Platform:

- Documentation: ${frontendUrl}/docs
- Blog: ${frontendUrl}/blog
- Pricing: ${frontendUrl}/pricing
- Contact: ${frontendUrl}/contact

JOIN OUR COMMUNITY

Stay connected with us on social media:
- Twitter: https://twitter.com/legalai
- LinkedIn: https://linkedin.com/company/legalai
- GitHub: https://github.com/legalai

REFERENCE ID: ${referenceId}
Please keep this for your records. If you need to contact us about this request, please mention this ID.

To unsubscribe from marketing emails: ${frontendUrl}/unsubscribe?email=${encodeURIComponent(email)}

Legal AI Platform - Your AI-Powered Legal Assistant
This is an automated message, please do not reply to this email.
      `,
    };
  }

  /**
   * Get timeline message based on user's timeline preference and qualification status
   */
  private getTimelineMessage(timeline: string, qualified: boolean): string {
    const timelineMessages: Record<string, string> = {
      ASAP: qualified
        ? 'We see you need a solution quickly. Our team will prioritize your request and contact you within 24 hours to expedite the demo process.'
        : 'We understand the urgency. Our team will contact you within 24 hours to discuss your immediate needs.',
      WITHIN_WEEK:
        "Great! We'll follow up within the next business day to schedule a demo at your convenience.",
      WITHIN_MONTH:
        "Perfect timing! We'll reach out shortly to arrange a comprehensive demo that fits your schedule.",
      WITHIN_QUARTER:
        "Thank you for planning ahead. We'll contact you to set up a demo when you're ready to explore our platform.",
      EXPLORING:
        "Thanks for your interest! We'll be in touch to provide more information and answer any questions you may have.",
    };

    return timelineMessages[timeline] || timelineMessages.EXPLORING;
  }
}
