// ============================================
// ملف script.js الرئيسي المحدث
// ============================================

// المتغيرات العامة
let currentSubjectId = null;
let currentSubject = null;
let allSubjects = [];
let allFiles = [];
let currentPage = 'home';
let searchQuery = '';
let userPreferences = {};

// ============================================
// 1. تهيئة التطبيق
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 بدء تحميل تطبيق ملخصات آداب وفلسفة...');
    
    try {
        // تهيئة قاعدة البيانات
        await initializeDatabase();
        await setupCurrentUser();
        
        // تحميل التفضيلات
        loadUserPreferences();
        
        // تحميل البيانات
        await loadAllData();
        
        // إعداد واجهة المستخدم
        setupUI();
        
        // إعداد مستمعي الأحداث
        setupEventListeners();
        
        // تحديث الإحصائيات
        await updateStatistics();
        
        // التحقق من حالة المسؤول
        checkAdminStatus();
        
        // إظهار رسالة ترحيب
        setTimeout(() => {
            showWelcomeMessage();
        }, 1000);
        
        console.log('✅ تم تحميل التطبيق بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تحميل التطبيق:', error);
        showError('تعذر تحميل التطبيق. الرجاء تحديث الصفحة.');
    }
});

// ============================================
// 2. دوال تحميل البيانات
// ============================================

async function loadAllData() {
    try {
        // تحميل المواد
        allSubjects = await database.getAllSubjects();
        console.log(`📚 تم تحميل ${allSubjects.length} مادة`);
        
        // تحميل جميع الملفات
        allFiles = await database.getAllFiles();
        console.log(`📁 تم تحميل ${allFiles.length} ملف`);
        
        // عرض المواد
        renderSubjects(allSubjects);
        
        // تحميل الملفات الشائعة
        await loadPopularFiles();
        
        // تحميل سجل المشاهدة
        loadViewHistory();
        
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
        throw error;
    }
}

async function loadSubjectData(subjectId) {
    try {
        currentSubject = await database.getSubjectById(subjectId);
        const files = await database.getFilesBySubject(subjectId);
        
        return {
            subject: currentSubject,
            files: files
        };
    } catch (error) {
        console.error('❌ خطأ في تحميل بيانات المادة:', error);
        throw error;
    }
}

async function loadPopularFiles() {
    try {
        const popularFiles = await database.getPopularFiles(5);
        if (popularFiles.length > 0) {
            renderPopularFiles(popularFiles);
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل الملفات الشائعة:', error);
    }
}

// ============================================
// 3. دوال العرض
// ============================================

function renderSubjects(subjects) {
    const container = document.getElementById('subjects-container');
    if (!container) return;

    if (!subjects || subjects.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-book-open"></i>
                <h3>لا توجد مواد دراسية متاحة حالياً</h3>
                <p>سيتم إضافة المواد قريباً</p>
                <button onclick="location.reload()" class="refresh-btn">
                    <i class="fas fa-sync-alt"></i> تحديث
                </button>
            </div>
        `;
        return;
    }

    let html = '';
    subjects.forEach(subject => {
        const filesCount = subject.files_count || 0;
        const isNew = isSubjectNew(subject.created_at);
        
        html += `
            <div class="subject-card" data-id="${subject.id}" 
                 style="border-left: 5px solid ${subject.color || '#4CAF50'}">
                <div class="subject-header">
                    <i class="${subject.icon || 'fas fa-book'}"></i>
                    ${isNew ? '<span class="new-badge">جديد</span>' : ''}
                </div>
                <h3>${subject.name}</h3>
                <p>${subject.description || 'ملخصات ومراجعات دراسية'}</p>
                
                <div class="subject-meta">
                    <span class="file-count">
                        <i class="fas fa-file-alt"></i> ${filesCount} ملف
                    </span>
                    <span class="subject-category">
                        <i class="fas fa-tag"></i> ${subject.category || 'عام'}
                    </span>
                </div>
                
                <div class="subject-actions">
                    <button class="view-btn" onclick="viewSubject(${subject.id})">
                        <i class="fas fa-eye"></i> عرض الملفات
                    </button>
                    <button class="info-btn" onclick="showSubjectInfo(${subject.id})">
                        <i class="fas fa-info-circle"></i> معلومات
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    
    // تحديث عدد الملفات الحقيقي
    updateSubjectsFileCount();
}

async function updateSubjectsFileCount() {
    allSubjects.forEach(async subject => {
        const files = await database.getFilesBySubject(subject.id);
        const countElement = document.querySelector(`.subject-card[data-id="${subject.id}"] .file-count`);
        if (countElement) {
            countElement.innerHTML = `<i class="fas fa-file-alt"></i> ${files.length} ملف`;
        }
    });
}

function renderFiles(files) {
    const container = document.getElementById('files-container');
    if (!container) return;

    if (!files || files.length === 0) {
        container.innerHTML = `
            <div class="no-files">
                <i class="fas fa-folder-open"></i>
                <h3>لا توجد ملفات لهذه المادة بعد</h3>
                <p>سيتم إضافة الملفات قريباً</p>
                ${isAdmin() ? `
                    <button onclick="showAdminPanel('files')" class="upload-btn">
                        <i class="fas fa-upload"></i> رفع ملفات
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }

    let html = '';
    files.forEach(file => {
        const fileIcon = getFileIcon(file.file_name);
        const isPDF = file.file_name.toLowerCase().endsWith('.pdf');
        const isPopular = (file.downloads || 0) > 100;
        const isNew = isFileNew(file.upload_date);
        
        html += `
            <div class="file-card" data-id="${file.id}">
                <div class="file-header">
                    <div class="file-icon">
                        <i class="${fileIcon}"></i>
                    </div>
                    ${isNew ? '<span class="new-badge">جديد</span>' : ''}
                    ${isPopular ? '<span class="popular-badge">شائع</span>' : ''}
                </div>
                
                <div class="file-info">
                    <h4>${file.file_name}</h4>
                    <p class="file-description">${file.description || 'ملف دراسي'}</p>
                    
                    <div class="file-meta">
                        <span><i class="fas fa-hdd"></i> ${file.file_size || 'غير معروف'}</span>
                        <span><i class="fas fa-download"></i> ${file.downloads || 0}</span>
                        <span><i class="fas fa-eye"></i> ${file.views || 0}</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(file.upload_date)}</span>
                    </div>
                </div>
                
                <div class="file-actions">
                    ${isPDF ? `
                        <button class="preview-btn" onclick="previewFile(${file.id}, '${file.file_name}')">
                            <i class="fas fa-eye"></i> معاينة
                        </button>
                    ` : ''}
                    
                    <button class="download-btn" onclick="downloadFile(${file.id}, '${file.file_name}')">
                        <i class="fas fa-download"></i> تحميل
                    </button>
                    
                    <button class="info-btn" onclick="showFileInfo(${file.id})">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderPopularFiles(files) {
    const container = document.getElementById('popular-files');
    if (!container || !files.length) return;

    let html = `
        <div class="section-header">
            <h3><i class="fas fa-fire"></i> الملفات الأكثر تحميلاً</h3>
        </div>
        <div class="popular-files-grid">
    `;
    
    files.slice(0, 5).forEach(file => {
        html += `
            <div class="popular-file-item" onclick="showFileInfo(${file.id})">
                <div class="popular-file-icon">
                    <i class="${getFileIcon(file.file_name)}"></i>
                </div>
                <div class="popular-file-info">
                    <h4>${truncateText(file.file_name, 30)}</h4>
                    <p>${file.downloads || 0} تحميل</p>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

// ============================================
// 4. دوال التنقل والعرض
// ============================================

async function viewSubject(subjectId) {
    try {
        currentSubjectId = subjectId;
        const data = await loadSubjectData(subjectId);
        currentSubject = data.subject;
        
        // تحديث حالة الصفحة
        currentPage = 'subject';
        
        // إخفاء وإظهار الأقسام
        document.querySelectorAll('.page-section').forEach(section => {
            section.style.display = 'none';
        });
        
        document.getElementById('subject-details').style.display = 'block';
        
        // تحديث العنوان
        document.getElementById('subject-title').innerHTML = `
            <i class="${currentSubject.icon || 'fas fa-book'}"></i>
            ${currentSubject.name}
            <span class="subject-subtitle">${currentSubject.description || ''}</span>
        `;
        
        // تحديث المسار
        updateBreadcrumb([
            { name: 'الرئيسية', action: 'showHomePage' },
            { name: 'المواد', action: 'showSubjectsPage' },
            { name: currentSubject.name, action: null }
        ]);
        
        // عرض الملفات
        renderFiles(data.files);
        
        // تحديث الإحصائيات
        await updateSubjectStatistics(subjectId);
        
        // التمرير للأعلى
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // حفظ في السجل
        saveToViewHistory('subject', subjectId, currentSubject.name);
        
    } catch (error) {
        console.error('❌ خطأ في عرض المادة:', error);
        showError('تعذر تحميل المادة. الرجاء المحاولة مرة أخرى.');
    }
}

function showHomePage() {
    currentPage = 'home';
    
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById('subjects').style.display = 'block';
    document.getElementById('help').style.display = 'block';
    
    updateBreadcrumb([{ name: 'الرئيسية', action: null }]);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showSubjectsPage() {
    currentPage = 'subjects';
    
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById('subjects').style.display = 'block';
    
    updateBreadcrumb([
        { name: 'الرئيسية', action: 'showHomePage' },
        { name: 'جميع المواد', action: null }
    ]);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToSubjects() {
    if (currentPage === 'subject') {
        showSubjectsPage();
    } else {
        showHomePage();
    }
}

// ============================================
// 5. دوال الملفات
// ============================================

async function downloadFile(fileId, fileName) {
    try {
        // زيادة عداد التحميلات
        await database.incrementFileDownloads(fileId);
        
        // عرض رسالة
        showMessage(`جاري تحميل: ${fileName}`, 'info');
        
        // محاكاة التحميل (في الإصدار الحقيقي سيكون رابط حقيقي)
        setTimeout(() => {
            // إنشاء رابط تحميل وهمي
            const link = document.createElement('a');
            link.href = '#';
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // عرض رسالة نجاح
            showMessage(`تم تحميل: ${fileName} بنجاح`, 'success');
            
            // تحديث الإحصائيات
            updateStatistics();
            
            // تحديث عرض الملفات إذا كان في صفحة المادة
            if (currentSubjectId) {
                const files = allFiles.filter(f => f.subject_id == currentSubjectId);
                renderFiles(files);
            }
            
            // حفظ في السجل
            saveToDownloadHistory(fileId, fileName);
            
        }, 1000);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل الملف:', error);
        showError('تعذر تحميل الملف. الرجاء المحاولة مرة أخرى.');
    }
}

function previewFile(fileId, fileName) {
    // حفظ في سجل المشاهدة
    saveToViewHistory('file', fileId, fileName);
    
    // زيادة عداد المشاهدات
    database.incrementFileViews(fileId);
    
    // فتح معاينة PDF
    window.open(`pdf-viewer.html?id=${fileId}&name=${encodeURIComponent(fileName)}`, '_blank');
}

function showFileInfo(fileId) {
    database.getFileById(fileId).then(file => {
        if (!file) return;
        
        const modalContent = `
            <div class="modal-header">
                <h3><i class="${getFileIcon(file.file_name)}"></i> ${file.file_name}</h3>
                <button onclick="closeModal()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="file-info-details">
                    <div class="info-row">
                        <span class="info-label">نوع الملف:</span>
                        <span class="info-value">${getFileType(file.file_name)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">الحجم:</span>
                        <span class="info-value">${file.file_size || 'غير معروف'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">عدد التحميلات:</span>
                        <span class="info-value">${file.downloads || 0}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">عدد المشاهدات:</span>
                        <span class="info-value">${file.views || 0}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">تاريخ الرفع:</span>
                        <span class="info-value">${formatDate(file.upload_date)}</span>
                    </div>
                    ${file.description ? `
                    <div class="info-row">
                        <span class="info-label">الوصف:</span>
                        <span class="info-value">${file.description}</span>
                    </div>
                    ` : ''}
                    ${file.last_downloaded ? `
                    <div class="info-row">
                        <span class="info-label">آخر تحميل:</span>
                        <span class="info-value">${formatDate(file.last_downloaded)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="previewFile(${fileId}, '${file.file_name}')" class="btn preview-btn">
                    <i class="fas fa-eye"></i> معاينة
                </button>
                <button onclick="downloadFile(${fileId}, '${file.file_name}')" class="btn download-btn">
                    <i class="fas fa-download"></i> تحميل
                </button>
            </div>
        `;
        
        showModal(modalContent);
    });
}

function showSubjectInfo(subjectId) {
    database.getSubjectById(subjectId).then(subject => {
        if (!subject) return;
        
        database.getFilesBySubject(subjectId).then(files => {
            const modalContent = `
                <div class="modal-header">
                    <h3><i class="${subject.icon || 'fas fa-book'}"></i> ${subject.name}</h3>
                    <button onclick="closeModal()" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="subject-info-details">
                        <div class="info-row">
                            <span class="info-label">الوصف:</span>
                            <span class="info-value">${subject.description || 'لا يوجد وصف'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">التصنيف:</span>
                            <span class="info-value">${subject.category || 'عام'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">عدد الملفات:</span>
                            <span class="info-value">${files.length}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">تاريخ الإضافة:</span>
                            <span class="info-value">${formatDate(subject.created_at)}</span>
                        </div>
                    </div>
                    
                    ${files.length > 0 ? `
                    <div class="files-list">
                        <h4><i class="fas fa-file-alt"></i> ملفات المادة:</h4>
                        <div class="files-grid">
                    ` : ''}
                    
                    ${files.slice(0, 5).map(file => `
                        <div class="file-item" onclick="showFileInfo(${file.id})">
                            <i class="${getFileIcon(file.file_name)}"></i>
                            <span>${truncateText(file.file_name, 25)}</span>
                        </div>
                    `).join('')}
                    
                    ${files.length > 0 ? `
                        </div>
                        ${files.length > 5 ? `<p class="more-files">و ${files.length - 5} ملفات أخرى...</p>` : ''}
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button onclick="viewSubject(${subjectId})" class="btn view-btn">
                        <i class="fas fa-eye"></i> عرض جميع الملفات
                    </button>
                </div>
            `;
            
            showModal(modalContent);
        });
    });
}

// ============================================
// 6. البحث والتصفية
// ============================================

function searchSubjects() {
    const query = document.getElementById('search-input').value.trim();
    searchQuery = query;
    
    if (!query) {
        renderSubjects(allSubjects);
        return;
    }
    
    database.searchSubjects(query).then(results => {
        if (results.length === 0) {
            document.getElementById('subjects-container').innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>لا توجد نتائج للبحث: "${query}"</h3>
                    <p>حاول البحث بكلمات أخرى</p>
                </div>
            `;
        } else {
            renderSubjects(results);
        }
    });
}

function filterSubjects(category) {
    if (category === 'all') {
        renderSubjects(allSubjects);
        return;
    }
    
    const filtered = allSubjects.filter(subject => 
        subject.category === category
    );
    
    renderSubjects(filtered);
}

// ============================================
// 7. الإحصائيات والتحديثات
// ============================================

async function updateStatistics() {
    try {
        const stats = await database.getStatistics();
        
        // تحديث الأرقام في الهيدر
        document.getElementById('user-count').textContent = stats.totalUsers || 0;
        document.getElementById('subject-count').textContent = stats.totalSubjects || 0;
        document.getElementById('file-count').textContent = stats.totalFiles || 0;
        
        // تحديث الإحصائيات في لوحة المعلومات
        updateStatsDisplay(stats);
        
    } catch (error) {
        console.error('❌ خطأ في تحديث الإحصائيات:', error);
    }
}

async function updateSubjectStatistics(subjectId) {
    try {
        const files = await database.getFilesBySubject(subjectId);
        let totalDownloads = 0;
        let totalViews = 0;
        
        files.forEach(file => {
            totalDownloads += file.downloads || 0;
            totalViews += file.views || 0;
        });
        
        // عرض إحصائيات المادة في صفحة التفاصيل
        const statsElement = document.getElementById('subject-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="subject-stats-grid">
                    <div class="stat-item">
                        <i class="fas fa-file-alt"></i>
                        <span>${files.length}</span>
                        <p>ملف</p>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-download"></i>
                        <span>${totalDownloads}</span>
                        <p>تحميل</p>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-eye"></i>
                        <span>${totalViews}</span>
                        <p>مشاهدة</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ خطأ في تحديث إحصائيات المادة:', error);
    }
}

// ============================================
// 8. إدارة المستخدم والتفضيلات
// ============================================

function loadUserPreferences() {
    userPreferences = JSON.parse(localStorage.getItem('user_preferences') || '{}');
    
    // تعيين القيم الافتراضية
    if (!userPreferences.theme) userPreferences.theme = 'light';
    if (!userPreferences.language) userPreferences.language = 'ar';
    if (!userPreferences.fontSize) userPreferences.fontSize = 'medium';
    if (!userPreferences.showAnimations) userPreferences.showAnimations = true;
    
    applyUserPreferences();
}

function saveUserPreferences() {
    localStorage.setItem('user_preferences', JSON.stringify(userPreferences));
    applyUserPreferences();
}

function applyUserPreferences() {
    // تطبيق السمة
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(`${userPreferences.theme}-theme`);
    
    // تطبيق حجم الخط
    document.documentElement.style.fontSize = {
        'small': '14px',
        'medium': '16px',
        'large': '18px'
    }[userPreferences.fontSize] || '16px';
    
    // تطبيق اللغة
    document.documentElement.lang = userPreferences.language;
    document.documentElement.dir = userPreferences.language === 'ar' ? 'rtl' : 'ltr';
    
    // تطبيق التحريك
    document.body.style.setProperty('--animation-speed', userPreferences.showAnimations ? '0.3s' : '0s');
}

function toggleTheme() {
    userPreferences.theme = userPreferences.theme === 'light' ? 'dark' : 'light';
    saveUserPreferences();
    showMessage(`تم التبديل إلى السمة ${userPreferences.theme === 'light' ? 'الفاتحة' : 'الداكنة'}`);
}

function changeFontSize(size) {
    userPreferences.fontSize = size;
    saveUserPreferences();
    showMessage(`تم تغيير حجم الخط إلى ${size === 'small' ? 'صغير' : size === 'large' ? 'كبير' : 'متوسط'}`);
}

function toggleAnimations() {
    userPreferences.showAnimations = !userPreferences.showAnimations;
    saveUserPreferences();
    showMessage(`تم ${userPreferences.showAnimations ? 'تفعيل' : 'تعطيل'} التحريك`);
}

// ============================================
// 9. إدارة السجل والتاريخ
// ============================================

function saveToViewHistory(type, id, name) {
    let history = JSON.parse(localStorage.getItem('view_history') || '[]');
    
    history.unshift({
        type: type,
        id: id,
        name: name,
        timestamp: new Date().toISOString()
    });
    
    // الاحتفاظ بآخر 50 عنصر فقط
    history = history.slice(0, 50);
    
    localStorage.setItem('view_history', JSON.stringify(history));
}

function saveToDownloadHistory(fileId, fileName) {
    let history = JSON.parse(localStorage.getItem('download_history') || '[]');
    
    history.unshift({
        fileId: fileId,
        fileName: fileName,
        timestamp: new Date().toISOString()
    });
    
    // الاحتفاظ بآخر 30 عنصر فقط
    history = history.slice(0, 30);
    
    localStorage.setItem('download_history', JSON.stringify(history));
}

function loadViewHistory() {
    const history = JSON.parse(localStorage.getItem('view_history') || '[]');
    if (history.length === 0) return;
    
    const container = document.getElementById('view-history');
    if (!container) return;
    
    let html = `
        <div class="section-header">
            <h3><i class="fas fa-history"></i> شاهدت مؤخراً</h3>
            <button onclick="clearViewHistory()" class="clear-btn">مسح السجل</button>
        </div>
        <div class="history-list">
    `;
    
    history.slice(0, 5).forEach(item => {
        const icon = item.type === 'subject' ? 'fas fa-book' : getFileIcon(item.name);
        const action = item.type === 'subject' ? `viewSubject(${item.id})` : `showFileInfo(${item.id})`;
        
        html += `
            <div class="history-item" onclick="${action}">
                <i class="${icon}"></i>
                <span>${truncateText(item.name, 25)}</span>
                <small>${timeAgo(item.timestamp)}</small>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

function clearViewHistory() {
    if (confirm('هل أنت متأكد من مسح سجل المشاهدة؟')) {
        localStorage.removeItem('view_history');
        document.getElementById('view-history').innerHTML = '';
        showMessage('تم مسح سجل المشاهدة');
    }
}

// ============================================
// 10. أدوات مساعدة
// ============================================

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
        'mp3': 'fas fa-file-audio text-success',
        'mp4': 'fas fa-file-video text-danger',
        'txt': 'fas fa-file-alt text-muted'
    };
    
    return iconMap[ext] || 'fas fa-file text-muted';
}

function getFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    
    const typeMap = {
        'pdf': 'PDF Document',
        'doc': 'Word Document',
        'docx': 'Word Document',
        'xls': 'Excel Spreadsheet',
        'xlsx': 'Excel Spreadsheet',
        'ppt': 'PowerPoint Presentation',
        'pptx': 'PowerPoint Presentation',
        'jpg': 'Image',
        'jpeg': 'Image',
        'png': 'Image',
        'zip': 'Archive',
        'rar': 'Archive'
    };
    
    return typeMap[ext] || 'Unknown File';
}

function formatDate(dateString) {
    if (!dateString) return 'غير معروف';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'اليوم';
    } else if (diffDays === 1) {
        return 'أمس';
    } else if (diffDays < 7) {
        return `منذ ${diffDays} أيام`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `منذ ${weeks} أسبوع`;
    } else {
        return date.toLocaleDateString('ar-EG');
    }
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `منذ ${interval} سنة`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `منذ ${interval} شهر`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `منذ ${interval} يوم`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `منذ ${interval} ساعة`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `منذ ${interval} دقيقة`;
    
    return 'الآن';
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function isSubjectNew(createdDate) {
    const date = new Date(createdDate);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    return diffDays < 7;
}

function isFileNew(uploadDate) {
    const date = new Date(uploadDate);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    return diffDays < 3;
}

// ============================================
// 11. الرسائل والإشعارات
// ============================================

function showMessage(text, type = 'success') {
    // إنشاء عنصر الرسالة
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
        <div class="message-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${text}</span>
        </div>
        <button onclick="this.parentElement.remove()" class="close-message">&times;</button>
    `;
    
    // إضافة إلى الصفحة
    const container = document.getElementById('messages-container') || createMessagesContainer();
    container.appendChild(message);
    
    // إزالة تلقائية بعد 5 ثوان
    setTimeout(() => {
        if (message.parentElement) {
            message.remove();
        }
    }, 5000);
}

function showError(text) {
    showMessage(text, 'error');
}

function showInfo(text) {
    showMessage(text, 'info');
}

function createMessagesContainer() {
    const container = document.createElement('div');
    container.id = 'messages-container';
    container.className = 'messages-container';
    document.body.appendChild(container);
    return container;
}

function showModal(content) {
    // إنشاء الـ modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            ${content}
        </div>
    `;
    
    // إضافة إلى الصفحة
    document.body.appendChild(modal);
    
    // إغلاق عند النقر خارج المحتوى
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function showWelcomeMessage() {
    const isFirstVisit = !localStorage.getItem('has_visited');
    
    if (isFirstVisit) {
        const welcomeMessage = `
            <div class="modal-header">
                <h3><i class="fas fa-graduation-cap"></i> مرحباً بك في ملخصات آداب وفلسفة!</h3>
                <button onclick="closeModal()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="welcome-content">
                    <div class="welcome-step">
                        <i class="fas fa-search"></i>
                        <h4>ابحث عن المواد</h4>
                        <p>تصفح المواد الدراسية المتاحة</p>
                    </div>
                    <div class="welcome-step">
                        <i class="fas fa-eye"></i>
                        <h4>معاينة الملفات</h4>
                        <p>شاهد ملفات PDF مباشرة في الموقع</p>
                    </div>
                    <div class="welcome-step">
                        <i class="fas fa-download"></i>
                        <h4>حمل ما تحتاجه</h4>
                        <p>حمل الملفات للدراسة في أي وقت</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="closeModal(); localStorage.setItem('has_visited', 'true')" class="btn btn-primary">
                    <i class="fas fa-check"></i> فهمت، دعنا نبدأ!
                </button>
            </div>
        `;
        
        setTimeout(() => {
            showModal(welcomeMessage);
        }, 1500);
    }
}

// ============================================
// 12. التحكم بالمسؤول
// ============================================

function isAdmin() {
    const userId = localStorage.getItem('user_id');
    return userId && userId == 5795991022;
}

function checkAdminStatus() {
    const adminLink = document.getElementById('admin-link');
    const adminButtons = document.querySelectorAll('.admin-only');
    
    if (isAdmin()) {
        if (adminLink) adminLink.style.display = 'flex';
        adminButtons.forEach(btn => btn.style.display = 'inline-flex');
    } else {
        if (adminLink) adminLink.style.display = 'none';
        adminButtons.forEach(btn => btn.style.display = 'none');
    }
}

function showAdminPanel(section = 'dashboard') {
    if (!isAdmin()) {
        showError('ليس لديك صلاحية الوصول إلى لوحة التحكم');
        return;
    }
    
    window.location.href = `admin.html?section=${section}`;
}

// ============================================
// 13. إعداد واجهة المستخدم
// ============================================

function setupUI() {
    // إعداد شريط البحث
    setupSearch();
    
    // إعداد التنقل
    setupNavigation();
    
    // إعداد التصفية
    setupFilters();
    
    // إعداد الوضع الليلي
    setupDarkMode();
    
    // إعداد خبز المسار
    updateBreadcrumb([]);
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                searchSubjects();
            }
        });
        
        // بحث تلقائي بعد توقف الكتابة
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchSubjects();
            }, 500);
        });
    }
}

function setupNavigation() {
    // تحديث الروابط النشطة
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

function setupFilters() {
    // جمع التصنيفات الفريدة
    const categories = [...new Set(allSubjects.map(s => s.category || 'عام'))];
    
    const filterContainer = document.getElementById('filter-container');
    if (filterContainer && categories.length > 1) {
        let html = `
            <div class="filter-buttons">
                <button class="filter-btn active" onclick="filterSubjects('all')">
                    <i class="fas fa-th"></i> الكل
                </button>
        `;
        
        categories.forEach(category => {
            html += `
                <button class="filter-btn" onclick="filterSubjects('${category}')">
                    <i class="fas fa-tag"></i> ${category}
                </button>
            `;
        });
        
        html += `</div>`;
        filterContainer.innerHTML = html;
    }
}

function setupDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleTheme);
        
        // تحديث الأيقونة
        updateDarkModeIcon();
    }
}

function updateDarkModeIcon() {
    const icon = document.querySelector('#dark-mode-toggle i');
    if (icon) {
        icon.className = userPreferences.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function updateBreadcrumb(items) {
    const container = document.getElementById('breadcrumb');
    if (!container) return;
    
    let html = '';
    items.forEach((item, index) => {
        if (index === items.length - 1) {
            html += `<span class="breadcrumb-item active">${item.name}</span>`;
        } else {
            html += `<a href="#" onclick="${item.action}()" class="breadcrumb-item">${item.name}</a>`;
            html += `<span class="breadcrumb-separator">/</span>`;
        }
    });
    
    container.innerHTML = html;
}

function updateStatsDisplay(stats) {
    const statsContainer = document.getElementById('stats-display');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <i class="fas fa-users"></i>
                <div class="stat-info">
                    <h3>${stats.totalUsers}</h3>
                    <p>مستخدم</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-book"></i>
                <div class="stat-info">
                    <h3>${stats.totalSubjects}</h3>
                    <p>مادة</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-file-alt"></i>
                <div class="stat-info">
                    <h3>${stats.totalFiles}</h3>
                    <p>ملف</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-download"></i>
                <div class="stat-info">
                    <h3>${stats.totalDownloads}</h3>
                    <p>تحميل</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// 14. إعداد مستمعي الأحداث
// ============================================

function setupEventListeners() {
    // تحديث نشاط المستخدم
    document.addEventListener('click', () => {
        const userId = localStorage.getItem('user_id');
        if (userId) {
            database.updateUserActivity(userId);
        }
    });
    
    // إغلاق القائمة المتنقلة
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-links') && !e.target.closest('.menu-btn')) {
            document.querySelector('.nav-links')?.classList.remove('show');
        }
    });
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
        // Ctrl + F للبحث
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Esc لإغلاق الـ modal
        if (e.key === 'Escape') {
            closeModal();
        }
        
        // F5 للتحديث
        if (e.key === 'F5') {
            e.preventDefault();
            location.reload();
        }
    });
    
    // تحديث البيانات تلقائياً كل 5 دقائق
    setInterval(async () => {
        await loadAllData();
        await updateStatistics();
    }, 300000);
}

// ============================================
// 15. دوال مساعدة إضافية
// ============================================

function refreshPage() {
    location.reload();
}

function printPage() {
    window.print();
}

function sharePage() {
    if (navigator.share) {
        navigator.share({
            title: 'ملخصات آداب وفلسفة',
            text: 'تصفح ملخصات ومواد دراسية لطلاب آداب وفلسفة',
            url: window.location.href
        });
    } else {
        // نسخ الرابط
        navigator.clipboard.writeText(window.location.href)
            .then(() => showMessage('تم نسخ الرابط إلى الحافظة'))
            .catch(() => showError('تعذر نسخ الرابط'));
    }
}

function exportData() {
    if (isAdmin()) {
        window.backupDatabase();
    } else {
        showError('هذه الميزة متاحة للمسؤولين فقط');
    }
}

// ============================================
// 16. تصدير الدوال للاستخدام
// ============================================

window.database = database;
window.viewSubject = viewSubject;
window.showHomePage = showHomePage;
window.showSubjectsPage = showSubjectsPage;
window.backToSubjects = backToSubjects;
window.searchSubjects = searchSubjects;
window.filterSubjects = filterSubjects;
window.downloadFile = downloadFile;
window.previewFile = previewFile;
window.showFileInfo = showFileInfo;
window.showSubjectInfo = showSubjectInfo;
window.toggleTheme = toggleTheme;
window.changeFontSize = changeFontSize;
window.toggleAnimations = toggleAnimations;
window.refreshPage = refreshPage;
window.printPage = printPage;
window.sharePage = sharePage;
window.exportData = exportData;
window.showAdminPanel = showAdminPanel;
window.clearViewHistory = clearViewHistory;
window.closeModal = closeModal;

console.log('🚀 تم تحميل script.js بنجاح');
