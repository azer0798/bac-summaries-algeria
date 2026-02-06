// المتغيرات العامة
let currentSubjectId = null;
let allSubjects = [];

// تهيئة الموقع
document.addEventListener('DOMContentLoaded', async () => {
    await database.init();
    await loadSubjects();
    await updateStatistics();
    setupEventListeners();
    
    // التحقق مما إذا كان المستخدم مسؤولاً
    checkAdminStatus();
});

// تحميل المواد
async function loadSubjects() {
    try {
        const container = document.getElementById('subjects-container');
        if (!container) return;

        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>جاري تحميل المواد...</p>
            </div>
        `;

        allSubjects = await database.getAllSubjects();
        
        if (allSubjects.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-book-open"></i>
                    <h3>لا توجد مواد حالياً</h3>
                    <p>سيتم إضافة المواد قريباً</p>
                </div>
            `;
            return;
        }

        let html = '';
        for (const subject of allSubjects) {
            const files = await database.getFilesBySubject(subject.id);
            
            html += `
                <div class="subject-card" data-id="${subject.id}">
                    <i class="fas fa-book"></i>
                    <h3>${subject.name}</h3>
                    <p>${subject.description || 'ملخصات ومراجعات'}</p>
                    <div class="file-count">
                        <i class="fas fa-file-alt"></i> ${files.length} ملف
                    </div>
                    <button class="view-btn" onclick="viewSubject(${subject.id})">
                        <i class="fas fa-eye"></i> عرض الملفات
                    </button>
                </div>
            `;
        }

        container.innerHTML = html;
        await updateStatistics();
    } catch (error) {
        console.error('خطأ في تحميل المواد:', error);
        showMessage('حدث خطأ في تحميل المواد', 'error');
    }
}

// عرض مادة معينة
async function viewSubject(subjectId) {
    try {
        currentSubjectId = subjectId;
        const subject = await database.getSubjectById(subjectId);
        
        if (!subject) {
            showMessage('المادة غير موجودة', 'error');
            return;
        }

        // إخفاء قسم المواد وإظهار التفاصيل
        document.getElementById('subjects').style.display = 'none';
        document.getElementById('help').style.display = 'none';
        document.getElementById('subject-details').style.display = 'block';
        
        // تحديث العنوان
        document.getElementById('subject-title').innerHTML = `
            <i class="fas fa-book"></i> ${subject.name}
            <span style="font-size: 1rem; color: #7f8c8d; margin-right: 10px;">
                - ${subject.description || 'ملخصات ومراجعات'}
            </span>
        `;

        // تحميل الملفات
        const files = await database.getFilesBySubject(subjectId);
        const container = document.getElementById('files-container');
        
        if (files.length === 0) {
            container.innerHTML = `
                <div class="no-files">
                    <i class="fas fa-folder-open"></i>
                    <h3>لا توجد ملفات لهذه المادة بعد</h3>
                    <p>سيتم إضافة الملفات قريباً</p>
                </div>
            `;
            return;
        }

        let html = '';
        for (const file of files) {
            const fileIcon = getFileIcon(file.file_name);
            
            html += `
                <div class="file-card">
                    <div class="file-icon">
                        <i class="${fileIcon}"></i>
                    </div>
                    <div class="file-info">
                        <h4>${file.file_name}</h4>
                        <p>تم الرفع: ${file.upload_date || 'غير معروف'}</p>
                    </div>
                    <button class="download-btn" onclick="downloadFile('${file.file_url}', '${file.file_name}')">
                        <i class="fas fa-download"></i> تحميل
                    </button>
                </div>
            `;
        }

        container.innerHTML = html;
        
        // التمرير للأعلى
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('خطأ في عرض المادة:', error);
        showMessage('حدث خطأ في عرض المادة', 'error');
    }
}

// العودة لقائمة المواد
function backToSubjects() {
    document.getElementById('subjects').style.display = 'block';
    document.getElementById('help').style.display = 'block';
    document.getElementById('subject-details').style.display = 'none';
    
    // التمرير لقسم المواد
    document.getElementById('subjects').scrollIntoView({ behavior: 'smooth' });
}

// البحث في المواد
function searchSubjects() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const cards = document.querySelectorAll('.subject-card');
    
    cards.forEach(card => {
        const subjectName = card.querySelector('h3').textContent.toLowerCase();
        if (subjectName.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// تحديث الإحصائيات
async function updateStatistics() {
    try {
        const stats = await database.getStatistics();
        
        document.getElementById('user-count').textContent = stats.userCount;
        document.getElementById('subject-count').textContent = stats.subjectCount;
        document.getElementById('file-count').textContent = stats.fileCount;
    } catch (error) {
        console.error('خطأ في تحديث الإحصائيات:', error);
    }
}

// تحميل الملف (نموذجي - يمكن تخصيصه)
function downloadFile(url, fileName) {
    if (url === '#') {
        showMessage('رابط التحميل غير متوفر حالياً', 'info');
        return;
    }
    
    // في الحقيقية، هذا سيكون رابط تحميل حقيقي
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage(`جاري تحميل: ${fileName}`, 'success');
}

// الحصول على أيقونة الملف حسب النوع
function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    
    switch(ext) {
        case 'pdf':
            return 'fas fa-file-pdf';
        case 'doc':
        case 'docx':
            return 'fas fa-file-word';
        case 'xls':
        case 'xlsx':
            return 'fas fa-file-excel';
        case 'ppt':
        case 'pptx':
            return 'fas fa-file-powerpoint';
        case 'zip':
        case 'rar':
            return 'fas fa-file-archive';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return 'fas fa-file-image';
        default:
            return 'fas fa-file';
    }
}

// عرض رسالة
function showMessage(text, type = 'success') {
    const toast = document.getElementById('message-toast');
    toast.textContent = text;
    toast.className = 'toast';
    
    if (type === 'error') {
        toast.classList.add('error');
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// تبديل قائمة الأسئلة الشائعة
function toggleFaq(button) {
    const faqItem = button.parentElement;
    faqItem.classList.toggle('active');
}

// تبديل القائمة في الهاتف
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('show');
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // البحث عند الضغط على Enter
    document.getElementById('search-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchSubjects();
        }
    });
    
    // تحديث نشاط المستخدم عند التفاعل
    document.addEventListener('click', updateUserActivity);
    
    // إغلاق القائمة عند النقر خارجها (للأجهزة المحمولة)
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-links') && !e.target.closest('.menu-btn')) {
            document.querySelector('.nav-links')?.classList.remove('show');
        }
    });
}

// التحقق من حالة المسؤول
function checkAdminStatus() {
    const userId = localStorage.getItem('user_id');
    const adminLink = document.getElementById('admin-link');
    
    if (userId == 5795991022) {
        adminLink.style.display = 'flex';
    } else {
        adminLink.style.display = 'none';
    }
}

// دالة للتحول بين الصفحات
function navigateTo(page) {
    window.location.href = page;
}

// تصدير الدوال للاستخدام في console
window.database = database;
window.loadSubjects = loadSubjects;
window.viewSubject = viewSubject;
window.backToSubjects = backToSubjects;
window.searchSubjects = searchSubjects;
window.downloadFile = downloadFile;
