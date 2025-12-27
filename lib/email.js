import nodemailer from "nodemailer";

export async function sendOtpEmail(to, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"SkillMatch" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP Code - SkillMatch",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
  });

  console.log("📩 OTP sent:", otp);
}

export async function sendQueryNotificationEmail(to, queryDetails) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { queryId, title, description, skills, creatorName } = queryDetails;

  // Construct the direct link to the query
  const queryLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://skillmatch.devlooper.co.in'}/query/${queryId}`;

  const emailText = `
Hello!

You have received a new query on SkillMatch that matches your skills!

Query Title: ${title}

Description: ${description}

Skills Needed: ${skills.join(", ")}

Posted by: ${creatorName}

Click the link below to view and answer this query:
${queryLink}

Best regards,
SkillMatch Team
  `.trim();

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
      <h2 style="color: #1f2937; margin-bottom: 20px;">New Query Received!</h2>
      
      <p style="color: #4b5563; margin-bottom: 16px;">
        You have received a new query on SkillMatch that matches your skills!
      </p>
      
      <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="color: #111827; margin-bottom: 12px;">${title}</h3>
        <p style="color: #6b7280; margin-bottom: 16px;">${description}</p>
        
        <div style="margin-bottom: 12px;">
          <strong style="color: #374151;">Skills Needed:</strong>
          <div style="margin-top: 8px;">
            ${skills.map(skill => `<span style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 16px; margin-right: 8px; margin-bottom: 8px; font-size: 14px;">${skill}</span>`).join('')}
          </div>
        </div>
        
        <p style="color: #6b7280; margin-bottom: 0;">
          <strong style="color: #374151;">Posted by:</strong> ${creatorName}
        </p>
      </div>
      
      <a href="${queryLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-bottom: 16px;">
        View Query & Answer
      </a>
      
      <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">
        Best regards,<br/>
        SkillMatch Team
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"SkillMatch" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New Query: ${title} - SkillMatch`,
    text: emailText,
    html: emailHtml,
  });

  console.log("📩 Query notification sent to:", to);
}
