// js/appui/components/button-creator.js
import { createButtonElement } from './button-creator.js'; // سيتم تعريفه هنا
import { safeParseButtons } from '../utils/safe-parse-buttons.js';
import { apiFetch } from '../utils/api-fetch.js';
import { safeText } from '../utils/safe-text.js';
import { defaults } from '../config.js';
import { isSameOriginOrAllowed } from '../utils/origin-check.js';

export function createButtonElement(btnDef) {
    const btn = Object.assign({}, btnDef);
    const text = safeText(btn.text || 'Button');
    const btnClass = btn.class || 'btn btn-primary';

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