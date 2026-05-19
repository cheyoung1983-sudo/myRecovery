import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Automatically triggers SOS alerts when a crisis flag is detected in a chat message.
 * This ensures that even if the client-side broadcast fails, the server handles it.
 */
export const onCrisisMessage = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();

    if (!message.isCrisis) return null;

    const { chatId } = context.params;
    const chatDoc = await admin.firestore().collection("chats").doc(chatId).get();
    const chatData = chatDoc.data();

    if (!chatData) return null;

    // Notify the recipient (mentor or user)
    const recipientUid = message.senderId === chatData.userId
      ? chatData.mentorUserId
      : chatData.userId;

    const recipientDoc = await admin.firestore().collection("users").doc(recipientUid).get();
    const recipientData = recipientDoc.data();

    if (recipientData?.fcmToken) {
      const payload = {
        notification: {
          title: "🆘 CRISIS ALERT",
          body: `An urgent message was sent: "${message.text.substring(0, 100)}..."`,
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
        data: {
          chatId: chatId,
          type: "crisis_alert"
        }
      };

      try {
        await admin.messaging().send({
          token: recipientData.fcmToken,
          ...payload
        });
        console.log(`SOS Alert sent to ${recipientUid}`);
      } catch (error) {
        console.error("Error sending SOS notification:", error);
      }
    }

    return null;
  });

/**
 * Syncs custom claims whenever a user's role is updated in Firestore.
 * This is the ultimate "Production Security" step.
 */
export const onUserRoleUpdate = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData.role !== oldData.role) {
      const { userId } = context.params;
      try {
        await admin.auth().setCustomUserClaims(userId, { role: newData.role });
        console.log(`Custom claim '${newData.role}' synced for user ${userId}`);
      } catch (error) {
        console.error("Error syncing custom claims:", error);
      }
    }
  });

/**
 * Scheduled Cleanup: Deletes chat messages and mood logs older than 90 days
 * to protect user privacy and minimize data liability.
 * Runs every day at midnight.
 */
export const scheduledCleanup = functions.pubsub
  .schedule("0 0 * * *")
  .onRun(async (context) => {
    const ninetyDaysAgo = admin.firestore.Timestamp.now().toMillis() - (90 * 24 * 60 * 60 * 1000);
    const cutoffDate = admin.firestore.Timestamp.fromMillis(ninetyDaysAgo);

    const db = admin.firestore();
    const batchSize = 500;

    // 1. Cleanup old messages across all chats
    const oldMessagesQuery = db.collectionGroup("messages")
      .where("timestamp", "<", cutoffDate)
      .limit(batchSize);

    const deleteQueryResults = async (query: admin.firestore.Query) => {
      const snapshot = await query.get();
      if (snapshot.empty) return 0;

      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      return snapshot.size;
    };

    let deletedMessages = 0;
    let lastDeleted = 0;
    do {
      lastDeleted = await deleteQueryResults(oldMessagesQuery);
      deletedMessages += lastDeleted;
    } while (lastDeleted === batchSize);

    // 2. Cleanup old mood logs
    const oldMoodLogsQuery = db.collectionGroup("moodLogs")
      .where("timestamp", "<", cutoffDate)
      .limit(batchSize);

    let deletedMoodLogs = 0;
    do {
      lastDeleted = await deleteQueryResults(oldMoodLogsQuery);
      deletedMoodLogs += lastDeleted;
    } while (lastDeleted === batchSize);

    console.log(`Cleanup complete. Deleted ${deletedMessages} messages and ${deletedMoodLogs} mood logs.`);
    return null;
  });

