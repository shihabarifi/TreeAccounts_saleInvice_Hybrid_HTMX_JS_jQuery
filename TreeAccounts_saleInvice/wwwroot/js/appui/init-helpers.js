// js/appui/init-helpers.js
import { setupSelect2 } from './components/select2.js';
import { setupFlatpickr } from './components/flatpickr.js';
import { setupTooltip } from './components/tooltip.js';
import { setupDataTable } from './components/datatable.js';
import { setupDatepicker } from './components/datepicker.js';

export function initSelect2(context = document) {
    $(context).find('select[select2]').each(function () { setupSelect2(this); });
}

export function initFlatpickr(context = document) {
    $(context).find('input[data-flatpickr]').each(function () { setupFlatpickr(this); });
}

export function initTooltips(context = document) {
    $(context).find('[data-bs-toggle="tooltip"]').each(function () { setupTooltip(this); });
}

export function initDataTables(context = document) {
    $(context).find('table[data-datatable]').each(function () { setupDataTable(this); });
}

export function initDatepickers(context = document) {
    $(context).find('input[data-datepicker]').each(function () { setupDatepicker(this); });
}

export function initComponents(context = document) {
    initSelect2(context);
    initFlatpickr(context);
    initDataTables(context);
    initTooltips(context);
    initDatepickers(context);
}

export function reInitComponent(el, type) {
    switch (type) {
        case 'select2': $(el).removeData('initialized'); setupSelect2(el); break;
        case 'flatpickr': if (el._flatpickr) { el._flatpickr.destroy(); } setupFlatpickr(el); break;
        case 'datatable': $(el).removeData('dt-initialized'); setupDataTable(el); break;
        case 'tooltip': if (el._tooltip) { el._tooltip.dispose(); el._tooltip = null; } setupTooltip(el); break;
        case 'datepicker': $(el).removeData('initialized'); setupDatepicker(el); break;
        default: console.warn('Unknown type', type);
    }
}