// ==================== Select2 ====================
function setupSelect2(el) {
    if ($(el).hasClass("select2-hidden-accessible")) {
        $(el).select2('destroy');
    }

    let options = {
        placeholder: $(el).data('placeholder') || 'اختر قيمة',
        allowClear: $(el).data('allow-clear') !== false,
        width: $(el).data('width') || '100%',
        minimumResultsForSearch: $(el).data('min-results') || 0
    };

    $(el).select2(options);
}

function initSelect2(context = document) {
    $(context).find('select[select2]').each(function () {
        setupSelect2(this);
    });
}

// ==================== Flatpickr ====================
function setupFlatpickr(el) {
    if (el._flatpickr) el._flatpickr.destroy();

    let options = {
        enableTime: $(el).data('enable-time') || false,
        noCalendar: $(el).data('no-calendar') || false,
        dateFormat: $(el).data('date-format') || "Y-m-d",
        minDate: $(el).data('min-date') || null,
        maxDate: $(el).data('max-date') || null,
        locale: $(el).data('locale') || "ar",
        defaultDate: $(el).data('default-date') || null,
        time_24hr: $(el).data('time-24hr') || false
    };

    flatpickr(el, options);
}

function initFlatpickr(context = document) {
    $(context).find('input[data-flatpickr]').each(function () {
        setupFlatpickr(this);
    });
}

// ==================== Bootstrap Tooltip ====================
function setupTooltip(el) {
    if (el._tooltip) el._tooltip.dispose();

    let options = {
        placement: el.dataset.placement || "top",
        trigger: el.dataset.trigger || "hover focus",
        html: el.dataset.html === "true",
        boundary: el.dataset.boundary || "viewport"
    };

    el._tooltip = new bootstrap.Tooltip(el, options);
}

function initTooltips(context = document) {
    $(context).find('[data-bs-toggle="tooltip"]').each(function () {
        setupTooltip(this);
    });
}

// ==================== DataTables (مرن مع custom buttons) ====================
function setupDataTable(el) {
    if ($.fn.DataTable.isDataTable(el)) $(el).DataTable().destroy();
    const $el = $(el);

    // --- إعداد خرائط الأزرار الأساسية ---
    const defaultButtons = ["print", "csv", "excel", "pdf", "copy"];
    const buttonsMap = {
        print: { extend: 'print', text: '<i class="bx bx-printer me-2"></i>Print', className: 'dropdown-item' },
        csv: { extend: 'csv', text: '<i class="bx bx-file me-2"></i>Csv', className: 'dropdown-item' },
        excel: { extend: 'excel', text: 'Excel', className: 'dropdown-item' },
        pdf: { extend: 'pdf', text: '<i class="bx bxs-file-pdf me-2"></i>Pdf', className: 'dropdown-item' },
        copy: { extend: 'copy', text: '<i class="bx bx-copy me-2"></i>Copy', className: 'dropdown-item' }
    };

    // --- قراءة data-export بدقة (attr لا data عشان نميز عدم الوجود) ---
    let exportAttr = $el.attr('data-export'); // undefined إذا غير موجود
    let enableExport = true;
    let exportButtons = [];

    if (typeof exportAttr === 'undefined') {
        // لم يُذكر -> الافتراض: كل الأزرار
        exportButtons = defaultButtons.map(b => buttonsMap[b]);
    } else {
        const v = String(exportAttr).trim().toLowerCase();
        if (v === 'false') {
            enableExport = false;
        } else if (v === 'true' || v === '') {
            exportButtons = defaultButtons.map(b => buttonsMap[b]);
        } else {
            const allowed = v.split(',').map(x => x.trim()).filter(x => x.length);
            allowed.forEach(k => {
                if (buttonsMap[k]) exportButtons.push(buttonsMap[k]);
            });
        }
    }

    // ---------------- DOM: نضمن div للأزرار المخصصة (.dt-custom-buttons) ----------------
    const dom =
        '<"row mx-2"' +
        '<"col-md-2"<"me-3"l>>' +
        '<"col-md-10 dt-action-buttons d-flex align-items-center justify-content-end gap-2"' +
        '<"dt-search"f>' +
        (enableExport ? '<"dt-export-buttons"B>' : '') + // مكان زر التصدير إن كان مفعل
        '<"dt-custom-buttons">' +                        // مكان للأزرار المخصصة (دايمًا موجود)
        '>' +
        '>t' +
        '<"row mx-2"' +
        '<"col-sm-12 col-md-6"i>' +
        '<"col-sm-12 col-md-6"p>' +
        '>';

    // ---------------- خيارات DataTable ----------------
    const options = {
        paging: $el.data('paging') !== false,
        searching: $el.data('searching') !== false,
        info: $el.data('info') !== false,
        order: [[1, 'ASC']],
        pageLength: $el.data('page-length') || 10,
        responsive: $el.data('responsive') !== false,
        dom: dom,
        language: {
            url: $el.data('lang-url') || null,
            sLengthMenu: '_MENU_',
            search: '',
            searchPlaceholder: 'Search..'
        },
        buttons: enableExport ? [{
            extend: 'collection',
            className: 'btn btn-label-secondary dropdown-toggle',
            text: '<i class="bx bx-upload me-2"></i>Export',
            buttons: exportButtons
        }] : [],
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "الكل"]]
    };

    // --- تهيئة DataTable ---
    const dt = $el.DataTable(options);

    // ---------------- إضافة الأزرار المخصصة من data-custom-buttons ----------------
    const customAttr = $el.attr('data-custom-buttons');
    if (!customAttr) return dt; // لا أزرار مخصصة => انتهى

    let customButtons;
    try {
        customButtons = JSON.parse(customAttr);
        if (!Array.isArray(customButtons)) throw new Error('data-custom-buttons يجب أن يكون مصفوفة JSON');
    } catch (err) {
        console.error('خطأ في قراءة data-custom-buttons (JSON):', err);
        return dt; // لا نكسر جدول DataTable، فقط نتوقف عن إضافة الأزرار
    }

    // الهدف: العنصر داخل wrapper الخاص بالـ DataTable
    const $wrapper = $el.closest('.dataTables_wrapper');
    let $target = $wrapper.find('.dt-custom-buttons');
    if ($target.length === 0) {
        // كاحتياط، إن لم يوجد أنشئ واحد داخل dt-action-buttons
        const $act = $wrapper.find('.dt-action-buttons').first();
        if ($act.length) {
            $act.append('<div class="dt-custom-buttons"></div>');
            $target = $wrapper.find('.dt-custom-buttons');
        } else {
            // كحل أخير: ضف إلى أعلى الـ wrapper
            $wrapper.prepend('<div class="dt-custom-buttons mb-2"></div>');
            $target = $wrapper.find('.dt-custom-buttons').first();
        }
    }

    // بناء الأزرار وتنفيذ نوع الأكشن
    customButtons.forEach(btn => {
        const text = btn.text || 'Button';
        const btnClass = btn.class || 'btn btn-primary';
        const $btn = $(`<button type="button" class="${btnClass} mx-1">${text}</button>`);

        // action: modal -> افتح مودال (Bootstrap)
        if (btn.action === 'modal' && btn.target) {
            $btn.on('click', () => $(btn.target).modal('show'));
        }
        // action: url -> استدعاء URL (fetch)
        else if (btn.action === 'url' && btn.url) {
            $btn.on('click', () => {
                // خيارات اختيارية: method, headers, body
                const method = (btn.method || 'GET').toUpperCase();
                const fetchOpts = { method };
                if (btn.headers) fetchOpts.headers = btn.headers;
                if (btn.body) fetchOpts.body = JSON.stringify(btn.body);

                fetch(btn.url, fetchOpts)
                    .then(res => {
                        if (!res.ok) throw new Error('Network response was not ok');
                        return res.json().catch(() => null);
                    })
                    .then(data => {
                        console.log('Custom button fetched:', data);
                        if (btn.onSuccessMessage) alert(btn.onSuccessMessage);
                    })
                    .catch(err => {
                        console.error('Error fetching URL for custom button:', err);
                        if (btn.onErrorMessage) alert(btn.onErrorMessage);
                    });
            });
        }
        // action: function -> استدعاء دالة اسمها global (window[btn.name])
        else if (btn.action === 'function' && btn.name) {
            $btn.on('click', () => {
                const fn = window[btn.name];
                if (typeof fn === 'function') {
                    try { fn($el, dt); } catch (e) { console.error('خطأ داخل الدالة المخصصة:', e); }
                } else {
                    console.warn('الدالة غير معرفة على window:', btn.name);
                }
            });
        }
        // fallback: لا action معرفة
        else {
            $btn.on('click', () => console.warn('no action defined for custom button', btn));
        }

        $target.append($btn);
    });

    return dt;
}

function initDataTables(context = document) {
    $(context).find('table[data-datatable]').each(function () {
        setupDataTable(this);
    });
}


// ==================== Bootstrap Datepicker ====================
function setupDatepicker(el) {
    if ($(el).data("datepicker")) $(el).datepicker("destroy");

    let options = {
        format: $(el).data('format') || "yyyy-mm-dd",
        autoclose: $(el).data('autoclose') !== false,
        todayHighlight: $(el).data('today-highlight') !== false,
        startDate: $(el).data('start-date') || null,
        endDate: $(el).data('end-date') || null,
        language: $(el).data('locale') || "ar"
    };

    $(el).datepicker(options);
}

function initDatepickers(context = document) {
    $(context).find('input[data-datepicker]').each(function () {
        setupDatepicker(this);
    });
}

// ==================== Master Init ====================
function initComponents(context = document) {
    initSelect2(context);
    initFlatpickr(context);
    initDataTables(context);
    initTooltips(context);
    initDatepickers(context);
}

// ==================== Re-Init API ====================
function reInitComponent(el, type) {
    switch (type) {
        case "select2": setupSelect2(el); break;
        case "flatpickr": setupFlatpickr(el); break;
        case "datatable": setupDataTable(el); break;
        case "tooltip": setupTooltip(el); break;
        case "datepicker": setupDatepicker(el); break;
        default: console.warn("نوع غير معروف:", type);
    }
}

// ==================== HTMX Integration ====================
document.body.addEventListener("htmx:load", function (evt) {
    initComponents(evt.target);
});

// ==================== Initial Load ====================
$(document).ready(function () {
    initComponents();
});
