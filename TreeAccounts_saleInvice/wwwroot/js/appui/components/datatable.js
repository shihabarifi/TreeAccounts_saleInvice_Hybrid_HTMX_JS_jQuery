// js/appui/components/datatable.js
import { validateExportButtons } from './export-buttons.js';
import { createButtonElement } from './button-creator.js';
import { safeParseButtons } from '../utils/safe-parse-buttons.js';

export function setupDataTable(el) {
    if ($(el).data('dt-initialized')) return $(el).DataTable();

    const defaultButtons = ['print', 'csv', 'excel', 'pdf', 'copy'];
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