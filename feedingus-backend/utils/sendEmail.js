const sgMail = require('@sendgrid/mail')
const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
  // ─── OPTION 1: SendGrid (Best for Render Free Tier) ─────────────────────────
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
      to: options.email,
      from: process.env.GMAIL_EMAIL || 'noreply@feedingus.com', // Verified Sender in SendGrid
      subject: options.subject,
      text: options.text,
      html: options.html || `<p>${options.text}</p>`,
    }
    try {
      await sgMail.send(msg)
      console.log('✉️  Email sent via SendGrid')
      return
    } catch (err) {
      console.error('❌ SendGrid Error:', err.response?.body || err.message)
      // Fallback to Nodemailer if SendGrid fails
    }
  }

  // ─── OPTION 2: Nodemailer (Local / Testing / Fallback) ──────────────────────
  let transporter;
  if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  } else {
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
  }

  const mailOptions = {
    from: `FeedingUs <${process.env.GMAIL_EMAIL || 'test@feedingus.local'}>`,
    to: options.email,
    subject: options.subject,
    text: options.text,
    html: options.html,
  }

  const info = await transporter.sendMail(mailOptions)
  if (!process.env.GMAIL_EMAIL) {
    console.log(`✉️  MOCK EMAIL: ${nodemailer.getTestMessageUrl(info)}`)
  }
}

module.exports = sendEmail
