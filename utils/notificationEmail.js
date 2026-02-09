const { User } = require("../models/relations");
const { sendEmail } = require("./sendEmail");

/**
 * Agar foydalanuvchi "Email Notifications" yoqilgan bo'lsa, unga bildirishnoma mavzusi va matnini
 * email orqali yuboradi. Tizimda Notification yaratilganda shu funksiyani chaqiring.
 *
 * @param {string} userId - User id (Notifications jadvalidagi userId)
 * @param {{ title: string; message: string }} payload - Bildirishnoma sarlavhasi va matni
 */
async function sendNotificationEmailIfEnabled(userId, { title, message }) {
  if (!userId) return;
  try {
    const user = await User.findByPk(userId, { attributes: ["id", "email", "emailNotificationsEnabled"] });
    if (!user || !user.emailNotificationsEnabled || !user.email) return;
    const to = user.email.trim();
    if (!to) return;
    await sendEmail({
      to,
      subject: title || "HRMS – Yangi bildirishnoma",
      text: message || "",
      html: message ? message.replace(/\n/g, "<br>") : "",
    });
  } catch (err) {
    console.error("[sendNotificationEmailIfEnabled] error:", err);
  }
}

module.exports = { sendNotificationEmailIfEnabled };
