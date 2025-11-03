import { NextRequest, NextResponse } from 'next/server';
import { sendViaSMTP } from '@/lib/email';

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, phone, role, teamSize, needs, budget, timeline, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Build a detailed message for sales
    const salesMessage = `
Name: ${name}
Email: ${email}
${company ? `Company: ${company}\n` : ''}${phone ? `Phone: ${phone}\n` : ''}${role ? `Role: ${role}\n` : ''}${teamSize ? `Team Size: ${teamSize}\n` : ''}${needs ? `Primary Needs: ${needs}\n` : ''}${budget ? `Budget Range: ${budget}\n` : ''}${timeline ? `Timeline: ${timeline}\n` : ''}
---
Message:
${message}
    `.trim();

    // Send sales email using new SMTP system
    const to = process.env.SALES_EMAIL || 'sales@offaxisdeals.com';
    const html = `
      <h2>New Sales Inquiry</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      ${company ? `<p><b>Company:</b> ${company}</p>` : ''}
      ${phone ? `<p><b>Phone:</b> ${phone}</p>` : ''}
      ${role ? `<p><b>Role:</b> ${role}</p>` : ''}
      ${teamSize ? `<p><b>Team Size:</b> ${teamSize}</p>` : ''}
      ${needs ? `<p><b>Primary Needs:</b> ${needs}</p>` : ''}
      ${budget ? `<p><b>Budget Range:</b> ${budget}</p>` : ''}
      ${timeline ? `<p><b>Timeline:</b> ${timeline}</p>` : ''}
      <hr>
      <p><b>Message:</b></p>
      <pre>${(message || "").replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s] as string))}</pre>
    `;
    const text = `New Sales Inquiry\n\nName: ${name}\nEmail: ${email}\n${company ? `Company: ${company}\n` : ''}${phone ? `Phone: ${phone}\n` : ''}\n${salesMessage}`;
    
    try {
      await sendViaSMTP({ to, subject: `Sales Inquiry from ${name}`, html, text });
    } catch (emailError) {
      console.error('Error sending sales email:', emailError);
      // Still return success to user, but log the error
    }

    return NextResponse.json({ success: true, message: 'Sales inquiry submitted successfully' });
  } catch (error) {
    console.error('Error processing sales inquiry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
