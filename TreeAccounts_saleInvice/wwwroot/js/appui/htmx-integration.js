// js/appui/htmx-integration.js
import { initComponents } from './init-helpers.js';
import { getCsrfToken } from './utils/csrf.js';

export function attachHtmx() {
    document.body.addEventListener('htmx:load', function (e) { initComponents(e.target); });
    document.body.addEventListener('htmx:configRequest', (event) => {
        const token = getCsrfToken();
        if (token) event.detail.headers['RequestVerificationToken'] = token;
    });
}