import { NextRequest, NextResponse } from 'next/server';
import { sendSalesEmail } from '@/lib/email';

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

    // Send sales email
    const emailSent = await sendSalesEmail(name, email, company, salesMessage);

    if (!emailSent) {
      console.error('Failed to send sales email');
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
