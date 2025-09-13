// ==================== config ====================
// js/appui/config.js
 //# الإعدادات الافتراضية
const defaults = {
    csrfMetaName: 'csrf-token',
    csrfInputName: '__RequestVerificationToken',
    allowedButtonActions: ['modal', 'url', 'function'],
    allowedFetchMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedExportButtons: ['print', 'csv', 'excel', 'pdf', 'copy'],
    permittedOrigins: null
};

export { defaults };
