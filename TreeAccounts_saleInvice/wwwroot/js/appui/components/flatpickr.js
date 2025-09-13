// ==================== Flatpickr ====================
// js/appui/components/flatpickr.js
export function setupFlatpickr(el) {
    const options = {
        enableTime: $(el).data('enable-time') || false,
        noCalendar: $(el).data('no-calendar') || false,
        dateFormat: $(el).data('date-format') || 'Y-m-d',
        minDate: $(el).data('min-date') || null,
        maxDate: $(el).data('max-date') || null,
        locale: $(el).data('locale') || 'ar',
        defaultDate: $(el).data('default-date') || null,
        time_24hr: $(el).data('time-24hr') || false
    };

    if (el._flatpickr) {
        try { el._flatpickr.set(options); $(el).data('initialized', true); return; }
        catch (e) { }
    }
    flatpickr(el, options);
    $(el).data('initialized', true);
}
