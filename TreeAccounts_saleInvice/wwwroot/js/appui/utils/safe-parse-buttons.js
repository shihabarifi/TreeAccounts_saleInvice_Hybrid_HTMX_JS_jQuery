// js/appui/utils/safe-parse-buttons.js
import { defaults } from '../config.js';
import { safeText } from './safe-text.js';

export function safeParseButtons(jsonStr) {
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