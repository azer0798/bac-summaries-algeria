// قاعدة البيانات المحلية باستخدام IndexedDB
class SubjectDB {
    constructor() {
        this.dbName = 'subjects_db';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('فشل فتح قاعدة البيانات:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ تم تهيئة قاعدة البيانات');
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
                }

                // جدول الملفات
                if (!db.objectStoreNames.contains('files')) {
                    const filesStore = db.createObjectStore('files', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    filesStore.createIndex('subject_id', 'subject_id');
                    filesStore.createIndex('file_name', 'file_name');
                }

                // جدول المستخدمين
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', {
                        keyPath: 'user_id'
                    });
                    usersStore.createIndex('username', 'username');
                }

                // بيانات تجريبية
                this.addInitialData(db);
            };
        });
    }

    addInitialData(db) {
        // إضافة مواد تجريبية
        const subjects = [
            { name: 'فلسفة', description: 'ملخصات ومراجعات لمادة الفلسفة' },
            { name: 'أدب عربي', description: 'ملخصات لمادة الأدب العربي' },
            { name: 'تاريخ', description: 'مراجعات وملخصات التاريخ' },
            { name: 'جغرافيا', description: 'ملخصات مادة الجغرافيا' },
            { name: 'علوم إسلامية', description: 'مراجعات للعلوم الإسلامية' },
            { name: 'لغة فرنسية', description: 'ملخصات اللغة الفرنسية' }
        ];

        const subjectsStore = db.transaction('subjects', 'readwrite').objectStore('subjects');
        subjects.forEach(subject => {
            subjectsStore.add(subject);
        });

        // إضافة ملفات تجريبية
        const files = [
            { subject_id: 1, file_name: 'ملخص الفلسفة اليونانية.pdf', file_url: '#', upload_date: '2024-01-15' },
            { subject_id: 1, file_name: 'أسئلة فلسفة مع الحلول.docx', file_url: '#', upload_date: '2024-01-20' },
            { subject_id: 2, file_name: 'ملخص الشعر الجاهلي.pdf', file_url: '#', upload_date: '2024-01-10' },
            { subject_id: 3, file_name: 'تاريخ العالم الإسلامي.pdf', file_url: '#', upload_date: '2024-01-05' }
        ];

        const filesStore = db.transaction('files', 'readwrite').objectStore('files');
        files.forEach(file => {
            filesStore.add(file);
        });

        // إضافة مستخدم تجريبي (المسؤول)
        const usersStore = db.transaction('users', 'readwrite').objectStore('users');
        usersStore.add({
            user_id: 5795991022,
            username: 'admin',
            first_name: 'المسؤول',
            role: 'admin',
            joined_at: new Date().toISOString()
        });
    }

    // المواد
    async getAllSubjects() {
        return new Promise((resolve, reject) => {
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

    async deleteSubject(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('subjects', 'readwrite');
            const store = transaction.objectStore('subjects');
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
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

    // الملفات
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

    async countFiles() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('files', 'readonly');
            const store = transaction.objectStore('files');
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // المستخدمين
    async addUser(user) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('users', 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.put(user);

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

    async countUsers() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('users', 'readonly');
            const store = transaction.objectStore('users');
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserById(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('users', 'readonly');
            const store = transaction.objectStore('users');
            const request = store.get(parseInt(userId));

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // إحصائيات
    async getStatistics() {
        const [userCount, subjectCount, fileCount] = await Promise.all([
            this.countUsers(),
            this.getAllSubjects().then(subjects => subjects.length),
            this.countFiles()
        ]);

        return {
            userCount,
            subjectCount,
            fileCount
        };
    }
}

// إنشاء كائن قاعدة البيانات عالمي
const database = new SubjectDB();

// دالة لإضافة المستخدم الحالي
async function addCurrentUser() {
    const userId = localStorage.getItem('user_id') || Date.now();
    const username = localStorage.getItem('username') || 'زائر';
    
    await database.addUser({
        user_id: parseInt(userId),
        username: username,
        first_name: username,
        role: 'user',
        joined_at: new Date().toISOString(),
        last_active: new Date().toISOString()
    });

    localStorage.setItem('user_id', userId);
    if (!localStorage.getItem('username')) {
        localStorage.setItem('username', username);
    }
}

// تحديث نشاط المستخدم
function updateUserActivity() {
    const userId = localStorage.getItem('user_id');
    if (userId) {
        database.getUserById(userId).then(user => {
            if (user) {
                user.last_active = new Date().toISOString();
                database.addUser(user);
            }
        });
    }
}

// استدعاء دالة إضافة المستخدم عند تحميل الصفحة
window.addEventListener('load', () => {
    setTimeout(() => {
        addCurrentUser();
        updateUserActivity();
    }, 1000);
});
