// js/appui/utils/api-fetch.js
import { getCsrfToken } from './csrf.js';
import { isSameOriginOrAllowed } from './origin-check.js';

export async function apiFetch(url, opts = {}) {
    const fetchOpts = Object.assign({}, opts);
    fetchOpts.method = (fetchOpts.method || 'GET').toUpperCase();

    if (!defaults.allowedFetchMethods.includes(fetchOpts.method)) {
        throw new Error('Method not allowed');
    }

    const token = getCsrfToken();
    if (token && isSameOriginOrAllowed(url)) {
        fetchOpts.headers = Object.assign({}, fetchOpts.headers || {}, {
            'RequestVerificationToken': token
        });
    }

    if (fetchOpts.body && typeof fetchOpts.body === 'object' && !(fetchOpts.body instanceof FormData)) {
        if (!fetchOpts.headers) fetchOpts.headers = {};
        if (!fetchOpts.headers['Content-Type']) fetchOpts.headers['Content-Type'] = 'application/json';
        fetchOpts.body = JSON.stringify(fetchOpts.body);
    }

    const res = await fetch(url, fetchOpts);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(res.statusText || 'Request failed');
        err.status = res.status;
        err.body = text;
        throw err;
    }

    return res.json().catch(() => null);
}