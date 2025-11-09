import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { moment } = body;

    if (!moment) {
      return NextResponse.json(
        { error: 'Moment data is required' },
        { status: 400 }
      );
    }

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Escape HTML in description to prevent XSS
    const escapeHtml = (text: string) => {
      const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    const momentDescription = moment.description || 'No description available';
    const momentTitle = moment.title || 'New Key Moment';
    const formattedTime = formatTime(moment.time);

    // Create text version for better deliverability
    const textVersion = `🎬 Key Moment Detected!

Time: ${formattedTime}
Title: ${momentTitle}

${momentDescription}

---
This key moment was shared from HypeX - your real-time sports hype engine.`;

    // Note: When using onboarding@resend.dev (testing mode), you can only send to your verified email
    // To send to other recipients, you need to verify a domain at resend.com/domains
    const { data, error } = await resend.emails.send({
      from: 'HypeX <onboarding@resend.dev>',
      to: ['graceshao203@gmail.com', 'grandhisiri.tanmay@yahoo.com'],
      subject: `🎬 Key Moment: ${momentTitle}`,
      text: textVersion,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #9333ea; margin-bottom: 20px; font-size: 24px;">🎬 Key Moment Detected!</h2>
          
          <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #9333ea;">
            <div style="margin-bottom: 16px;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>Time:</strong> <span style="color: #1f2937; font-weight: 600;">${formattedTime}</span></p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Title:</strong> <span style="color: #1f2937; font-weight: 600;">${escapeHtml(momentTitle)}</span></p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Key Moment Message:</p>
              <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(momentDescription)}</p>
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            This key moment was shared from <strong style="color: #9333ea;">HypeX</strong> - your real-time sports hype engine.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      
      // Provide user-friendly error message for domain verification requirement
      if (error.message && error.message.includes('verify a domain')) {
        return NextResponse.json(
          { 
            error: 'Domain verification required', 
            message: 'To send emails to other recipients, please verify a domain at resend.com/domains and update the from address.',
            details: error 
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, messageId: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

