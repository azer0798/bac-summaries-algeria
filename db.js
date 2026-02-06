// في class EnhancedDB أضف:
async addPDFFile(fileData) {
    return new Promise((resolve, reject) => {
        const transaction = this.db.transaction('pdf_files', 'readwrite');
        const store = transaction.objectStore('pdf_files');
        const request = store.add(fileData);

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

async getPDFFileById(fileId) {
    return new Promise((resolve, reject) => {
        const transaction = this.db.transaction('pdf_files', 'readonly');
        const store = transaction.objectStore('pdf_files');
        const request = store.get(parseInt(fileId));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// في init وأضف:
if (!db.objectStoreNames.contains('pdf_files')) {
    const pdfStore = db.createObjectStore('pdf_files', {
        keyPath: 'id',
        autoIncrement: true
    });
    pdfStore.createIndex('subject_id', 'subject_id');
    pdfStore.createIndex('file_name', 'file_name');
    pdfStore.createIndex('upload_date', 'upload_date');
}
