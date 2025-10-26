// app/api/contact-sales/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email notification to sales team
    const emailContent = `
New Enterprise Sales Inquiry

Contact Information:
- Name: ${formData.name}
- Email: ${formData.email}
- Phone: ${formData.phone || 'Not provided'}
- Company: ${formData.company || 'Not provided'}

Requirements:
- Role: ${formData.role}
- Team Size: ${formData.teamSize || 'Not specified'}
- Primary Needs: ${formData.needs || 'Not specified'}
- Budget Range: ${formData.budget || 'Not specified'}
- Timeline: ${formData.timeline || 'Not specified'}

Additional Message:
${formData.message || 'No additional message provided'}

---
This inquiry was submitted through the Off Axis Deals contact sales form.
    `;

    // In a real implementation, you would send this email using a service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Nodemailer with SMTP
    
    // For now, we'll just log it and return success
    console.log('Sales inquiry received:', emailContent);

    // TODO: Implement actual email sending
    // await sendEmail({
    //   to: process.env.SALES_EMAIL || 'sales@offaxisdeals.com',
    //   subject: 'New Enterprise Sales Inquiry',
    //   text: emailContent,
    //   html: emailContent.replace(/\n/g, '<br>')
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing contact sales form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
