const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/admin', express.static('admin'));

// قاعدة بيانات بسيطة
let summaries = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// لوحة التحكم - كلمة مرور: admin123
app.post('/api/login', (req, res) => {
  if (req.body.password === 'admin123') {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// جلب الملخصات
app.get('/api/summaries', (req, res) => {
  res.json(summaries);
});

// إضافة/تحديث ملخص
app.post('/api/summaries', (req, res) => {
  const { id, title, content, subject } = req.body;
  if (id) {
    summaries = summaries.map(s => s.id === id ? { ...s, title, content } : s);
  } else {
    summaries.push({ 
      id: Date.now(), 
      title, 
      content, 
      subject,
      date: new Date().toLocaleDateString('ar-DZ')
    });
  }
  fs.writeFileSync('data.json', JSON.stringify(summaries, null, 2));
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
