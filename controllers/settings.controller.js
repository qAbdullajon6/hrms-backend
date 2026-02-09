const { Settings } = require("../models/relations");

const WORK_HOURS_KEY = "workHours";
const DEFAULT_WORK_HOURS = { startTime: "09:00", endTime: "18:00" };

async function getWorkHoursValue() {
  const row = await Settings.findOne({ where: { key: WORK_HOURS_KEY } });
  if (!row || !row.value) return { startTime: "09:00", endTime: "18:00" };
  const v = row.value;
  return { startTime: v.startTime || "09:00", endTime: v.endTime || "18:00" };
}
exports.getWorkHoursValue = getWorkHoursValue;

exports.getWorkHours = async (req, res) => {
  try {
    const workHours = await getWorkHoursValue();
    return res.status(200).json(workHours);
  } catch (error) {
    console.error("getWorkHours error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateWorkHours = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    if (!startTime || !endTime) {
      return res.status(400).json({ message: "startTime and endTime are required (e.g. '09:00', '18:00')" });
    }
    const start = String(startTime).trim();
    const end = String(endTime).trim();
    if (!/^\d{1,2}:\d{2}$/.test(start) || !/^\d{1,2}:\d{2}$/.test(end)) {
      return res.status(400).json({ message: "Invalid time format. Use HH:MM (e.g. 09:00)" });
    }
    const [row] = await Settings.findOrCreate({
      where: { key: WORK_HOURS_KEY },
      defaults: { value: DEFAULT_WORK_HOURS },
    });
    row.value = { startTime: start, endTime: end };
    await row.save();
    return res.status(200).json(row.value);
  } catch (error) {
    console.error("updateWorkHours error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
