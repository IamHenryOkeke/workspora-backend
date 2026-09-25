import { emailTemplate } from "./wrapper";

const ACCENT = "#F49F1E";

export const verifyAccountEmail = (name: string, verifyUrl: string) => {
  const title = "Verify Your Workspora Account";
  const content = `
    <p>Hi ${name},</p>
    <p>Welcome to Workspora! We're glad to have you on board.</p>
    <p>Before you can get started, we just need to confirm that this email address belongs to you. Please verify your account by clicking the button below.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" style="background-color: ${ACCENT}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Account</a>
    </div>
    <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
    <p style="word-break: break-all; font-size: 13px; color: #555;">${verifyUrl}</p>
    <p style="font-size: 13px; color: #888;">This verification link will expire in 24 hours. If it has expired, you can request a new one from the sign-in page.</p>
    <p>Once your account is verified, you'll be able to create and join organizations, manage projects, and start collaborating with your team.</p>
    <p>If you didn't create a Workspora account, you can safely ignore this email.</p>
    <div style="display: grid; margin-top: 30px;">
      <span style="margin-top: 8px;">Warm regards,</span>
      <span style="margin-top: 8px;">Workspora Team</span>
    </div>
  `;
  return emailTemplate(title, content);
};

export const resetPasswordEmail = (name: string, resetUrl: string) => {
  const title = "Reset Your Workspora Password";
  const content = `
    <p>Hi ${name},</p>
    <p>We received a request to reset the password for your Workspora account. Click the button below to choose a new one.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="background-color: ${ACCENT}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
    </div>
    <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
    <p style="word-break: break-all; font-size: 13px; color: #555;">${resetUrl}</p>
    <p style="font-size: 13px; color: #888;">This link will expire in 15 minutes. If it has expired, you can request a new one from the sign-in page.</p>
    <p>If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
    <div style="display: grid; margin-top: 30px;">
      <span style="margin-top: 8px;">Warm regards,</span>
      <span style="margin-top: 8px;">Workspora Team</span>
    </div>
  `;
  return emailTemplate(title, content);
};

export const organizationInvitationEmail = (
  organizationName: string,
  role: string,
  invitationLink: string,
  inviterName?: string,
) => {
  const title = `You've Been Invited to Join ${organizationName}`;
  const content = `
    <p>Hi there,</p>
    <p>${
      inviterName ? `${inviterName} has invited` : "You've been invited"
    } you to join <strong>${organizationName}</strong> on Workspora as a${
      /^[aeiou]/i.test(role) ? "n" : ""
    } <strong>${role.toLowerCase()}</strong>.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${invitationLink}" target="_blank" rel="noopener noreferrer" style="background-color: ${ACCENT}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
    </div>
    <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
    <p style="word-break: break-all; font-size: 13px; color: #555;">${invitationLink}</p>
    <p style="font-size: 13px; color: #888;">This invitation link will expire after a set period. If it has expired, ask an admin at ${organizationName} to send you a new one.</p>
    <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
    <div style="display: grid; margin-top: 30px;">
      <span style="margin-top: 8px;">Warm regards,</span>
      <span style="margin-top: 8px;">Workspora Team</span>
    </div>
  `;
  return emailTemplate(title, content);
};
