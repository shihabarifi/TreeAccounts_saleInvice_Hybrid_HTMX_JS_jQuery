// js/appui/components/export-buttons.js
import { defaults } from '../config.js';

export function validateExportButtons(exportAttr) {
    if (!exportAttr) return defaults.allowedExportButtons.map(b => b);
    if (exportAttr.toLowerCase() === 'false') return [];
    const allowed = exportAttr.split(',').map(x => x.trim()).filter(Boolean);
    return allowed.filter(k => defaults.allowedExportButtons.includes(k)).map(k => k);
}