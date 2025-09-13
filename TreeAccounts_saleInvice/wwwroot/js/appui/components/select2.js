// ==================== Select2 ====================
// js/appui/components/select2.js
export function setupSelect2(el) {
    if ($(el).data('initialized')) return;
    $(el).select2({
        placeholder: $(el).data('placeholder') || 'اختر قيمة',
        allowClear: $(el).data('allow-clear') !== false,
        width: $(el).data('width') || '100%',
        minimumResultsForSearch: $(el).data('min-results') || 0
    });
    $(el).data('initialized', true);
}
