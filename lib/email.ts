import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

// Only initialize Resend if the API key exists (prevents crashes if missing)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Helper function to dynamically find Administrator emails
async function getAdminEmails() {
  try {
    const admins = await prisma.user.findMany({
      where: { systemRoles: { has: 'Administrator' } },
      select: { email: true }
    });
    
    const emails = admins.map(a => a.email).filter(Boolean) as string[];
    
    // Fallback emergency admin email if none are found in the DB
    if (emails.length === 0) {
      emails.push('cbriell1@yahoo.com');
    }
    
    return emails;
  } catch (error) {
    return ['cbriell1@yahoo.com'];
  }
}

export async function sendNewFeedbackEmail(feedback: any, user: any) {
  if (!resend) {
    console.warn("No RESEND_API_KEY found. Skipping email.");
    return;
  }
  
  const emails = await getAdminEmails();
  if (emails.length === 0) return;

  await resend.emails.send({
    from: 'ShiftSync <onboarding@resend.dev>',
    to: emails,
    subject: `🚨 New ${feedback.type}: ShiftSync Feedback`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>New ${feedback.type} Submitted</h2>
        <p><strong>From:</strong> ${user?.name || 'Unknown User'}</p>
        <p><strong>Description:</strong></p>
        <blockquote style="background: #f4f4f5; padding: 15px; border-left: 5px solid #a855f7; border-radius: 4px;">
          ${feedback.description}
        </blockquote>
        <br/>
        <p>Log in to ShiftSync to view and manage this ticket.</p>
      </div>
    `
  });
}

export async function sendFeedbackUpdateEmail(feedback: any) {
  if (!resend) {
    console.warn("No RESEND_API_KEY found. Skipping email.");
    return;
  }

  const emails = await getAdminEmails();
  if (emails.length === 0) return;

  await resend.emails.send({
    from: 'ShiftSync <onboarding@resend.dev>',
    to: emails,
    subject: `✅ Update on ${feedback.type} Ticket`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Feedback Ticket Updated</h2>
        <p><strong>Current Status:</strong> <span style="background: #fef08a; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${feedback.status}</span></p>
        <p><strong>Developer Notes:</strong></p>
        <blockquote style="background: #f4f4f5; padding: 15px; border-left: 5px solid #3b82f6; border-radius: 4px;">
          ${feedback.devNotes || 'No notes provided.'}
        </blockquote>
        <br/>
        <p><strong>Original Description:</strong> ${feedback.description}</p>
      </div>
    `
  });
}