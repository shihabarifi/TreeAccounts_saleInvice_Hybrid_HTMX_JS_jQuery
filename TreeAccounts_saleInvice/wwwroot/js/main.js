﻿// AppUI.js - نسخة محسَّنة: أمان، أداء، صيانة، مرونة

const AppUI = (function () {
    // ==========================
    // 1. الإعدادات الافتراضية (Configurable defaults)
    // ==========================
    const defaults = {
        csrfMetaName: 'csrf-token',              // اسم الميتا تاج للـ CSRF
        csrfInputName: '__RequestVerificationToken', // اسم الحقل المخفي كبديل
        allowedButtonActions: ['modal', 'url', 'function'], // الإجراءات المسموحة للأزرار
        allowedFetchMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // طرق fetch المسموحة
        allowedExportButtons: ['print', 'csv', 'excel', 'pdf', 'copy'], // أزرار التصدير المسموحة
        permittedOrigins: null                     // قائمة أصول مسموحة للـ fetch
    };

    // ==========================
    // 2. الأدوات المساعدة (Utilities)
    // ==========================

    // الحصول على توكن CSRF من الميتا تاج أو الحقل المخفي
    function getCsrfToken() {
        const meta = document.querySelector(`meta[name="${defaults.csrfMetaName}"]`);
        if (meta && meta.content) return meta.content;

        const input = document.querySelector(`input[name="${defaults.csrfInputName}"]`);
        if (input && input.value) return input.value;

        return null;
    }

    // تحويل النص إلى آمن لمنع XSS
    function safeText(str) {
        const d = document.createElement('div');
        d.textContent = String(str ?? '');
        return d.innerHTML;
    }

    // التحقق من نفس الأصل أو السماح بالأصل المحدد
    function isSameOriginOrAllowed(url) {
        try {
            const u = new URL(url, location.href);
            if (defaults.permittedOrigins && Array.isArray(defaults.permittedOrigins)) {
                return defaults.permittedOrigins.includes(u.origin);
            } else {
                return u.origin === location.origin;
            }
        } catch (e) {
            return false;
        }
    }

    // تحليل JSON للأزرار مع التحقق من الصحة
    function safeParseButtons(jsonStr) {
        try {
            const parsed = JSON.parse(jsonStr);
            if (!Array.isArray(parsed)) return [];
            return parsed
                .map(b => {
                    if (!b || typeof b !== 'object') return null;
                    const action = String(b.action || '').trim();
                    if (!defaults.allowedButtonActions.includes(action)) return null;
                    return {
                        text: safeText(b.text || 'Button'),
                        class: String(b.class || 'btn btn-primary'),
                        action,
                        target: b.target,
                        url: b.url,
                        method: b.method ? String(b.method).toUpperCase() : 'GET',
                        headers: b.headers && typeof b.headers === 'object' ? b.headers : null,
                        body: b.body || null,
                        fn: typeof b.fn === 'function' ? b.fn : null,
                        onSuccessMessage: b.onSuccessMessage ? String(b.onSuccessMessage) : null,
                        onErrorMessage: b.onErrorMessage ? String(b.onErrorMessage) : null
                    };
                })
                .filter(Boolean);
        } catch (e) {
            console.error('فشل تحليل JSON الخاص بالأزرار');
            return [];
        }
    }

    // fetch آمن مع إضافة CSRF والتعامل مع JSON
    async function apiFetch(url, opts = {}) {
        const fetchOpts = Object.assign({}, opts);
        fetchOpts.method = (fetchOpts.method || 'GET').toUpperCase();

        if (!defaults.allowedFetchMethods.includes(fetchOpts.method)) {
            throw new Error('Method not allowed');
        }

        // إضافة توكن CSRF
        const token = getCsrfToken();
        if (token && isSameOriginOrAllowed(url)) {
            fetchOpts.headers = Object.assign({}, fetchOpts.headers || {}, {
                'RequestVerificationToken': token
            });
        }

        // تحويل الجسم إلى JSON إذا كان كائنًا
        if (fetchOpts.body && typeof fetchOpts.body === 'object' && !(fetchOpts.body instanceof FormData)) {
            if (!fetchOpts.headers) fetchOpts.headers = {};
            if (!fetchOpts.headers['Content-Type']) fetchOpts.headers['Content-Type'] = 'application/json';
            fetchOpts.body = JSON.stringify(fetchOpts.body);
        }

        const res = await fetch(url, fetchOpts);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            const err = new Error(res.statusText || 'Request failed');
            err.status = res.status;
            err.body = text;
            throw err;
        }

        return res.json().catch(() => null);
    }

    // ==========================
    // 3. إعداد المكونات (Component setup)
    // ==========================

    // تهيئة select2
    function setupSelect2(el) {
        if ($(el).data('initialized')) return;
        $(el).select2({
            placeholder: $(el).data('placeholder') || 'اختر قيمة',
            allowClear: $(el).data('allow-clear') !== false,
            width: $(el).data('width') || '100%',
            minimumResultsForSearch: $(el).data('min-results') || 0
        });
        $(el).data('initialized', true);
    }

    // تهيئة flatpickr
    function setupFlatpickr(el) {
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
            catch (e) {}
        }
        flatpickr(el, options);
        $(el).data('initialized', true);
    }

    // تهيئة tooltips
    function setupTooltip(el) {
        if (el._tooltip) return;
        el._tooltip = new bootstrap.Tooltip(el, {
            placement: el.dataset.placement || 'top',
            trigger: el.dataset.trigger || 'hover focus',
            html: el.dataset.html === 'true',
            boundary: el.dataset.boundary || 'viewport'
        });
        $(el).data('initialized', true);
    }

    // تهيئة export buttons
    function validateExportButtons(exportAttr) {
        if (!exportAttr) return defaults.allowedExportButtons.map(b => b);
        if (exportAttr.toLowerCase() === 'false') return [];
        const allowed = exportAttr.split(',').map(x => x.trim()).filter(Boolean);
        return allowed.filter(k => defaults.allowedExportButtons.includes(k)).map(k => k);
    }

    // إنشاء زر بأمان مع دعم CSRF و fetch وأيقونات
    function createButtonElement(btnDef) {
        const btn = Object.assign({}, btnDef); // نسخة سطحية
        const text = safeText(btn.text || 'Button');
        const btnClass = btn.class || 'btn btn-primary';

        // دمج الأيقونة مع النص إذا كانت موجودة
        let htmlContent = '';
        if (btn.icon) {
            htmlContent = `<i class="${btn.icon} me-1"></i> ${text}`;
        } else {
            htmlContent = text;
        }

        const $btn = $(`<button type="button" class="${btnClass} mx-1">${htmlContent}</button>`);

        const action = String(btn.action || '').trim();
        if (!defaults.allowedButtonActions.includes(action)) {
            $btn.on('click', () => console.warn('Button action not allowed', action));
            return $btn;
        }

        if (action === 'modal' && btn.target) {
            $btn.on('click', () => { try { $(btn.target).modal('show'); } catch (e) { } });
        } else if (action === 'url' && btn.url) {
            const method = (btn.method || 'GET').toUpperCase();
            if (!defaults.allowedFetchMethods.includes(method) || !isSameOriginOrAllowed(btn.url)) {
                $btn.on('click', () => console.warn('URL or method not allowed'));
                return $btn;
            }
            $btn.on('click', async () => {
                try {
                    const fetchOpts = { method };
                    if (btn.headers) fetchOpts.headers = btn.headers;
                    if (btn.body) fetchOpts.body = btn.body;
                    const data = await apiFetch(btn.url, fetchOpts);
                    if (btn.onSuccessMessage) alert(btn.onSuccessMessage);
                    if (typeof btn.onSuccess === 'function') btn.onSuccess(data);
                } catch (err) {
                    if (btn.onErrorMessage) alert(btn.onErrorMessage);
                    if (typeof btn.onError === 'function') btn.onError(err);
                }
            });
        } else if (action === 'function' && typeof btn.fn === 'function') {
            $btn.on('click', () => { try { btn.fn(); } catch (e) { } });
        } else {
            $btn.on('click', () => console.warn('No valid action for button', btn));
        }

        return $btn;
    }


    // ==========================
    // 4. تهيئة DataTable
    // ==========================
    function setupDataTable(el) {
        if ($(el).data('dt-initialized')) return $(el).DataTable();

        const defaultButtons = ['print', 'csv', 'excel', 'pdf', 'copy'];
        // تعديل أزرار التصدير DataTable لتدعم أيقونات
        const buttonsMap = {
            print: { extend: 'print', text: '<i class="fas fa-print me-1"></i>Print', className: 'dropdown-item' },
            csv: { extend: 'csv', text: '<i class="fas fa-file-csv me-1"></i>Csv', className: 'dropdown-item' },
            excel: { extend: 'excel', text: '<i class="fas fa-file-excel me-1"></i>Excel', className: 'dropdown-item' },
            pdf: { extend: 'pdf', text: '<i class="fas fa-file-pdf me-1"></i>Pdf', className: 'dropdown-item' },
            copy: { extend: 'copy', text: '<i class="fas fa-copy me-1"></i>Copy', className: 'dropdown-item' }
        };

        const exportAttr = $(el).attr('data-export');
        const exportKeys = validateExportButtons(exportAttr);
        const exportButtons = exportKeys.map(k => buttonsMap[k]);

        const domLayout = '<"row mx-2"<"col-md-2"<"me-3"l>><"col-md-10 dt-action-buttons d-flex align-items-center justify-content-end gap-2"<"dt-search"f>' +
            (exportButtons.length ? '<"dt-export-buttons"B>' : '') +
            '<"dt-custom-buttons">' +
            '> >t<"row mx-2"<"col-sm-12 col-md-6"i><"col-sm-12 col-md-6"p>>';

        const dt = $(el).DataTable({
            order: $(el).data('order') || [[1, 'ASC']],
            dom: domLayout,
            language: { sLengthMenu: '_MENU_', search: '', searchPlaceholder: $(el).data('search-placeholder') || 'Search..' },
            buttons: exportButtons.length ? [
                {
                    extend: 'collection',
                    className: 'btn btn-label-secondary dropdown-toggle',
                    text: '<i class="bi bi-box-arrow-up me-1"></i> Export',
                    buttons: exportButtons
                }
            ] : [],
            lengthMenu: $(el).data('length-menu') || [[10, 25, 50, -1], [10, 25, 50, 'الكل']],
            paging: $(el).data('paging') !== false,
            searching: $(el).data('searching') !== false,
            info: $(el).data('info') !== false,
            responsive: $(el).data('responsive') !== false,
            scrollX: $(el).data('scroll-x') || false
        });

        const customAttr = $(el).attr('data-custom-buttons');
        if (customAttr) {
            const customButtons = safeParseButtons(customAttr);
            if (customButtons.length) {
                const fragment = $(document.createDocumentFragment());
                customButtons.forEach(btn => fragment.append(createButtonElement(btn)));
                let $target = $(el).closest('.dataTables_wrapper').find('.dt-custom-buttons');
                if ($target.length === 0) {
                    $(el).closest('.dataTables_wrapper').find('.dt-action-buttons').append('<div class="dt-custom-buttons"></div>');
                    $target = $(el).closest('.dataTables_wrapper').find('.dt-custom-buttons');
                }
                $target.append(fragment);
            }
        }

        $(el).data('dt-initialized', true);
        return dt;
    }

    // ==========================
    // 5. Bootstrap datepicker
    // ==========================
    function setupDatepicker(el) {
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

    // ==========================
    // 6. تهيئة جميع المكونات (Init helpers)
    // ==========================
    function initSelect2(context = document) { $(context).find('select[select2]').each(function () { setupSelect2(this); }); }
    function initFlatpickr(context = document) { $(context).find('input[data-flatpickr]').each(function () { setupFlatpickr(this); }); }
    function initTooltips(context = document) { $(context).find('[data-bs-toggle="tooltip"]').each(function () { setupTooltip(this); }); }
    function initDataTables(context = document) { $(context).find('table[data-datatable]').each(function () { setupDataTable(this); }); }
    function initDatepickers(context = document) { $(context).find('input[data-datepicker]').each(function () { setupDatepicker(this); }); }

    function initComponents(context = document) {
        initSelect2(context);
        initFlatpickr(context);
        initDataTables(context);
        initTooltips(context);
        initDatepickers(context);
    }

    // إعادة تهيئة مكون معين
    function reInitComponent(el, type) {
        switch (type) {
            case 'select2': $(el).removeData('initialized'); setupSelect2(el); break;
            case 'flatpickr': if (el._flatpickr) { el._flatpickr.destroy(); } setupFlatpickr(el); break;
            case 'datatable': $(el).removeData('dt-initialized'); setupDataTable(el); break;
            case 'tooltip': if (el._tooltip) { el._tooltip.dispose(); el._tooltip = null; } setupTooltip(el); break;
            case 'datepicker': $(el).removeData('initialized'); setupDatepicker(el); break;
            default: console.warn('Unknown type', type);
        }
    }

    // ==========================
    // 7. تكامل مع HTMX
    // ==========================
    function attachHtmx() {
        document.body.addEventListener('htmx:load', function (e) { initComponents(e.target); });
        document.body.addEventListener('htmx:configRequest', (event) => {
            const token = getCsrfToken();
            if (token) event.detail.headers['RequestVerificationToken'] = token;
        });
    }

    // ==========================
    // 8. API العامة (Public API)
    // ==========================
    return {
        init: function (opts) {
            Object.assign(defaults, opts || {});
            $(document).ready(() => {
                initComponents();
                attachHtmx();
            });
        },
        initComponents,
        reInitComponent,
        apiFetch,
        createButtonElement,
        config: function (opts) { Object.assign(defaults, opts || {}); }
    };
})();
