const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ إعدادات أساسية
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '.')));

// ✅ Middleware للصفحات العربية
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});

// ✅ الصفحات الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ✅ API للبيانات (مثال)
app.get('/api/subjects', (req, res) => {
    // في الإصدار الحقيقي، هنا نقرأ من قاعدة بيانات حقيقية
    const subjects = [
        { id: 1, name: 'فلسفة', description: 'ملخصات ومراجعات لمادة الفلسفة' },
        { id: 2, name: 'أدب عربي', description: 'ملخصات لمادة الأدب العربي' },
        { id: 3, name: 'تاريخ', description: 'مراجعات وملخصات التاريخ' },
        { id: 4, name: 'جغرافيا', description: 'ملخصات مادة الجغرافيا' },
        { id: 5, name: 'علوم إسلامية', description: 'مراجعات للعلوم الإسلامية' },
        { id: 6, name: 'لغة فرنسية', description: 'ملخصات اللغة الفرنسية' }
    ];
    res.json(subjects);
});

app.get('/api/files/:subjectId', (req, res) => {
    const subjectId = parseInt(req.params.subjectId);
    // بيانات مثال للملفات
    const files = {
        1: [
            { id: 1, name: 'ملخص الفلسفة اليونانية.pdf', url: '#', date: '2024-01-15' },
            { id: 2, name: 'أسئلة فلسفة مع الحلول.docx', url: '#', date: '2024-01-20' }
        ],
        2: [
            { id: 3, name: 'ملخص الشعر الجاهلي.pdf', url: '#', date: '2024-01-10' }
        ],
        3: [
            { id: 4, name: 'تاريخ العالم الإسلامي.pdf', url: '#', date: '2024-01-05' }
        ]
    };
    
    res.json(files[subjectId] || []);
});

// ✅ API للإحصائيات
app.get('/api/stats', (req, res) => {
    res.json({
        users: 150,
        subjects: 6,
        files: 25
    });
});

// ✅ صفحة 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// ✅ بدء الخادم
app.listen(PORT, () => {
    console.log(`✅ الخادم يعمل على http://localhost:${PORT}`);
    console.log(`🌐 البيئة: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
