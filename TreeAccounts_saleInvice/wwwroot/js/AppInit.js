// ==========================================================
// AppInit.js
// تهيئة المكونات (Select2, Flatpickr, DataTables, Tooltips, Datepicker)
// باستخدام Vanilla JS + تحسين الأمان والأداء
// ==========================================================

const AppInit = (() => {
    "use strict";

    // ==================== Select2 ====================
    function setupSelect2(el) {
        if (el.classList.contains("select2-hidden-accessible")) {
            if (typeof $(el).select2 === "function") {
                $(el).select2('destroy');
            }
        }

        const options = {
            placeholder: el.dataset.placeholder || "اختر قيمة",
            allowClear: el.dataset.allowClear !== "false",
            width: el.dataset.width || "100%",
            minimumResultsForSearch: Number(el.dataset.minResults) || 0
        };

        if (typeof $(el).select2 === "function") {
            $(el).select2(options);
        } else {
            console.warn("Select2 غير متوفر:", el);
        }
    }

    function initSelect2(context = document) {
        context.querySelectorAll("select[select2]").forEach(setupSelect2);
    }

    // ==================== Flatpickr ====================
    function setupFlatpickr(el) {
        if (el._flatpickr) el._flatpickr.destroy();

        const options = {
            enableTime: el.dataset.enableTime === "true",
            noCalendar: el.dataset.noCalendar === "true",
            dateFormat: el.dataset.dateFormat || "Y-m-d",
            minDate: el.dataset.minDate || null,
            maxDate: el.dataset.maxDate || null,
            locale: el.dataset.locale || "ar",
            defaultDate: el.dataset.defaultDate || null,
            time_24hr: el.dataset.time24hr === "true"
        };

        if (typeof flatpickr === "function") {
            flatpickr(el, options);
        } else {
            console.warn("Flatpickr غير متوفر:", el);
        }
    }

    function initFlatpickr(context = document) {
        context.querySelectorAll("input[data-flatpickr]").forEach(setupFlatpickr);
    }

    // ==================== Bootstrap Tooltip ====================
    function setupTooltip(el) {
        if (el._tooltip) el._tooltip.dispose();

        const options = {
            placement: el.dataset.placement || "top",
            trigger: el.dataset.trigger || "hover focus",
            html: el.dataset.html === "true",
            boundary: el.dataset.boundary || "viewport"
        };

        try {
            el._tooltip = new bootstrap.Tooltip(el, options);
        } catch (err) {
            console.warn("Bootstrap Tooltip غير متوفر:", err);
        }
    }

    function initTooltips(context = document) {
        context.querySelectorAll("[data-bs-toggle='tooltip']").forEach(setupTooltip);
    }

    // ==================== DataTables ====================
    function setupDataTable(el) {
        try {
            if ($.fn.DataTable.isDataTable(el)) {
                $(el).DataTable().destroy();
            }
        } catch {
            console.warn("DataTables غير متوفر:", el);
            return;
        }

        const defaultButtons = ["print", "csv", "excel", "pdf", "copy"];
        const buttonsMap = {
            print: { extend: "print", text: "🖨 Print", className: "dropdown-item" },
            csv: { extend: "csv", text: "📄 CSV", className: "dropdown-item" },
            excel: { extend: "excel", text: "📊 Excel", className: "dropdown-item" },
            pdf: { extend: "pdf", text: "📕 PDF", className: "dropdown-item" },
            copy: { extend: "copy", text: "📋 Copy", className: "dropdown-item" }
        };

        // --- قراءة إعداد التصدير
        const exportAttr = el.getAttribute("data-export");
        let enableExport = true;
        let exportButtons = [];

        if (exportAttr === null) {
            exportButtons = defaultButtons.map(b => buttonsMap[b]);
        } else if (exportAttr === "false") {
            enableExport = false;
        } else if (exportAttr === "true" || exportAttr === "") {
            exportButtons = defaultButtons.map(b => buttonsMap[b]);
        } else {
            exportButtons = exportAttr.split(",")
                .map(x => x.trim())
                .filter(x => buttonsMap[x])
                .map(k => buttonsMap[k]);
        }

        // --- DOM Layout (بجانب أزرار التصدير نضيف div فارغ للأزرار المخصصة)
        const dom =
            '<"row mx-2"' +
            '<"col-md-2"l>' +
            '<"col-md-10 d-flex justify-content-end gap-2"' +
            '<"dt-search"f>' +
            (enableExport ? '<"dt-export-buttons"B>' : '') +
            '<"dt-custom-buttons">' + // مكان الأزرار المخصصة
            '>' +
            '>t' +
            '<"row mx-2"' +
            '<"col-sm-6"i><"col-sm-6"p>>';

        // --- خيارات الجدول
        const options = {
            paging: el.dataset.paging !== "false",
            searching: el.dataset.searching !== "false",
            info: el.dataset.info !== "false",
            pageLength: parseInt(el.dataset.pageLength || "10", 10),
            responsive: el.dataset.responsive !== "false",
            dom,
            language: {
                url: el.dataset.langUrl || null,
                search: "",
                searchPlaceholder: "ابحث.."
            },
            buttons: enableExport ? [{
                extend: "collection",
                className: "btn btn-secondary dropdown-toggle",
                text: "⬇ Export",
                buttons: exportButtons
            }] : [],
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "الكل"]]
        };

        const dt = $(el).DataTable(options);

        // --- أزرار مخصصة
        const customAttr = el.getAttribute("data-custom-buttons");
        if (!customAttr) return dt;

        let customButtons;
        try {
            customButtons = JSON.parse(customAttr);
            if (!Array.isArray(customButtons)) throw new Error("data-custom-buttons يجب أن يكون مصفوفة JSON");
        } catch (err) {
            console.error("خطأ في قراءة data-custom-buttons:", err);
            return dt;
        }

        // --- المكان المستهدف
        const wrapper = el.closest(".dataTables_wrapper");
        let target = wrapper.querySelector(".dt-custom-buttons");
        if (!target) {
            target = document.createElement("div");
            target.className = "dt-custom-buttons";
            wrapper.querySelector(".dt-action-buttons")?.appendChild(target);
        }

        // --- بناء الأزرار
        customButtons.forEach(btn => {
            const text = btn.text || "Button";
            const btnClass = btn.class || "btn btn-primary";
            const button = document.createElement("button");
            button.type = "button";
            button.className = `${btnClass} mx-1`;
            button.textContent = text;

            // action: modal
            if (btn.action === "modal" && btn.target) {
                button.addEventListener("click", () => {
                    try {
                        const modal = document.querySelector(btn.target);
                        if (modal) new bootstrap.Modal(modal).show();
                    } catch (err) {
                        console.error("فشل فتح المودال:", err);
                    }
                });
            }
            // action: url
            else if (btn.action === "url" && btn.url) {
                button.addEventListener("click", async () => {
                    try {
                        const method = (btn.method || "GET").toUpperCase();
                        const opts = { method };
                        if (btn.headers) opts.headers = btn.headers;
                        if (btn.body) opts.body = JSON.stringify(btn.body);

                        const res = await fetch(btn.url, opts);
                        if (!res.ok) throw new Error("HTTP error " + res.status);
                        const data = await res.json().catch(() => null);

                        console.log("Response:", data);
                        if (btn.onSuccessMessage) alert(btn.onSuccessMessage);
                    } catch (err) {
                        console.error("خطأ أثناء الاتصال:", err);
                        if (btn.onErrorMessage) alert(btn.onErrorMessage);
                    }
                });
            }
            // action: function
            else if (btn.action === "function" && btn.name) {
                button.addEventListener("click", () => {
                    try {
                        const fn = window[btn.name];
                        if (typeof fn === "function") fn(el, dt);
                        else console.warn("الدالة غير معرفة:", btn.name);
                    } catch (err) {
                        console.error("خطأ داخل الدالة المخصصة:", err);
                    }
                });
            }
            // fallback
            else {
                button.addEventListener("click", () => {
                    console.warn("لا action معرّف:", btn);
                });
            }

            target.appendChild(button);
        });

        return dt;
    }


    function initDataTables(context = document) {
        context.querySelectorAll("table[data-datatable]").forEach(setupDataTable);
    }

    // ==================== Bootstrap Datepicker ====================
    function setupDatepicker(el) {
        try {
            if ($(el).data("datepicker")) {
                $(el).datepicker("destroy");
            }
            $(el).datepicker({
                format: el.dataset.format || "yyyy-mm-dd",
                autoclose: el.dataset.autoclose !== "false",
                todayHighlight: el.dataset.todayHighlight !== "false",
                startDate: el.dataset.startDate || null,
                endDate: el.dataset.endDate || null,
                language: el.dataset.locale || "ar"
            });
        } catch {
            console.warn("Bootstrap Datepicker غير متوفر:", el);
        }
    }

    function initDatepickers(context = document) {
        context.querySelectorAll("input[data-datepicker]").forEach(setupDatepicker);
    }

    // ==================== Master Init ====================
    function initComponents(context = document) {
        initSelect2(context);
        initFlatpickr(context);
        initTooltips(context);
        initDataTables(context);
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
    document.body.addEventListener("htmx:load", evt => initComponents(evt.target));

    // ==================== Initial Load ====================
    document.addEventListener("DOMContentLoaded", () => initComponents());

    // Expose Public API
    return {
        initComponents,
        reInitComponent
    };
})();
