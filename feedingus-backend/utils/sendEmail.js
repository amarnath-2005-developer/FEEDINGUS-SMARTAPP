const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
  let transporter;

  // If you provided Gmail credentials in .env, it uses them.
  // Otherwise, it automatically creates a fake "Ethereal" testing account!
  if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  } else {
    // Generate a temporary testing account automatically
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
  }

  // Define email options
  const mailOptions = {
    from: process.env.GMAIL_EMAIL ? `FeedingUs <${process.env.GMAIL_EMAIL}>` : '"FeedingUs Local" <test@feedingus.local>',
    to: options.email,
    subject: options.subject,
    text: options.text,
    html: options.html, 
  }

  // Send the email
  const info = await transporter.sendMail(mailOptions)

  // If using the testing account, print the link to the console so you can read the OTP!
  if (!process.env.GMAIL_EMAIL) {
    console.log('----------------------------------------')
    console.log(`✉️  MOCK EMAIL SENT TO: ${options.email}`)
    console.log(`🔗 Click here to view the OTP: ${nodemailer.getTestMessageUrl(info)}`)
    console.log('----------------------------------------')
  }
}

module.exports = sendEmail
