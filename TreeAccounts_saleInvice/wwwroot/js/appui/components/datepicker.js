// ==================== Bootstrap Datepicker ====================
// js/appui/components/datepicker.js
export function setupDatepicker(el) {
    if ($(el).data('initialized')) return;
    if ($(el).data('datepicker')) $(el).datepicker('destroy');
    $(el).datepicker({
        format: $(el).data('format') || 'yyyy-mm-dd',
        autoclose: $(el).data('autoclose') !== false,
        todayHighlight: $(el).data('today-highlight') !== false,
        startDate: $(el).data('start-date') || null,
        endDate: $(el).data('end-date') || null,
        language: $(el).data('locale') || 'ar'
    });
    $(el).data('initialized', true);
}
