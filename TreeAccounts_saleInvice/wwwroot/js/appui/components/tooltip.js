// ==================== Bootstrap Tooltip ====================
// js/appui/components/tooltip.js
export function setupTooltip(el) {
    if (el._tooltip) return;
    el._tooltip = new bootstrap.Tooltip(el, {
        placement: el.dataset.placement || 'top',
        trigger: el.dataset.trigger || 'hover focus',
        html: el.dataset.html === 'true',
        boundary: el.dataset.boundary || 'viewport'
    });
    $(el).data('initialized', true);
}