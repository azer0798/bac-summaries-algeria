// ============================================
// قاعدة البيانات المحلية المحسنة
// ============================================

class SubjectsDatabase {
    constructor() {
        this.dbName = 'subjects_database_v3';
        this.dbVersion = 3;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('❌ فشل فتح قاعدة البيانات:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ تم تهيئة قاعدة البيانات');
                this.checkInitialData();
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // جدول المواد الدراسية
                if (!db.objectStoreNames.contains('subjects')) {
                    const subjectsStore = db.createObjectStore('subjects', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    subjectsStore.createIndex('name', 'name', { unique: true });
                    subjectsStore.createIndex('created_at', 'created_at');
                    subjectsStore.createIndex('category', 'category');
                }

                // جدول الملفات
                if (!db.objectStoreNames.contains('files')) {
                    const filesStore = db.createObjectStore('files', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    filesStore.createIndex('subject_id', 'subject_id');
                    filesStore.createIndex('file_name', 'file_name');
                    filesStore.createIndex('file_type', 'file_type');
                    filesStore.createIndex('upload_date', 'upload_date');
                    filesStore.createIndex('downloads', 'downloads');
                }

                // جدول المستخدمين
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', {
                        keyPath: 'id'
                    });
                    usersStore.createIndex('user_id', 'user_id', { unique: true });
                    usersStore.createIndex('username', 'username');
                    usersStore.createIndex('role', 'role');
                    usersStore.createIndex('last_active', 'last_active');
                }

                // جدول ملفات PDF (خاص)
                if (!db.objectStoreNames.contains('pdf_files')) {
                    const pdfStore = db.createObjectStore('pdf_files', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    pdfStore.createIndex('subject_id', 'subject_id');
                    pdfStore.createIndex('file_name', 'file_name');
                    pdfStore.createIndex('upload_date', 'upload_date');
                }

                // جدول الإحصائيات
                if (!db.objectStoreNames.contains('statistics')) {
                    const statsStore = db.createObjectStore('statistics', {
                        keyPath: 'key'
                    });
                }

                console.log('✅ تم إنشاء جداول قاعدة البيانات');
            };
        });
    }

    async checkInitialData() {
        try {
            const subjects = await this.getAllSubjects();
            if (subjects.length === 0) {
                await this.addInitialData();
            }
        } catch (error) {
            console.error('❌ خطأ في التحقق من البيانات الأولية:', error);
        }
    }

    async addInitialData() {
        console.log('📥 جاري إضافة البيانات الأولية...');
        
        // المواد الدراسية الأساسية
        const defaultSubjects = [
            {
                name: 'فلسفة',
                description: 'ملخصات ومراجعات لمادة الفلسفة',
                category: 'أدبي',
                icon: 'fas fa-brain',
                color: '#3498db',
                created_at: new Date().toISOString(),
                files_count: 0
            },
            {
                name: 'أدب عربي',
                description: 'ملخصات لمادة الأدب العربي',
                category: 'أدبي',
                icon: 'fas fa-book',
                color: '#2ecc71',
                created_at: new Date().toISOString(),
                files_count: 0
            },
            {
                name: 'تاريخ',
                description: 'مراجعات وملخصات التاريخ',
                category: 'أدبي',
                icon: 'fas fa-landmark',
                color: '#e74c3c',
                created_at: new Date().toISOString(),
                files_count: 0
            },
            {
                name: 'جغرافيا',
                description: 'ملخصات مادة الجغرافيا',
                category: 'أدبي',
                icon: 'fas fa-globe-africa',
                color: '#9b59b6',
                created_at: new Date().toISOString(),
                files_count: 0
            },
            {
                name: 'علوم إسلامية',
                description: 'مراجعات للعلوم الإسلامية',
                category: 'ديني',
                icon: 'fas fa-mosque',
                color: '#f39c12',
                created_at: new Date().toISOString(),
                files_count: 0
            },
            {
                name: 'لغة فرنسية',
                description: 'ملخصات اللغة الفرنسية',
                category: 'لغات',
                icon: 'fas fa-language',
                color: '#1abc9c',
                created_at: new Date().toISOString(),
                files_count: 0
            }
        ];

        // إضافة المواد
        for (const subject of defaultSubjects) {
            await this.addSubject(subject);
        }

        // إضافة ملفات تجريبية
        const defaultFiles = [
            {
                subject_id: 1,
                file_name: 'ملخص الفلسفة اليونانية.pdf',
                file_type: 'pdf',
                file_size: '2.4 MB',
                file_url: '#',
                description: 'ملخص شامل للفلسفة اليونانية',
                upload_date: new Date().toISOString(),
                downloads: 150,
                views: 300
            },
            {
                subject_id: 1,
                file_name: 'أسئلة فلسفة مع الحلول.docx',
                file_type: 'docx',
                file_size: '1.8 MB',
                file_url: '#',
                description: 'مجموعة أسئلة مع الحلول',
                upload_date: new Date().toISOString(),
                downloads: 120,
                views: 250
            },
            {
                subject_id: 2,
                file_name: 'ملخص الشعر الجاهلي.pdf',
                file_type: 'pdf',
                file_size: '3.1 MB',
                file_url: '#',
                description: 'ملخص شامل للشعر الجاهلي',
                upload_date: new Date().toISOString(),
                downloads: 200,
                views: 400
            },
            {
                subject_id: 3,
                file_name: 'تاريخ العالم الإسلامي.pdf',
                file_type: 'pdf',
                file_size: '4.2 MB',
                file_url: '#',
                description: 'تاريخ العالم الإسلامي من البداية',
                upload_date: new Date().toISOString(),
                downloads: 180,
                views: 350
            },
            {
                subject_id: 4,
                file_name: 'الخرائط الجغرافية.pptx',
                file_type: 'pptx',
                file_size: '5.3 MB',
                file_url: '#',
                description: 'عرض تقديمي للخرائط الجغرافية',
                upload_date: new Date().toISOString(),
                downloads: 90,
                views: 180
            }
        ];

        // إضافة الملفات
        for (const file of defaultFiles) {
            await this.addFile(file);
        }

        // إضافة مستخدم المسؤول
        await this.addUser({
            id: 'admin_' + Date.now(),
            user_id: 5795991022,
            username: 'admin',
            first_name: 'المسؤول',
            last_name: 'النظام',
            role: 'admin',
            email: 'admin@example.com',
            joined_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
            permissions: ['all']
        });

        // إضافة إحصائيات أولية
        await this.updateStatistics();

        console.log('✅ تم إضافة البيانات الأولية بنجاح');
    }

    // ============== عمليات المواد ==============
    async getAllSubjects() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('subjects', 'readonly');
            const store = transaction.objectStore('subjects');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getSubjectById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('subjects', 'readonly');
            const store = transaction.objectStore('subjects');
            const request = store.get(parseInt(id));

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getSubjectByName(name) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('subjects', 'readonly');
            const store = transaction.objectStore('subjects');
            const index = store.index('name');
            const request = index.get(name);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async addSubject(subject) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('subjects', 'readwrite');
            const store = transaction.objectStore('subjects');
            const request = store.add(subject);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateSubject(id, updates) {
        return new Promise(async (resolve, reject) => {
            const subject = await this.getSubjectById(id);
            if (!subject) {
                reject(new Error('المادة غير موجودة'));
                return;
            }

            Object.assign(subject, updates);
            
            const transaction = this.db.transaction('subjects', 'readwrite');
            const store = transaction.objectStore('subjects');
            const request = store.put(subject);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteSubject(id) {
        return new Promise(async (resolve, reject) => {
            try {
                // حذف جميع ملفات المادة أولاً
                const files = await this.getFilesBySubject(id);
                for (const file of files) {
                    await this.deleteFile(file.id);
                }

                // حذف المادة
                const transaction = this.db.transaction('subjects', 'readwrite');
                const store = transaction.objectStore('subjects');
                const request = store.delete(parseInt(id));

                request.onsuccess = () => {
                    this.updateStatistics();
                    resolve(true);
                };
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async searchSubjects(query) {
        const subjects = await this.getAllSubjects();
        const searchTerm = query.toLowerCase();
        
        return subjects.filter(subject => 
            subject.name.toLowerCase().includes(searchTerm) ||
            (subject.description && subject.description.toLowerCase().includes(searchTerm)) ||
            (subject.category && subject.category.toLowerCase().includes(searchTerm))
        );
    }

    // ============== عمليات الملفات ==============
    async getAllFiles() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('files', 'readonly');
            const store = transaction.objectStore('files');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getFilesBySubject(subjectId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('files', 'readonly');
            const store = transaction.objectStore('files');
            const index = store.index('subject_id');
            const request = index.getAll(parseInt(subjectId));

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getFileById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('files', 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(parseInt(id));

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async addFile(file) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('files', 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.add(file);

            request.onsuccess = async () => {
                // تحديث عدد ملفات المادة
                const subject = await this.getSubjectById(file.subject_id);
                if (subject) {
                    subject.files_count = (subject.files_count || 0) + 1;
                    await this.updateSubject(subject.id, subject);
                }
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateFile(id, updates) {
        return new Promise(async (resolve, reject) => {
            const file = await this.getFileById(id);
            if (!file) {
                reject(new Error('الملف غير موجود'));
                return;
            }

            Object.assign(file, updates);
            
            const transaction = this.db.transaction('files', 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.put(file);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFile(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const file = await this.getFileById(id);
                if (!file) {
                    resolve(false);
                    return;
                }

                const transaction = this.db.transaction('files', 'readwrite');
                const store = transaction.objectStore('files');
                const request = store.delete(parseInt(id));

                request.onsuccess = async () => {
                    // تحديث عدد ملفات المادة
                    const subject = await this.getSubjectById(file.subject_id);
                    if (subject && subject.files_count > 0) {
                        subject.files_count -= 1;
                        await this.updateSubject(subject.id, subject);
                    }
                    
                    this.updateStatistics();
                    resolve(true);
                };
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async incrementFileDownloads(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const file = await this.getFileById(id);
                if (!file) {
                    resolve(false);
                    return;
                }

                file.downloads = (file.downloads || 0) + 1;
                file.last_downloaded = new Date().toISOString();
                
                await this.updateFile(id, file);
                await this.updateStatistics();
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    async incrementFileViews(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const file = await this.getFileById(id);
                if (!file) {
                    resolve(false);
                    return;
                }

                file.views = (file.views || 0) + 1;
                file.last_viewed = new Date().toISOString();
                
                await this.updateFile(id, file);
                await this.updateStatistics();
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getPopularFiles(limit = 10) {
        const files = await this.getAllFiles();
        return files
            .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
            .slice(0, limit);
    }

    // ============== عمليات ملفات PDF ==============
    async addPDFFile(fileData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('pdf_files', 'readwrite');
            const store = transaction.objectStore('pdf_files');
            const request = store.add(fileData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPDFFileById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('pdf_files', 'readonly');
            const store = transaction.objectStore('pdf_files');
            const request = store.get(parseInt(id));

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPDFFilesBySubject(subjectId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('pdf_files', 'readonly');
            const store = transaction.objectStore('pdf_files');
            const index = store.index('subject_id');
            const request = index.getAll(parseInt(subjectId));

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    // ============== عمليات المستخدمين ==============
    async addUser(user) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('users', 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.put(user);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserById(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('users', 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('user_id');
            const request = index.get(parseInt(userId));

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllUsers() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('users', 'readonly');
            const store = transaction.objectStore('users');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async updateUserActivity(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await this.getUserById(userId);
                if (user) {
                    user.last_active = new Date().toISOString();
                    await this.addUser(user);
                    resolve(true);
                } else {
                    // إنشاء مستخدم جديد
                    const newUser = {
                        id: 'user_' + Date.now(),
                        user_id: parseInt(userId),
                        username: 'user_' + Math.random().toString(36).substr(2, 8),
                        first_name: 'مستخدم',
                        role: 'user',
                        joined_at: new Date().toISOString(),
                        last_active: new Date().toISOString()
                    };
                    await this.addUser(newUser);
                    resolve(true);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    async countUsers() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('users', 'readonly');
            const store = transaction.objectStore('users');
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ============== عمليات الإحصائيات ==============
    async updateStatistics() {
        const [subjects, files, users] = await Promise.all([
            this.getAllSubjects(),
            this.getAllFiles(),
            this.getAllUsers()
        ]);

        let totalDownloads = 0;
        let totalViews = 0;
        files.forEach(file => {
            totalDownloads += file.downloads || 0;
            totalViews += file.views || 0;
        });

        const stats = {
            key: 'current_stats',
            totalSubjects: subjects.length,
            totalFiles: files.length,
            totalUsers: users.length,
            totalDownloads: totalDownloads,
            totalViews: totalViews,
            lastUpdated: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('statistics', 'readwrite');
            const store = transaction.objectStore('statistics');
            const request = store.put(stats);

            request.onsuccess = () => resolve(stats);
            request.onerror = () => reject(request.error);
        });
    }

    async getStatistics() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('statistics', 'readonly');
            const store = transaction.objectStore('statistics');
            const request = store.get('current_stats');

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result);
                } else {
                    // إحصائيات افتراضية
                    resolve({
                        totalSubjects: 6,
                        totalFiles: 25,
                        totalUsers: 150,
                        totalDownloads: 1250,
                        totalViews: 2500,
                        lastUpdated: new Date().toISOString()
                    });
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getRecentActivity(limit = 20) {
        const files = await this.getAllFiles();
        return files
            .sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date))
            .slice(0, limit);
    }

    // ============== النسخ الاحتياطي ==============
    async backupData() {
        const [subjects, files, users, stats] = await Promise.all([
            this.getAllSubjects(),
            this.getAllFiles(),
            this.getAllUsers(),
            this.getStatistics()
        ]);

        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                subjects: subjects,
                files: files,
                users: users,
                statistics: stats
            }
        };

        // حفظ في localStorage
        localStorage.setItem('database_backup', JSON.stringify(backup));
        
        return backup;
    }

    async restoreData(backup) {
        return new Promise(async (resolve, reject) => {
            try {
                // التحقق من النسخة
                if (!backup || backup.version !== '1.0') {
                    reject(new Error('نسخة النسخة الاحتياطية غير مدعومة'));
                    return;
                }

                // مسح جميع البيانات الحالية
                const objectStores = ['subjects', 'files', 'users', 'pdf_files', 'statistics'];
                
                for (const storeName of objectStores) {
                    const transaction = this.db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const clearRequest = store.clear();
                    
                    await new Promise((res, rej) => {
                        clearRequest.onsuccess = () => res();
                        clearRequest.onerror = () => rej(clearRequest.error);
                    });
                }

                // استعادة البيانات
                const { subjects, files, users } = backup.data;

                // استعادة المواد
                for (const subject of subjects) {
                    await this.addSubject(subject);
                }

                // استعادة الملفات
                for (const file of files) {
                    await this.addFile(file);
                }

                // استعادة المستخدمين
                for (const user of users) {
                    await this.addUser(user);
                }

                // تحديث الإحصائيات
                await this.updateStatistics();

                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    // ============== أدوات مساعدة ==============
    async getSubjectWithFiles(subjectId) {
        const [subject, files] = await Promise.all([
            this.getSubjectById(subjectId),
            this.getFilesBySubject(subjectId)
        ]);
        
        return {
            ...subject,
            files: files
        };
    }

    async getDashboardData() {
        const [stats, subjects, recentFiles, popularFiles, recentUsers] = await Promise.all([
            this.getStatistics(),
            this.getAllSubjects(),
            this.getRecentActivity(5),
            this.getPopularFiles(5),
            this.getAllUsers()
        ]);

        return {
            statistics: stats,
            subjects: subjects,
            recentFiles: recentFiles,
            popularFiles: popularFiles,
            recentUsers: recentUsers.sort((a, b) => new Date(b.last_active) - new Date(a.last_active)).slice(0, 5)
        };
    }
}

// ============================================
// تهيئة قاعدة البيانات العالمية
// ============================================

const database = new SubjectsDatabase();

// دالة مساعدة لتحميل قاعدة البيانات
async function initializeDatabase() {
    try {
        await database.init();
        console.log('🚀 قاعدة البيانات جاهزة للاستخدام');
        return database;
    } catch (error) {
        console.error('❌ فشل في تهيئة قاعدة البيانات:', error);
        throw error;
    }
}

// دالة لإضافة المستخدم الحالي
async function setupCurrentUser() {
    try {
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
            localStorage.setItem('user_id', userId);
        }

        await database.updateUserActivity(userId);
        console.log('👤 تم إعداد المستخدم الحالي:', userId);
    } catch (error) {
        console.error('❌ خطأ في إعداد المستخدم:', error);
    }
}

// تهيئة قاعدة البيانات عند تحميل الصفحة
window.addEventListener('load', async () => {
    try {
        await initializeDatabase();
        await setupCurrentUser();
        
        // تحديث الإحصائيات كل 5 دقائق
        setInterval(() => {
            database.updateStatistics();
        }, 300000);
    } catch (error) {
        console.error('❌ فشل في تحميل التطبيق:', error);
    }
});

// ============================================
// تصدير الدوال للاستخدام
// ============================================

window.database = database;
window.initializeDatabase = initializeDatabase;
window.setupCurrentUser = setupCurrentUser;

// دوال النسخ الاحتياطي
window.backupDatabase = async () => {
    const backup = await database.backupData();
    
    // تنزيل الملف
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
    
    return backup;
};

window.restoreDatabase = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const backup = JSON.parse(event.target.result);
                await database.restoreData(backup);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsText(file);
    });
};

// دالة تصدير البيانات كـ CSV
window.exportToCSV = async () => {
    const [subjects, files] = await Promise.all([
        database.getAllSubjects(),
        database.getAllFiles()
    ]);

    // تصدير المواد
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // رأس ملف المواد
    csvContent += "ID,Name,Description,Category,Files Count,Created At\n";
    subjects.forEach(subject => {
        csvContent += `${subject.id},${subject.name},${subject.description || ''},${subject.category || ''},${subject.files_count || 0},${subject.created_at}\n`;
    });

    // رأس ملف الملفات
    csvContent += "\n\nFile ID,Subject ID,File Name,File Type,File Size,Downloads,Views,Upload Date\n";
    files.forEach(file => {
        csvContent += `${file.id},${file.subject_id},${file.file_name},${file.file_type || ''},${file.file_size || ''},${file.downloads || 0},${file.views || 0},${file.upload_date}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

console.log('📦 تم تحميل قاعدة البيانات بنجاح');
