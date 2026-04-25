// filepath: lib/email.ts
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Helper 1: For System Alerts (Feedback/Bugs) - Sent to all Admins/Managers
async function getAdminEmails() {
  try {
    const admins = await prisma.user.findMany({
      where: { 
        systemRoles: { hasSome: ['Administrator', 'Manager'] } 
      },
      select: { email: true }
    });
    
    const emails = admins.map(a => a.email).filter(Boolean) as string[];
    if (emails.length === 0) emails.push('cbriell1@yahoo.com');
    return emails;
  } catch (error) {
    return ['cbriell1@yahoo.com'];
  }
}

// Helper 2: For Shift Reports - Only sent to those who have the toggle "On"
async function getReportRecipientEmails() {
  try {
    const recipients = await prisma.user.findMany({
      where: { 
        systemRoles: { hasSome: ['Administrator', 'Manager'] },
        receiveReportEmails: true // NEW: Filter by personal preference
      },
      select: { email: true }
    });
    
    const emails = recipients.map(a => a.email).filter(Boolean) as string[];
    // If everyone turned it off, fallback to your main address so reports aren't lost
    if (emails.length === 0) emails.push('cbriell1@yahoo.com');
    return emails;
  } catch (error) {
    return ['cbriell1@yahoo.com'];
  }
}

export async function sendNewFeedbackEmail(feedback: any, user: any) {
  if (!resend) return;
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
  if (!resend) return;
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

export async function sendFeedbackCommentEmail(feedback: any, comment: string, sender: any) {
  if (!resend) return;
  const emails = await getAdminEmails();
  if (emails.length === 0) return;

  await resend.emails.send({
    from: 'ShiftSync <onboarding@resend.dev>',
    to: emails,
    subject: `💬 New Comment on Feedback: ${feedback.title || 'Ticket #' + feedback.id}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h3>New Comment from ${sender?.name || 'Unknown'}</h3>
        <blockquote style="background: #f4f4f5; padding: 15px; border-left: 5px solid #3b82f6; border-radius: 4px;">
          ${comment}
        </blockquote>
        <p><strong>Original Ticket:</strong> ${feedback.description}</p>
        <br/>
        <p>View this discussion in the ShiftSync Feedback tab.</p>
      </div>
    `
  });
}

export async function sendNewMessageEmail(message: any, sender: any) {
  if (!resend) return;
  
  let recipientEmails: string[] = [];

  if (message.isGlobal) {
    // Notify all Admins/Managers for global messages
    recipientEmails = await getAdminEmails();
  } else if (message.targetUserIds && message.targetUserIds.length > 0) {
    // Notify specific recipients if they are Managers/Admins
    const recipients = await prisma.user.findMany({
      where: { 
        id: { in: message.targetUserIds },
        systemRoles: { hasSome: ['Administrator', 'Manager'] }
      },
      select: { email: true }
    });
    recipientEmails = recipients.map(r => r.email).filter(Boolean) as string[];
  }

  if (recipientEmails.length === 0) return;

  await resend.emails.send({
    from: 'ShiftSync Messages <onboarding@resend.dev>',
    to: recipientEmails,
    subject: `📩 New Message from ${sender?.name || 'Staff'}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="margin-top: 0;">Internal Message Received</h3>
        <p><strong>From:</strong> ${sender?.name || 'Unknown'}</p>
        <div style="background: #eff6ff; padding: 15px; border-radius: 6px; color: #1e40af;">
          ${message.content}
        </div>
        <br/>
        <p style="font-size: 12px; color: #64748b;">Log in to the Messages tab to reply.</p>
      </div>
    `
  });
}

export async function sendChatNotificationEmail(message: any, sender: any, recipients: string[]) {
  if (!resend || recipients.length === 0) return;

  await resend.emails.send({
    from: 'ShiftSync Chat <onboarding@resend.dev>',
    to: recipients,
    subject: `💬 New Team Message from ${sender.name}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="color: #0f172a; margin-top: 0;">New Message in ShiftSync</h3>
        <p><strong>${sender.name}</strong> just posted a new message to the team.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #facc15; margin: 20px 0;">
          <p style="margin: 0; color: #334155; font-style: italic;">"${message.content}"</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">
          This message was sent because you have <strong>Chat Email Alerts</strong> enabled in your profile.<br/>
          Log in to <a href="https://picklesandplay-shiftsync.vercel.app">ShiftSync</a> to reply.
        </p>
      </div>
    `
  });
}

export async function sendManagerLoginAlert(manager: any) {
  if (!resend) return;
  const emails = await getAdminEmails();
  if (emails.length === 0) return;

  await resend.emails.send({
    from: 'ShiftSync Security <onboarding@resend.dev>',
    to: emails,
    subject: `🔐 Security Alert: Manager Login - ${manager.name}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="color: #0f172a; margin-top: 0;">Security Notification</h3>
        <p>A user with <strong>Manager/Admin</strong> privileges has just logged into the system.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p><strong>User:</strong> ${manager.name}</p>
        <p><strong>Email:</strong> ${manager.email}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST</p>
        <br/>
        <p style="font-size: 12px; color: #64748b;">If this was not expected, please review the audit logs in ShiftSync.</p>
      </div>
    `
  });
}

export async function sendShiftReportEmail(checklist: any, timeCard: any, location: any, user: any) {
  if (!resend) return;
  
  // Use the specific helper that respects personal preferences
  const emails = await getReportRecipientEmails();
  if (emails.length === 0) return;

  const timeIn = timeCard?.clockIn ? new Date(timeCard.clockIn).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Unknown';
  const timeOut = timeCard?.clockOut ? new Date(timeCard.clockOut).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Not Clocked Out Yet';

  await resend.emails.send({
    from: 'ShiftSync Reports <onboarding@resend.dev>',
    to: emails,
    subject: `📋 Shift Report: ${user?.name || 'Staff'} @ ${location?.name || 'Facility'}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Shift Summary Report</h2>
        <p style="color: #475569; font-size: 14px;"><strong>Staff Member:</strong> ${user?.name || 'Unknown'}</p>
        <p style="color: #475569; font-size: 14px;"><strong>Facility:</strong> ${location?.name || 'Unknown'}</p>
        <p style="color: #475569; font-size: 14px;"><strong>Shift Time:</strong> ${timeIn} &rarr; ${timeOut}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <h3 style="color: #16a34a; margin-bottom: 5px;">✅ Completed Tasks (${checklist.completedTasks?.length || 0})</h3>
        <ul style="color: #334155; font-size: 14px; padding-left: 20px; margin-top: 0;">
          ${checklist.completedTasks?.length > 0 ? checklist.completedTasks.map((t: string) => `<li>${t}</li>`).join('') : '<li><i>No tasks checked off.</i></li>'}
        </ul>
        <h3 style="color: #dc2626; margin-bottom: 5px; margin-top: 20px;">❌ Missed Tasks (${checklist.missedTasks?.length || 0})</h3>
        <ul style="color: #334155; font-size: 14px; padding-left: 20px; margin-top: 0;">
          ${checklist.missedTasks?.length > 0 ? checklist.missedTasks.map((t: string) => `<li>${t}</li>`).join('') : '<li><i>No assigned tasks were missed.</i></li>'}
        </ul>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <h3 style="color: #0f172a; margin-bottom: 5px;">📝 Shift Notes</h3>
        <blockquote style="background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 0; color: #334155; white-space: pre-wrap;">
          ${checklist.notes || '<i>No notes provided by staff.</i>'}
        </blockquote>
        <h3 style="color: #0f172a; margin-bottom: 5px; margin-top: 20px;">⚠️ Leftover from Previous Shift</h3>
        <blockquote style="background: #fdf2f8; padding: 15px; border-left: 4px solid #ec4899; border-radius: 4px; margin: 0; color: #334155; white-space: pre-wrap;">
          ${checklist.previousShiftNotes || '<i>No issues reported from previous shift.</i>'}
        </blockquote>
        <br/>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
          This is an automated message from ShiftSync.<br/>
          To stop receiving these, change your email settings in the Staff tab.
        </p>
      </div>
    `
  });
}