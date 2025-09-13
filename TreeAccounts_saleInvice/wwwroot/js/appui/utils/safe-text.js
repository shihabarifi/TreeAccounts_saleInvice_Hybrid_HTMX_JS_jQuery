// js/appui/utils/safe-text.js
export function safeText(str) {
    const d = document.createElement('div');
    d.textContent = String(str ?? '');
    return d.innerHTML;
}