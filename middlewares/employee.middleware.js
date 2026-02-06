const exploreeParse = (req, res, next) => {
  try {
    const fields = ['stepOne', 'stepTwo', 'stepThree', 'stepFour'];
    fields.forEach((field) => {
      if (req.body[field]) {
        try {
          // Agar string bo'lsa parse qilamiz, aks holda o'zini qoldiramiz
          req.body[field] = typeof req.body[field] === 'string' 
            ? JSON.parse(req.body[field]) 
            : req.body[field];
        } catch (error) {
          console.error(`Error parsing ${field}:`, error.message);
          return res.status(400).json({
            message: `Noto‘g‘ri JSON formati: ${field}`,
            error: error.message,
            receivedValue: req.body[field] // Qabul qilingan qiymatni ko'rish uchun
          });
        }
      }
    });
    
    next();
  } catch (error) {
    console.error('exploreeParse xatosi:', error.message);
    res.status(500).json({
      message: 'Server xatosi: so‘rovni parse qilishda xato',
      error: error.message,
    });
  }
};

module.exports = { exploreeParse };