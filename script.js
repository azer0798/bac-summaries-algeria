// ============== إعدادات ==============
const API_BASE = window.location.origin;
let currentSubjectId = null;
let allSubjects = [];

// ============== تهيئة التطبيق ==============
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 بدء تحميل التطبيق...');
    
    try {
        // محاولة الاتصال بالخادم أولاً
        await checkServerConnection();
        
        // إذا كان الخادم يعمل، استخدم API
        const serverConnected = await loadSubjectsFromAPI();
        
        if (!serverConnected) {
            console.log('⚠️ الخادم غير متصل، استخدام قاعدة البيانات المحلية');
            await initializeLocalDB();
        }
        
        await updateStatistics();
        setupEventListeners();
        checkAdminStatus();
        
        console.log('✅ تم تحميل التطبيق بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تحميل التطبيق:', error);
        showMessage('حدث خطأ في تحميل التطبيق. جاري استخدام النسخة المحلية...', 'error');
        
        // استخدام النسخة المحلية كاحتياطي
        await initializeLocalDB();
    }
});

// ============== دوال الاتصال بالخادم ==============
async function checkServerConnection() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });
        return response.ok;
    } catch (error) {
        console.log('⚠️ لا يمكن الاتصال بالخادم:', error.message);
        return false;
    }
}

async function loadSubjectsFromAPI() {
    try {
        const response = await fetch(`${API_BASE}/api/subjects`);
        if (!response.ok) throw new Error('فشل جلب البيانات');
        
        allSubjects = await response.json();
        renderSubjects(allSubjects);
        return true;
    } catch (error) {
        return false;
    }
}

async function loadFilesFromAPI(subjectId) {
    try {
        const response = await fetch(`${API_BASE}/api/files/${subjectId}`);
        if (!response.ok) throw new Error('فشل جلب الملفات');
        return await response.json();
    } catch (error) {
        return [];
    }
}

// ============== دوال قاعدة البيانات المحلية ==============
async function initializeLocalDB() {
    try {
        await database.init();
        allSubjects = await database.getAllSubjects();
        renderSubjects(allSubjects);
    } catch (error) {
        console.error('❌ خطأ في قاعدة البيانات المحلية:', error);
        showMessage('لا يمكن تحميل البيانات. حاول تحديث الصفحة.', 'error');
    }
}

// ============== دوال العرض ==============
function renderSubjects(subjects) {
    const container = document.getElementById('subjects-container');
    if (!container) return;

    if (subjects.length === 0) {
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
    subjects.forEach(subject => {
        html += `
            <div class="subject-card" data-id="${subject.id}" 
                 style="border-left: 5px solid ${subject.color || '#4CAF50'}">
                <i class="${subject.icon || 'fas fa-book'}"></i>
                <h3>${subject.name}</h3>
                <p>${subject.description || 'ملخصات ومراجعات'}</p>
                <div class="subject-meta">
                    <span class="file-count">
                        <i class="fas fa-file-alt"></i> 
                        <span id="file-count-${subject.id}">0</span> ملف
                    </span>
                    <span class="subject-date">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(subject.created_at)}
                    </span>
                </div>
                <button class="view-btn" onclick="viewSubject(${subject.id})">
                    <i class="fas fa-eye"></i> عرض الملفات
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
    
    // تحديث عدد الملفات لكل مادة
    subjects.forEach(async subject => {
        const files = await (database ? database.getFilesBySubject(subject.id) : []);
        const countElement = document.getElementById(`file-count-${subject.id}`);
        if (countElement) {
            countElement.textContent = files.length;
        }
    });
}

async function viewSubject(subjectId) {
    try {
        currentSubjectId = subjectId;
        const subject = allSubjects.find(s => s.id == subjectId) || 
                       await (database?.getSubjectById(subjectId));
        
        if (!subject) {
            showMessage('المادة غير موجودة', 'error');
            return;
        }

        // التبديل بين الأقسام
        document.getElementById('subjects').style.display = 'none';
        document.getElementById('help').style.display = 'none';
        document.getElementById('subject-details').style.display = 'block';
        
        // تحديث العنوان
        document.getElementById('subject-title').innerHTML = `
            <i class="${subject.icon || 'fas fa-book'}"></i>
            ${subject.name}
            <span class="subject-subtitle">${subject.description || ''}</span>
        `;

        // تحميل الملفات
        const files = database ? 
            await database.getFilesBySubject(subjectId) :
            await loadFilesFromAPI(subjectId);
        
        renderFiles(files);
        
        // التمرير للأعلى
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('خطأ في عرض المادة:', error);
        showMessage('حدث خطأ في عرض المادة', 'error');
    }
}

function renderFiles(files) {
    const container = document.getElementById('files-container');
    
    if (!files || files.length === 0) {
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
    files.forEach(file => {
        const fileIcon = getFileIcon(file.file_name || file.name);
        const fileName = file.file_name || file.name;
        const fileSize = file.file_size || 'غير معروف';
        const downloads = file.downloads || 0;
        
        html += `
            <div class="file-card">
                <div class="file-icon">
                    <i class="${fileIcon}"></i>
                </div>
                <div class="file-info">
                    <h4>${fileName}</h4>
                    <div class="file-meta">
                        <span><i class="fas fa-hdd"></i> ${fileSize}</span>
                        <span><i class="fas fa-download"></i> ${downloads}</span>
                        <span><i class="fas fa-calendar"></i> ${file.upload_date || file.date || ''}</span>
                    </div>
                </div>
                <button class="download-btn" onclick="handleDownload(${file.id}, '${fileName}')">
                    <i class="fas fa-download"></i> تحميل
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ============== دوال المساعدة ==============
function formatDate(dateString) {
    if (!dateString) return 'غير معروف';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'fas fa-file-pdf text-danger',
        'doc': 'fas fa-file-word text-primary',
        'docx': 'fas fa-file-word text-primary',
        'xls': 'fas fa-file-excel text-success',
        'xlsx': 'fas fa-file-excel text-success',
        'ppt': 'fas fa-file-powerpoint text-warning',
        'pptx': 'fas fa-file-powerpoint text-warning',
        'zip': 'fas fa-file-archive text-secondary',
        'rar': 'fas fa-file-archive text-secondary',
        'jpg': 'fas fa-file-image text-info',
        'jpeg': 'fas fa-file-image text-info',
        'png': 'fas fa-file-image text-info',
        'mp4': 'fas fa-file-video text-danger',
        'mp3': 'fas fa-file-audio text-success'
    };
    return iconMap[ext] || 'fas fa-file text-muted';
}

async function handleDownload(fileId, fileName) {
    showMessage(`جاري تحميل: ${fileName}`, 'info');
    
    // زيادة عداد التحميلات
    if (database) {
        await database.incrementDownloadCount(fileId);
    }
    
    // محاكاة التحميل (في الإصدار الحقيقي سيكون رابط تحميل حقيقي)
    setTimeout(() => {
        const link = document.createElement('a');
        link.href = '#';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage(`تم تحميل: ${fileName}`, 'success');
        updateStatistics();
    }, 1000);
}

async function updateStatistics() {
    try {
        if (database) {
            const stats = await database.getStatistics();
            document.getElementById('user-count').textContent = stats.totalUsers || 0;
            document.getElementById('subject-count').textContent = stats.totalSubjects || 0;
            document.getElementById('file-count').textContent = stats.totalFiles || 0;
        } else {
            // استخدام الإحصائيات الافتراضية
            document.getElementById('user-count').textContent = '150+';
            document.getElementById('subject-count').textContent = allSubjects.length;
            document.getElementById('file-count').textContent = '25+';
        }
    } catch (error) {
        console.error('❌ خطأ في تحديث الإحصائيات:', error);
    }
}

function showMessage(text, type = 'success') {
    const toast = document.getElementById('message-toast');
    if (!toast) return;
    
    toast.textContent = text;
    toast.className = 'toast';
    
    if (type === 'error') {
        toast.classList.add('error');
    } else if (type === 'info') {
        toast.classList.add('info');
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============== دوال التحكم ==============
function backToSubjects() {
    document.getElementById('subjects').style.display = 'block';
    document.getElementById('help').style.display = 'block';
    document.getElementById('subject-details').style.display = 'none';
    document.getElementById('subjects').scrollIntoView({ behavior: 'smooth' });
}

function searchSubjects() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const cards = document.querySelectorAll('.subject-card');
    
    cards.forEach(card => {
        const subjectName = card.querySelector('h3').textContent.toLowerCase();
        const subjectDesc = card.querySelector('p').textContent.toLowerCase();
        
        if (subjectName.includes(searchTerm) || subjectDesc.includes(searchTerm)) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease';
        } else {
            card.style.display = 'none';
        }
    });
}

function toggleFaq(button) {
    const faqItem = button.parentElement;
    faqItem.classList.toggle('active');
}

function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('show');
}

function checkAdminStatus() {
    const userId = localStorage.getItem('user_id');
    const adminLink = document.getElementById('admin-link');
    
    if (userId == 5795991022) {
        adminLink.style.display = 'flex';
    } else {
        adminLink.style.display = 'none';
    }
}

// ============== مستمعي الأحداث ==============
function setupEventListeners() {
    // البحث
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchSubjects();
        });
        
        searchInput.addEventListener('input', (e) => {
            if (e.target.value === '') {
                document.querySelectorAll('.subject-card').forEach(card => {
                    card.style.display = 'block';
                });
            }
        });
    }
    
    // تحديث النشاط
    document.addEventListener('click', () => {
        if (database) {
            const userId = localStorage.getItem('user_id');
            if (userId) database.updateUserActivity(userId);
        }
    });
    
    // إغلاق القائمة المتنقلة
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-links') && !e.target.closest('.menu-btn')) {
            document.querySelector('.nav-links')?.classList.remove('show');
        }
    });
    
    // تحديث تلقائي كل 5 دقائق
    setInterval(async () => {
        await updateStatistics();
    }, 300000);
}

// ============== CSS إضافي ==============
const additionalStyles = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.subject-meta {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    font-size: 0.85rem;
    color: #7f8c8d;
}

.subject-meta span {
    display: flex;
    align-items: center;
    gap: 5px;
}

.subject-subtitle {
    display: block;
    font-size: 1rem;
    color: #7f8c8d;
    margin-top: 5px;
    font-weight: normal;
}

.file-meta {
    display: flex;
    gap: 15px;
    margin-top: 5px;
    font-size: 0.85rem;
    color: #7f8c8d;
}

.file-meta span {
    display: flex;
    align-items: center;
    gap: 3px;
}

.no-data, .no-files {
    text-align: center;
    padding: 3rem;
    color: #7f8c8d;
    grid-column: 1 / -1;
}

.no-data i, .no-files i {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.toast.info {
    background: #3498db;
}
`;

// إضافة الأنماط الإضافية
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// تصدير للاستخدام في وحدة التحكم
window.loadSubjects = () => loadSubjectsFromAPI();
window.viewSubject = viewSubject;
window.searchSubjects = searchSubjects;
window.database = database;
