// js/appui/utils/csrf.js
import { defaults } from '../config.js';

export function getCsrfToken() {
    const meta = document.querySelector(`meta[name="${defaults.csrfMetaName}"]`);
    if (meta && meta.content) return meta.content;

    const input = document.querySelector(`input[name="${defaults.csrfInputName}"]`);
    if (input && input.value) return input.value;

    return null;
}