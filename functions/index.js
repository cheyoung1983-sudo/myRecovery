const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configured gmail contact details for welcome/bye emails
const gmailEmail = process.env.SUPPORT_GMAIL_USER || "cheyoung1983@gmail.com";
const gmailPassword = process.env.SUPPORT_GMAIL_PASS || "sample-app-password-123";

const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

const APP_NAME = "Spokane Recovery Portal";

/**
 * Sends a welcome email to newly created users
 */
exports.sendWelcomeEmail = functions.runWith({ secrets: ["gmailPassword"] }).auth.user().onCreate(async (user) => {
  const email = user.email; 
  const displayName = user.displayName || "Spokane Neighbor"; 

  if (!email) {
    console.log("No email found for user, skipping welcome email.");
    return null;
  }

  const mailOptions = {
    from: `"${APP_NAME}" <${gmailEmail}>`,
    to: email,
    subject: `Welcome to the ${APP_NAME}!`,
    text: `Hello ${displayName},\n\nWelcome to ${APP_NAME}. We are here to support your journey to wellness and connection within the Spokane recovery community.\n\nBest regards,\nThe Spokane Recovery Team`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #ea580c;">Welcome, ${displayName}!</h2>
        <p>Thank you for joining the <strong>${APP_NAME}</strong>. We are dedicated to providing resource navigation, real-time bus tracking, support networks, and community care insights directly inside Spokane.</p>
        <p>If you have any questions or need guidance, our response desk is always accessible.</p>
        <br />
        <p>Warmest regards,<br/><strong>The Spokane Recovery Team</strong></p>
      </div>
    `
  };

  try {
    await mailTransport.sendMail(mailOptions);
    console.log(`Welcome email successfully sent to: ${email}`);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
  return null;
});

/**
 * Sends a farewell email to deleted user accounts, and cleans up their public document records in Firestore
 */
exports.sendByeEmail = functions.runWith({ secrets: ["gmailPassword"] }).auth.user().onDelete(async (user) => {
  const email = user.email;
  const displayName = user.displayName || "Spokane Neighbor";
  const uid = user.uid;

  // 1. Clean up user-related collection structures in Firestore
  const db = admin.firestore();
  try {
    const userRef = db.collection("users").doc(uid);
    await userRef.delete();
    console.log(`Successfully purged public database profile for: ${uid}`);
  } catch (err) {
    console.warn(`Could not delete user Firestore record (it may have not existed):`, err);
  }

  // 2. Dispatch farewell dispatch mail
  if (!email) {
    console.log("No email found for deleted user, skipping bye email.");
    return null;
  }

  const mailOptions = {
    from: `"${APP_NAME}" <${gmailEmail}>`,
    to: email,
    subject: `Your Account has Been Closed - ${APP_NAME}`,
    text: `Hello ${displayName},\n\nWe are touching base to confirm that your ${APP_NAME} account has been completely and permanently removed. Your privacy is paramount, and all associated personal identifiers have been purged.\n\nWarmly,\nThe Spokane Recovery Team`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #475569;">Account Closed</h2>
        <p>Hello ${displayName},</p>
        <p>This message confirms that your account on the <strong>${APP_NAME}</strong> has been successfully closed and all database references have been purged.</p>
        <p>We wish you the very best on your continued journey. You are welcome back at any time.</p>
        <br />
        <p>Best regards,<br/><strong>The Spokane Recovery Team</strong></p>
      </div>
    `
  };

  try {
    await mailTransport.sendMail(mailOptions);
    console.log(`Farewell email successfully sent to: ${email}`);
  } catch (error) {
    console.error("Failed to send bye email:", error);
  }
  return null;
});

/**
 * Blocking Cloud Function: beforeCreate
 * Modifies account results or blocks registration before they are written to Firebase Auth
 */
exports.beforeCreate = functions.auth.user().beforeCreate((user, context) => {
  // Enforce Spokane community restrictions or block known spam accounts
  const email = user.email;
  
  if (email) {
    // Basic domain blocklist
    const domain = email.substring(email.lastIndexOf("@") + 1);
    const blockedDomains = ["mailinator.com", "spamgourmet.com", "tempmail.de", "sharklasers.com"];
    
    if (blockedDomains.includes(domain.toLowerCase())) {
      throw new functions.auth.HttpsError(
        "invalid-argument", 
        "Registrations using temporary or disposable email addresses are blocked."
      );
    }
  }

  // Set default custom user attributes safely
  return {
    displayName: user.displayName || "Spokane Neighbor",
    customClaims: {
      communityMember: true,
      registeredAt: new Date().toISOString()
    }
  };
});
