/**
 * Notifications: har bir foydalanuvchi faqat o‘ziga tegishli bildirishnomalarni ko‘radi (userId bo‘yicha).
 *
 * Bildirishnoma QACHON yaratilishi kerak (keyingi qadamda boshqa modullardan Notification.create qo‘shish):
 * - Leave request yuborilganda → manager/HR ga (icon: user)
 * - Check-in/attendance muammo yoki xabar → HR/admin (icon: alert)
 * - Job uchun ariza (candidate applied) → HR/recruiter (icon: briefcase)
 * - Parol yangilanganda → shu user ga (icon: lock)
 * - Yangi ta’til qo‘shilganda → barcha xodimlar yoki ma’lum rollar (icon: briefcase)
 * - Payroll bajarilganda → HR yoki barcha xodimlar (icon: lock)
 * - Feedback/so‘rovnoma to‘ldirilganda → admin/HR (icon: user)
 *
 * Yaratishda userId majburiy: faqat shu user ro‘yxatida ko‘rinadi.
 */
const { Op } = require("sequelize");
const { Notification } = require("../models/relations");
const { sendNotificationEmailIfEnabled } = require("../utils/notificationEmail");
const { resolveAvatarUrl } = require("../utils/avatarUrl");

const baseUrl = () => process.env.API_BASE_URL || process.env.BACKEND_URL || "";

/**
 * Bildirishnoma yaratadi va agar foydalanuvchi Email Notifications yoqilgan bo'lsa email yuboradi.
 * Boshqa modullardan (leaves, jobs, payroll, ...) shu funksiyani chaqiring.
 *
 * @param {string} userId - Foydalanuvchi id
 * @param {{ title: string; message: string; icon?: 'user'|'briefcase'|'lock'|'alert' }} payload
 */
async function createNotificationWithEmail(userId, { title, message, icon = null }) {
  if (!userId || !title || !message) return null;
  const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const notif = await Notification.create({
    userId,
    title,
    message,
    time,
    icon: icon || null,
  });
  await sendNotificationEmailIfEnabled(userId, { title, message });
  return notif;
}

exports.createNotificationWithEmail = createNotificationWithEmail;

exports.list = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const search = (req.query.search || "").toString().trim().toLowerCase();
    const where = search
      ? {
          [Op.and]: [
            { userId },
            {
              [Op.or]: [
                { title: { [Op.iLike]: `%${search}%` } },
                { message: { [Op.iLike]: `%${search}%` } },
                { time: { [Op.iLike]: `%${search}%` } },
              ],
            },
          ],
        }
      : { userId };
    const rows = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 100,
    });
    const items = rows.map((r) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      time: r.time || "Just Now",
      avatarUrl: resolveAvatarUrl(baseUrl(), r.avatarUrl),
      icon: r.icon || null,
    }));
    return res.status(200).json(items);
  } catch (error) {
    console.error("notifications.list error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
