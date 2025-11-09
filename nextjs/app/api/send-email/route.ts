import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Hardcoded email mapping for users
const USER_EMAILS: Record<string, string> = {
  'Alex, Ryan, Maya': 'varadhad@msu.edu',
  'The football BROS': 'varadhad@msu.edu',
  'Sports Fanatics': 'varadhad@msu.edu',
  'Olivia': 'varadhad@msu.edu',
  'Noah': 'varadhad@msu.edu',
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, message } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      );
    }

    // Get email from mapping
    const recipientEmail = USER_EMAILS[to];
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const data = await resend.emails.send({
      from: 'HypeZone <onboarding@resend.dev>',
      to: recipientEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">Message from HypeZone</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6;">${message}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Sent from HypeZone Sports Platform</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
