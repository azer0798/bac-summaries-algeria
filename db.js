// إصدار محسن لقاعدة البيانات مع دعم التخزين المحلي والبعيد
class EnhancedDB {
    constructor() {
        this.dbName = 'subjects_enhanced_db';
        this.dbVersion = 2;
        this.db = null;
        this.apiBase = ''; // يمكن تعيينه لرابط API حقيقي
        this.useLocal = true; // استخدام التخزين المحلي افتراضياً
        this.init();
    }

    init() {
        if (this.useLocal) {
            return this.initIndexedDB();
        } else {
            return this.initRemoteDB();
        }
    }

    initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('❌ فشل فتح قاعدة البيانات:', event.target.error);
                this.useLocal = false;
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ تم تهيئة قاعدة البيانات المحلية');
                this.checkInitialData();
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // جدول المواد
                if (!db.objectStoreNames.contains('subjects')) {
                    const subjectsStore = db.createObjectStore('subjects', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    subjectsStore.createIndex('name', 'name', { unique: true });
                    subjectsStore.createIndex('created_at', 'created_at');
                }

                // جدول الملفات
                if (!db.objectStoreNames.contains('files')) {
                    const filesStore = db.createObjectStore('files', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    filesStore.createIndex('subject_id', 'subject_id');
                    filesStore.createIndex('file_name', 'file_name');
                    filesStore.createIndex('upload_date', 'upload_date');
                }

                // جدول المستخدمين
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    usersStore.createIndex('user_id', 'user_id', { unique: true });
                    usersStore.createIndex('username', 'username');
                    usersStore.createIndex('last_active', 'last_active');
                }

                // جدول الإحصائيات
                if (!db.objectStoreNames.contains('stats')) {
                    const statsStore = db.createObjectStore('stats', {
                        keyPath: 'id'
                    });
                }
            };
        });
    }

    async checkInitialData() {
        const subjects = await this.getAllSubjects();
        if (subjects.length === 0) {
            await this.addInitialData();
        }
    }

    async addInitialData() {
        const defaultSubjects = [
            { 
                name: 'فلسفة', 
                description: 'ملخصات ومراجعات لمادة الفلسفة',
                icon: 'fas fa-brain',
                color: '#3498db',
                created_at: new Date().toISOString()
            },
            { 
                name: 'أدب عربي', 
                description: 'ملخصات لمادة الأدب العربي',
                icon: 'fas fa-book',
                color: '#2ecc71',
                created_at: new Date().toISOString()
            },
            { 
                name: 'تاريخ', 
                description: 'مراجعات وملخصات التاريخ',
                icon: 'fas fa-landmark',
                color: '#e74c3c',
                created_at: new Date().toISOString()
            },
            { 
                name: 'جغرافيا', 
                description: 'ملخصات مادة الجغرافيا',
                icon: 'fas fa-globe-africa',
                color: '#9b59b6',
                created_at: new Date().toISOString()
            },
            { 
                name: 'علوم إسلامية', 
                description: 'مراجعات للعلوم الإسلامية',
                icon: 'fas fa-mosque',
                color: '#f39c12',
                created_at: new Date().toISOString()
            },
            { 
                name: 'لغة فرنسية', 
                description: 'ملخصات اللغة الفرنسية',
                icon: 'fas fa-language',
                color: '#1abc9c',
                created_at: new Date().toISOString()
            }
        ];

        for (const subject of defaultSubjects) {
            await this.addSubject(subject);
        }

        // إضافة ملفات تجريبية
        const defaultFiles = [
            { subject_id: 1, file_name: 'ملخص الفلسفة اليونانية.pdf', file_url: '#', file_type: 'pdf', file_size: '2.4 MB', upload_date: '2024-01-15', downloads: 150 },
            { subject_id: 1, file_name: 'أسئلة فلسفة مع الحلول.docx', file_url: '#', file_type: 'docx', file_size: '1.8 MB', upload_date: '2024-01-20', downloads: 120 },
            { subject_id: 2, file_name: 'ملخص الشعر الجاهلي.pdf', file_url: '#', file_type: 'pdf', file_size: '3.1 MB', upload_date: '2024-01-10', downloads: 200 },
            { subject_id: 3, file_name: 'تاريخ العالم الإسلامي.pdf', file_url: '#', file_type: 'pdf', file_size: '4.2 MB', upload_date: '2024-01-05', downloads: 180 },
            { subject_id: 4, file_name: 'الخرائط الجغرافية.pptx', file_url: '#', file_type: 'pptx', file_size: '5.3 MB', upload_date: '2024-01-12', downloads: 90 }
        ];

        for (const file of defaultFiles) {
            await this.addFile(file);
        }

        // إضافة مستخدم مسؤول
        await this.addUser({
            user_id: 5795991022,
            username: 'admin',
            first_name: 'المسؤول',
            role: 'admin',
            joined_at: new Date().toISOString(),
            last_active: new Date().toISOString()
        });

        console.log('✅ تم إضافة البيانات الأولية');
    }

    // === عمليات قاعدة البيانات ===

    async getAllSubjects() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve([]);
                return;
            }

            const transaction = this.db.transaction('subjects', 'readonly');
            const store = transaction.objectStore('subjects');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
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
        return new Promise((resolve, reject) => {
            // حذف ملفات المادة أولاً
            this.getFilesBySubject(id).then(files => {
                const deletePromises = files.map(file => this.deleteFile(file.id));
                Promise.all(deletePromises).then(() => {
                    const transaction = this.db.transaction('subjects', 'readwrite');
                    const store = transaction.objectStore('subjects');
                    const request = store.delete(id);

                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            });
        });
    }

    async getSubjectById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('subjects', 'readonly');
            const store = transaction.objectStore('subjects');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getFilesBySubject(subjectId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('files', 'readonly');
            const store = transaction.objectStore('files');
            const index = store.index('subject_id');
            const request = index.getAll(subjectId);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async addFile(file) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('files', 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.add(file);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFile(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('files', 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async incrementDownloadCount(fileId) {
        return new Promise(async (resolve, reject) => {
            const transaction = this.db.transaction('files', 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.get(fileId);

            request.onsuccess = () => {
                const file = request.result;
                if (file) {
                    file.downloads = (file.downloads || 0) + 1;
                    file.last_downloaded = new Date().toISOString();
                    
                    const updateRequest = store.put(file);
                    updateRequest.onsuccess = () => resolve(true);
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    resolve(false);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

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
            const request = index.get(userId);

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
            const user = await this.getUserById(userId);
            if (user) {
                user.last_active = new Date().toISOString();
                await this.addUser(user);
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    async getStatistics() {
        const [subjects, files, users] = await Promise.all([
            this.getAllSubjects(),
            this.countFiles(),
            this.getAllUsers()
        ]);

        let totalDownloads = 0;
        const allFiles = await this.getAllFiles();
        allFiles.forEach(file => {
            totalDownloads += file.downloads || 0;
        });

        return {
            totalSubjects: subjects.length,
            totalFiles: files,
            totalUsers: users.length,
            totalDownloads: totalDownloads,
            lastUpdated: new Date().toISOString()
        };
    }

    async countFiles() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('files', 'readonly');
            const store = transaction.objectStore('files');
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllFiles() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('files', 'readonly');
            const store = transaction.objectStore('files');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async searchSubjects(query) {
        const subjects = await this.getAllSubjects();
        const searchTerm = query.toLowerCase();
        
        return subjects.filter(subject => 
            subject.name.toLowerCase().includes(searchTerm) ||
            (subject.description && subject.description.toLowerCase().includes(searchTerm))
        );
    }

    async backupData() {
        const data = {
            subjects: await this.getAllSubjects(),
            files: await this.getAllFiles(),
            users: await this.getAllUsers(),
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        // حفظ النسخة الاحتياطية في LocalStorage
        localStorage.setItem('db_backup', JSON.stringify(data));
        return data;
    }

    async restoreData(backup) {
        try {
            // مسح البيانات الحالية
            const clearDB = () => {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.deleteDatabase(this.dbName);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            };

            await clearDB();
            await this.initIndexedDB();

            // استعادة البيانات
            if (backup.subjects) {
                for (const subject of backup.subjects) {
                    await this.addSubject(subject);
                }
            }

            if (backup.files) {
                for (const file of backup.files) {
                    await this.addFile(file);
                }
            }

            if (backup.users) {
                for (const user of backup.users) {
                    await this.addUser(user);
                }
            }

            return true;
        } catch (error) {
            console.error('❌ خطأ في استعادة البيانات:', error);
            return false;
        }
    }
}

// إنشاء كائن قاعدة البيانات العالمي
const database = new EnhancedDB();

// دالة مساعدة لتنزيل البيانات كملف JSON
function downloadBackup() {
    database.backupData().then(data => {
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `subjects_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });
}

// دالة مساعدة لتحميل واستعادة نسخة احتياطية
function uploadBackup(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const backup = JSON.parse(event.target.result);
                const success = await database.restoreData(backup);
                resolve(success);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('فشل قراءة الملف'));
        reader.readAsText(file);
    });
}

// تصدير الوظائف للاستخدام
window.database = database;
window.downloadBackup = downloadBackup;
window.uploadBackup = uploadBackup;

// إضافة المستخدم الحالي عند تحميل الصفحة
window.addEventListener('load', async () => {
    try {
        await database.init();
        
        // إضافة أو تحديث المستخدم الحالي
        const userId = localStorage.getItem('user_id') || `user_${Date.now()}`;
        const username = localStorage.getItem('username') || `زائر_${Math.random().toString(36).substr(2, 5)}`;
        
        const existingUser = await database.getUserById(userId);
        
        if (!existingUser) {
            await database.addUser({
                user_id: userId,
                username: username,
                first_name: 'مستخدم جديد',
                role: 'user',
                joined_at: new Date().toISOString(),
                last_active: new Date().toISOString()
            });
        } else {
            await database.updateUserActivity(userId);
        }
        
        // حفظ معرف المستخدم
        localStorage.setItem('user_id', userId);
        if (!localStorage.getItem('username')) {
            localStorage.setItem('username', username);
        }
        
        console.log('✅ تم تحميل قاعدة البيانات وإعداد المستخدم');
    } catch (error) {
        console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
    }
});
