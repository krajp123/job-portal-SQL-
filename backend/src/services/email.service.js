const nodemailer = require('nodemailer');

const { EMAIL_USER, EMAIL_APP_PASSWORD } = process.env;

let transporter = null;
if (EMAIL_USER && EMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_APP_PASSWORD, // Gmail App Password, NOT your normal Gmail password
    },
  });
  // Email service initialized
} else {
  console.warn('⚠️ Email is not configured (EMAIL_USER / EMAIL_APP_PASSWORD missing). Emails are logged, not sent.');
  console.warn('   EMAIL_USER:', EMAIL_USER);
  console.warn('   EMAIL_APP_PASSWORD:', EMAIL_APP_PASSWORD ? '***set***' : '***NOT SET***');
}

// ---------------------------------------------------------------------------
// BRAND / DESIGN SYSTEM
// Table-based layout + inline CSS on purpose — Outlook, Gmail app, and most
// corporate mail clients strip <style> blocks and ignore flexbox/grid, so
// inline styles + <table> are what actually render consistently everywhere.
// ---------------------------------------------------------------------------
const BRAND = {
  name: 'Career Route Portal',
  tagline: 'Professional Recruitment Solutions',
  navy: '#132A4C',       // header / headings
  blue: '#2E5FE0',       // accent / links / buttons
  blueDark: '#234ABD',   // button hover-equivalent (borders)
  bg: '#F3F5F9',         // page background
  card: '#FFFFFF',
  border: '#E3E7EF',
  text: '#1E2430',
  textMuted: '#5B6270',
  success: '#1E8E5A',
  successBg: '#E9F7EF',
  danger: '#B3261E',
  dangerBg: '#FBEAEA',
  amberBg: '#FFF6E5',
  amberBorder: '#F3C969',
};

function todayLong() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Shared HTML shell used by every email in this file.
 * @param {Object} opts
 * @param {string} opts.preheader - hidden inbox preview text
 * @param {string} opts.eyebrow - small label above the title (e.g. "APPLICATION UPDATE")
 * @param {string} opts.title - main heading
 * @param {string} opts.contentHtml - inner body HTML (paragraphs, detail cards, etc.)
 * @param {string} [opts.ctaText] - optional button text
 * @param {string} [opts.ctaUrl] - optional button link
 * @param {string} [opts.accentColor] - header accent bar color (defaults to brand blue)
 */
function renderLayout({ preheader = '', eyebrow = '', title = '', contentHtml = '', ctaText = '', ctaUrl = '', accentColor = BRAND.blue }) {
  const year = new Date().getFullYear();

  const ctaBlock = ctaText && ctaUrl ? `
    <tr>
      <td align="center" style="padding: 8px 40px 4px 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" bgcolor="${BRAND.blue}" style="border-radius: 8px;">
              <a href="${ctaUrl}" target="_blank"
                style="display:inline-block; padding:14px 30px; font-family:Arial,Helvetica,sans-serif;
                       font-size:15px; font-weight:bold; color:#FFFFFF; text-decoration:none; border-radius:8px;">
                ${ctaText}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:${BRAND.bg}; font-family: Arial, Helvetica, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px; width:100%; background-color:${BRAND.card}; border-radius:12px; overflow:hidden; border:1px solid ${BRAND.border};">

          <!-- Accent bar -->
          <tr><td height="4" bgcolor="${accentColor}" style="line-height:4px; font-size:4px;">&nbsp;</td></tr>

          <!-- Header / brand -->
          <tr>
            <td style="padding: 28px 40px 20px 40px;">
              <p style="margin:0; font-size:18px; font-weight:bold; color:${BRAND.navy}; letter-spacing:0.2px;">${BRAND.name}</p>
              <p style="margin:2px 0 0 0; font-size:12px; color:${BRAND.textMuted};">${BRAND.tagline}</p>
            </td>
          </tr>

          <tr><td style="padding:0 40px;"><hr style="border:none; border-top:1px solid ${BRAND.border}; margin:0;" /></td></tr>

          <!-- Eyebrow + Title -->
          <tr>
            <td style="padding: 24px 40px 0 40px;">
              ${eyebrow ? `<p style="margin:0 0 8px 0; font-size:11px; font-weight:bold; letter-spacing:1px; color:${accentColor}; text-transform:uppercase;">${eyebrow}</p>` : ''}
              <h1 style="margin:0; font-size:21px; line-height:1.35; color:${BRAND.navy};">${title}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 14px 40px 0 40px; font-size:14.5px; line-height:1.7; color:${BRAND.text};">
              ${contentHtml}
            </td>
          </tr>

          ${ctaBlock}

          <tr><td style="padding:28px 40px 0 40px;"><hr style="border:none; border-top:1px solid ${BRAND.border}; margin:0;" /></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 40px 32px 40px; font-size:12px; line-height:1.6; color:${BRAND.textMuted}; text-align:center;">
              This is an automated message from ${BRAND.name}. Please do not reply directly to this email.<br/>
              &copy; ${year} ${BRAND.name}. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Renders a clean two-column "detail card" (Position, Company, Date, etc.)
 * @param {Array<[string, string]>} rows
 */
function detailCard(rows) {
  const rowsHtml = rows
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => `
      <tr>
        <td style="padding:8px 0; font-size:13px; color:${BRAND.textMuted}; width:130px; vertical-align:top;">${label}</td>
        <td style="padding:8px 0; font-size:14px; color:${BRAND.text}; font-weight:bold; vertical-align:top;">${value}</td>
      </tr>`).join('');

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"
      style="width:100%; margin:18px 0; background-color:${BRAND.bg}; border:1px solid ${BRAND.border}; border-radius:8px; padding:6px 18px;">
      ${rowsHtml}
    </table>`;
}

function calloutBox(html, { bg = BRAND.amberBg, border = BRAND.amberBorder } = {}) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; margin:18px 0;">
      <tr>
        <td style="background-color:${bg}; border:1px solid ${border}; border-radius:8px; padding:14px 18px; font-size:13.5px; color:${BRAND.text};">
          ${html}
        </td>
      </tr>
    </table>`;
}

async function sendEmail({ to, subject, body, html }) {
  if (!transporter) {
    // Email transporter not configured
    return { sent: false, to, subject };
  }

  const mailOptions = {
    from: `"${BRAND.name}" <${EMAIL_USER}>`,
    to,
    subject,
  };

  // Support both HTML and plain text
  if (html) {
    mailOptions.html = html;
    mailOptions.text = body; // Fallback plain text
  } else {
    mailOptions.text = body;
  }

  await transporter.sendMail(mailOptions);

  return { sent: true, to, subject };
}

/**
 * Send OTP verification email to candidate
 */
async function sendOtpEmail(candidateEmail, otp, type = 'email') {
  try {
    if (!candidateEmail) {
      console.error('❌ OTP email - Missing candidateEmail');
      return { sent: false, error: 'Missing candidate email' };
    }

    if (!transporter) {
      console.warn(`⚠️ Transporter not initialized. Would send OTP email to ${candidateEmail} with code: ${otp}`);
      return { sent: false, error: 'Email service not configured' };
    }

    const contentHtml = `
      <p style="margin:0 0 14px 0;">Hello,</p>
      <p style="margin:0 0 4px 0;">Thank you for registering with ${BRAND.name}. To complete your ${type} verification, please use the code below:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;">
        <tr>
          <td align="center" style="background-color:${BRAND.bg}; border:1px dashed ${BRAND.blue}; border-radius:10px; padding:20px;">
            <p style="margin:0 0 6px 0; font-size:12px; color:${BRAND.textMuted}; text-transform:uppercase; letter-spacing:1px;">Verification Code</p>
            <p style="margin:0; font-size:32px; font-weight:bold; letter-spacing:6px; color:${BRAND.navy}; font-family:'Courier New', monospace;">${otp}</p>
          </td>
        </tr>
      </table>
      ${calloutBox(`This code expires in <strong>5 minutes</strong>. Never share it with anyone, including ${BRAND.name} staff.`)}
      <p style="margin:14px 0 0 0; color:${BRAND.textMuted}; font-size:13.5px;">If you did not request this, you can safely ignore this email.</p>
    `;

    const htmlContent = renderLayout({
      preheader: `Your ${type} verification code is ${otp}`,
      eyebrow: 'Account Verification',
      title: `Verify your ${type}`,
      contentHtml,
    });

    await transporter.sendMail({
      from: `"${BRAND.name}" <${EMAIL_USER}>`,
      to: candidateEmail,
      subject: `${otp} is your ${BRAND.name} verification code`,
      html: htmlContent,
      text: `${BRAND.name} - ${type} Verification\n\nHello,\n\nThank you for registering with ${BRAND.name}. Your verification code is: ${otp}\n\nThis code is valid for 5 minutes. Do not share this code with anyone. If you did not request this verification, please ignore this email.\n\n${BRAND.name} Registration Team`,
    });

    // OTP email sent
    return { sent: true };
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${candidateEmail}:`, error.message);
    return { sent: false, error: error.message };
  }
}

async function sendPasswordResetLinkEmail(candidateEmail, resetToken, candidateName = 'Candidate') {
  try {
    if (!candidateEmail) {
      console.error('❌ Password reset email - Missing candidateEmail');
      return { sent: false, error: 'Missing candidate email' };
    }

    if (!resetToken) {
      console.error('❌ Password reset email - Missing reset token');
      return { sent: false, error: 'Missing reset token' };
    }

    const frontendBaseUrl = process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendBaseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(candidateEmail)}`;

    if (!transporter) {
      console.warn(`⚠️ Transporter not initialized. Would send password reset link to ${candidateEmail}: ${resetUrl}`);
      return { sent: false, error: 'Email service not configured' };
    }

    const contentHtml = `
      <p style="margin:0 0 14px 0;">Dear ${candidateName},</p>
      <p style="margin:0;">We received a request to reset the password for your ${BRAND.name} account. Click the button below to choose a new password. This link is valid for <strong>15 minutes</strong>.</p>
      <p style="margin:20px 0 0 0; font-size:12.5px; color:${BRAND.textMuted}; word-break:break-all;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color:${BRAND.blue};">${resetUrl}</a>
      </p>
      ${calloutBox(`If you didn't request this, no action is needed — your password will remain unchanged.`)}
    `;

    const htmlContent = renderLayout({
      preheader: 'Reset your Career Route Portal password',
      eyebrow: 'Security',
      title: 'Reset your password',
      contentHtml,
      ctaText: 'Reset My Password',
      ctaUrl: resetUrl,
    });

    await transporter.sendMail({
      from: `"${BRAND.name}" <${EMAIL_USER}>`,
      to: candidateEmail,
      subject: `Reset your ${BRAND.name} password`,
      html: htmlContent,
      text: `${BRAND.name} - Password Reset Request\n\nDear ${candidateName},\n\nWe received a request to reset the password for your ${BRAND.name} account. Use this link to reset your password: ${resetUrl}\n\nThis link is valid for 15 minutes. If you did not request this reset, please ignore this email.\n\n${BRAND.name} Team`,
    });

    // Password reset email sent
    return { sent: true };
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${candidateEmail}:`, error.message);
    return { sent: false, error: error.message };
  }
}

async function sendCandidateAccountStatusEmail(candidateEmail, candidateName, status, reason = '') {
  try {
    if (!candidateEmail) {
      console.error('❌ Account status email - Missing candidateEmail');
      return { sent: false, error: 'Missing candidate email' };
    }

    if (!transporter) {
      console.warn(`⚠️ Transporter not initialized. Would send account status email to ${candidateEmail}`);
      return { sent: false, error: 'Email service not configured' };
    }

    const name = candidateName || 'Candidate';
    let htmlContent, emailSubject, textContent;

    if (status === 'active') {
      const contentHtml = `
        <p style="margin:0 0 14px 0;">Dear ${name},</p>
        <p style="margin:0;">We're pleased to let you know that your ${BRAND.name} account has been <strong>reactivated</strong> and is now fully accessible. You can log back in and continue your job search right away.</p>
        <p style="margin:16px 0 0 0; color:${BRAND.textMuted}; font-size:13.5px;">Need help getting started again? Just reach out to our support team.</p>
      `;
      htmlContent = renderLayout({
        preheader: 'Your account has been reactivated',
        eyebrow: 'Account Update',
        title: 'Your account is active again',
        contentHtml,
        accentColor: BRAND.success,
      });
      emailSubject = `Your ${BRAND.name} account has been reactivated`;
      textContent = `${BRAND.name} - Account Reactivated\n\nDear ${name},\n\nWe're pleased to let you know that your ${BRAND.name} account has been reactivated and is now fully accessible. You can log in and resume your job search.\n\n${BRAND.name} Support Team`;
    } else {
      const cleanStatus = status === 'banned' ? 'Banned' : 'Suspended';
      const contentHtml = `
        <p style="margin:0 0 14px 0;">Dear ${name},</p>
        <p style="margin:0;">We're writing to inform you that your ${BRAND.name} account has been <strong>${cleanStatus.toLowerCase()}</strong>, effective immediately, in accordance with our Terms of Service and Community Guidelines.</p>
        <p style="margin:14px 0 0 0;">If you believe this was a mistake, please contact our support team — we're happy to review your case.</p>
      `;
      htmlContent = renderLayout({
        preheader: `Your account has been ${cleanStatus.toLowerCase()}`,
        eyebrow: 'Account Update',
        title: `Account ${cleanStatus}`,
        contentHtml,
        accentColor: BRAND.danger,
      });
      emailSubject = `Your ${BRAND.name} account has been ${cleanStatus.toLowerCase()}`;
      textContent = `${BRAND.name} - Account ${cleanStatus}\n\nDear ${name},\n\nWe're writing to inform you that your ${BRAND.name} account has been ${cleanStatus.toLowerCase()}.\n\nIf you believe this was a mistake, please contact our support team.\n\n${BRAND.name} Compliance & Support Team`;
    }

    await transporter.sendMail({
      from: `"${BRAND.name}" <${EMAIL_USER}>`,
      to: candidateEmail,
      subject: emailSubject,
      html: htmlContent,
      text: textContent,
    });

    // Account status email sent
    return { sent: true };
  } catch (error) {
    console.error(`❌ Failed to send account status email to ${candidateEmail}:`, error.message);
    return { sent: false, error: error.message };
  }
}

async function sendShortlistEmail(candidateEmail, candidateName, jobTitle, recruiterName, companyName) {
  try {
    if (!candidateEmail) {
      console.error('❌ Shortlist email - Missing candidateEmail');
      return { sent: false, error: 'Missing candidate email' };
    }
    if (!jobTitle) {
      console.error('❌ Shortlist email - Missing jobTitle');
      return { sent: false, error: 'Missing job title' };
    }

    if (!transporter) {
      console.warn(`⚠️ Transporter not initialized. Would send shortlist email to ${candidateEmail}`);
      return { sent: false, error: 'Email service not configured' };
    }

    const contentHtml = `
      <p style="margin:0 0 14px 0;">Dear ${candidateName},</p>
      <p style="margin:0;">Great news — your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> has been shortlisted for the next stage of the hiring process.</p>
      ${detailCard([
        ['Position', jobTitle],
        ['Company', companyName],
        ['Recruiter', recruiterName],
      ])}
      <p style="margin:0;">The hiring team will be in touch shortly with next steps. Keep an eye on your email and phone for updates.</p>
    `;

    const htmlContent = renderLayout({
      preheader: `You've been shortlisted for ${jobTitle} at ${companyName}`,
      eyebrow: 'Application Update',
      title: "You've been shortlisted 🎉",
      contentHtml,
      accentColor: BRAND.success,
    });

    await transporter.sendMail({
      from: `"${companyName} Recruitment" <${EMAIL_USER}>`,
      to: candidateEmail,
      subject: `You've been shortlisted for ${jobTitle} at ${companyName}`,
      html: htmlContent,
      text: `Dear ${candidateName},\n\nGreat news — your application for the ${jobTitle} position at ${companyName} has been shortlisted for the next stage of the hiring process.\n\nPosition: ${jobTitle}\nCompany: ${companyName}\nRecruiter: ${recruiterName}\n\nThe hiring team will be in touch shortly with next steps.\n\nRegards,\n${recruiterName}\nHuman Resources\n${companyName}`,
    });

    // Shortlist email sent
    return { sent: true };
  } catch (error) {
    console.error(`❌ Failed to send shortlist email to ${candidateEmail}:`, error.message);
    return { sent: false, error: error.message };
  }
}

/**
 * Send interview scheduling email to candidate
 */
async function sendInterviewScheduleEmail(candidateEmail, candidateName, jobTitle, recruiterName, companyName, interviewDate, interviewTime, interviewMode = 'online', interviewLink = '', interviewAddress = '') {
  try {
    if (!candidateEmail) {
      console.error('❌ Interview email - Missing candidateEmail');
      return { sent: false, error: 'Missing candidate email' };
    }
    if (!jobTitle) {
      console.error('❌ Interview email - Missing jobTitle');
      return { sent: false, error: 'Missing job title' };
    }

    if (!transporter) {
      console.warn(`⚠️ Transporter not initialized. Would send interview email to ${candidateEmail}`);
      return { sent: false, error: 'Email service not configured' };
    }

    const formatDate = (date) => {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(date).toLocaleDateString('en-US', options);
    };

    const contentHtml = `
      <p style="margin:0 0 14px 0;">Dear ${candidateName},</p>
      <p style="margin:0;">Your interview for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> has been scheduled. Details below:</p>
      ${detailCard([
        ['Position', jobTitle],
        ['Company', companyName],
        ['Interviewer', recruiterName],
        ['Date', formatDate(interviewDate)],
        ['Time', interviewTime],
        ['Format', interviewMode === 'offline' ? 'Offline' : 'Online'],
        ...(interviewMode === 'offline'
          ? [['Address', interviewAddress]]
          : [['Meeting link', `<a href="${interviewLink}">${interviewLink}</a>`]]),
      ])}
      ${calloutBox(interviewMode === 'offline' ? 'Please arrive a few minutes early and carry a valid photo ID.' : 'Please join a few minutes early using the meeting link above. To reschedule, let us know at least 24 hours in advance.')}
      <p style="margin:0;">Come prepared to discuss your experience, technical skills, and interest in the role. Please keep a valid photo ID and a copy of your resume handy.</p>
    `;

    const htmlContent = renderLayout({
      preheader: `Interview scheduled for ${jobTitle} at ${companyName}`,
      eyebrow: 'Interview Scheduled',
      title: 'Your interview is confirmed',
      contentHtml,
    });

    await transporter.sendMail({
      from: `"${companyName} Recruitment" <${EMAIL_USER}>`,
      to: candidateEmail,
      subject: `Interview Scheduled — ${jobTitle} at ${companyName}`,
      html: htmlContent,
      text: `Dear ${candidateName},\n\nYour interview for the ${jobTitle} position at ${companyName} has been scheduled.\n\nPosition: ${jobTitle}\nCompany: ${companyName}\nInterviewer: ${recruiterName}\nDate: ${formatDate(interviewDate)}\nTime: ${interviewTime}\nFormat: ${interviewMode === 'offline' ? 'Offline' : 'Online'}\n${interviewMode === 'offline' ? `Address: ${interviewAddress}` : `Meeting link: ${interviewLink}`}\n\n${interviewMode === 'offline' ? 'Please arrive a few minutes early and carry a valid photo ID.' : 'Please join a few minutes early using the meeting link above.'} To reschedule, please inform us at least 24 hours prior.\n\nRegards,\n${recruiterName}\nHuman Resources\n${companyName}`,
    });

    // Interview schedule email sent
    return { sent: true };
  } catch (error) {
    console.error(`❌ Failed to send interview schedule email to ${candidateEmail}:`, error.message);
    return { sent: false, error: error.message };
  }
}

/**
 * Send offer email to candidate with attached offer letter
 */
async function sendOfferEmail(candidateEmail, candidateName, jobTitle, recruiterName, companyName, file) {
  try {
    if (!file) {
      throw new Error('No offer letter file provided');
    }

    const contentHtml = `
      <p style="margin:0 0 14px 0;">Dear ${candidateName},</p>
      <p style="margin:0;">Congratulations! Following your interview(s) with us, we're delighted to extend an offer of employment for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
      ${detailCard([
        ['Position', jobTitle],
        ['Company', companyName],
        ['Recruiter', recruiterName],
        ['Attachment', file.originalname],
      ])}
      <p style="margin:0;">Your formal offer letter, with complete terms and conditions, is attached to this email. Please review it carefully and share your acceptance or any questions at your earliest convenience.</p>
      <p style="margin:16px 0 0 0;">We look forward to welcoming you to ${companyName}.</p>
    `;

    const htmlContent = renderLayout({
      preheader: `You have an offer from ${companyName} for ${jobTitle}`,
      eyebrow: 'Offer of Employment',
      title: "Congratulations — you've got an offer! 🎊",
      contentHtml,
      accentColor: BRAND.success,
    });

    if (!transporter) {
      console.warn(`⚠️ Transporter not initialized. Would send offer letter email to ${candidateEmail} with attachment ${file.originalname}`);
      return { sent: false, error: 'Email service not configured' };
    }

    await transporter.sendMail({
      from: `"${companyName} Recruitment" <${EMAIL_USER}>`,
      to: candidateEmail,
      subject: `Offer of Employment — ${jobTitle} at ${companyName}`,
      html: htmlContent,
      text: `Dear ${candidateName},\n\nCongratulations! Following your interview(s) with us, we're delighted to extend an offer of employment for the ${jobTitle} position at ${companyName}. Your formal offer letter is attached to this email.\n\nRegards,\n${recruiterName}\nHuman Resources\n${companyName}`,
      attachments: [
        {
          filename: file.originalname,
          content: file.buffer,
          contentType: file.mimetype,
        },
      ],
    });

    // Offer email sent
    return { sent: true };
  } catch (error) {
    console.error(`❌ Failed to send offer email to ${candidateEmail}:`, error.message);
    return { sent: false, error: error.message };
  }
}

/**
 * Send rejection email to candidate
 */
async function sendRejectionEmail(candidateEmail, candidateName, jobTitle, recruiterName, companyName) {
  try {
    if (!candidateEmail) {
      console.error('❌ Rejection email - Missing candidateEmail');
      return { sent: false, error: 'Missing candidate email' };
    }
    if (!jobTitle) {
      console.error('❌ Rejection email - Missing jobTitle');
      return { sent: false, error: 'Missing job title' };
    }

    if (!transporter) {
      console.warn(`⚠️ Transporter not initialized. Would send rejection email to ${candidateEmail}`);
      return { sent: false, error: 'Email service not configured' };
    }

    const contentHtml = `
      <p style="margin:0 0 14px 0;">Dear ${candidateName},</p>
      <p style="margin:0;">Thank you for applying for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>, and for the time you invested in our selection process.</p>
      ${detailCard([
        ['Position', jobTitle],
        ['Company', companyName],
      ])}
      <p style="margin:0;">After careful consideration, we've decided to move forward with other candidates for this particular role. This decision reflects the strength of the candidate pool and not your skills or potential.</p>
      <p style="margin:14px 0 0 0;">We'll keep your profile on file and encourage you to apply for future openings that match your experience. We wish you the very best in your career ahead.</p>
    `;

    const htmlContent = renderLayout({
      preheader: `Update on your application for ${jobTitle} at ${companyName}`,
      eyebrow: 'Application Update',
      title: 'Application status update',
      contentHtml,
      accentColor: BRAND.textMuted,
    });

    await transporter.sendMail({
      from: `"${companyName} Recruitment" <${EMAIL_USER}>`,
      to: candidateEmail,
      subject: `Application Update — ${jobTitle} at ${companyName}`,
      html: htmlContent,
      text: `Dear ${candidateName},\n\nThank you for applying for the ${jobTitle} position at ${companyName}. After careful consideration, we've decided to move forward with other candidates for this role. We'll keep your profile on file and encourage you to apply for future openings.\n\nRegards,\n${recruiterName}\nHuman Resources\n${companyName}`,
    });

    // Rejection email sent
    return { sent: true };
  } catch (error) {
    console.error(`❌ Failed to send rejection email to ${candidateEmail}:`, error.message);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendPasswordResetLinkEmail,
  sendCandidateAccountStatusEmail,
  sendShortlistEmail,
  sendInterviewScheduleEmail,
  sendOfferEmail,
  sendRejectionEmail,
};