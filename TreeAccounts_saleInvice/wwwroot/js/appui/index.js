// js/appui/index.js
import { defaults } from './config.js';
import { initComponents, reInitComponent } from './init-helpers.js';
import { apiFetch } from './utils/api-fetch.js';
import { createButtonElement } from './components/button-creator.js';
import { attachHtmx } from './htmx-integration.js';

const AppUI = (function () {
    return {
        init: function (opts) {
            Object.assign(defaults, opts || {});
            $(document).ready(() => {
                initComponents();
                attachHtmx();
            });
        },
        initComponents,
        reInitComponent,
        apiFetch,
        createButtonElement,
        config: function (opts) { Object.assign(defaults, opts || {}); }
    };
})();

export default AppUI;