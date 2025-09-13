// js/appui/utils/origin-check.js
import { defaults } from '../config.js';

export function isSameOriginOrAllowed(url) {
    try {
        const u = new URL(url, location.href);
        if (defaults.permittedOrigins && Array.isArray(defaults.permittedOrigins)) {
            return defaults.permittedOrigins.includes(u.origin);
        } else {
            return u.origin === location.origin;
        }
    } catch (e) {
        return false;
    }
}