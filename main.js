// =================================================================================
// I18n State & Logic
// =================================================================================

const i18nState = {
    currentLang: 'ko',
    translations: {},
};

async function loadTranslations(lang) {
    try {
        const response = await fetch(`./locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Could not load ${lang}.json`);
        }
        i18nState.translations = await response.json();
        i18nState.currentLang = lang;
        localStorage.setItem('preferredLang', lang);
        updateUI();
    } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to a default language if loading fails
        if (lang !== 'en') {
            loadTranslations('en');
        }
    }
}

function t(key, replacements = {}) {
    let text = i18nState.translations[key] || key;
    for (const placeholder in replacements) {
        text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return text;
}


// =================================================================================
// Data Store
// =================================================================================

let menuItems = [
    { id: 1, name: "피자", category: "western" },
    { id: 2, name: "햄버거", category: "western" },
    { id: 3, name: "초밥", category: "japanese" },
    { id: 4, name: "김치찌개", category: "korean" },
    { id: 5, name: "파스타", category: "western" },
    { id: 6, name: "치킨", category: "korean" },
    { id: 7, name: "떡볶이", category: "korean" },
    { id: 8, name: "짜장면", category: "chinese" },
    { id: 9, name: "삼겹살", category: "korean" },
    { id: 10, name: "부대찌개", category: "korean" }
];
let nextId = 11;

// =================================================================================
// Web Components
// =================================================================================

class NotificationToast extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .toast {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: var(--card-background, rgba(0, 0, 0, 0.8));
                    color: var(--text-color, white);
                    padding: 16px 24px;
                    border-radius: 8px;
                    z-index: 1000;
                    opacity: 0;
                    font-weight: 600;
                    transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: 0 4px 12px var(--shadow-color, rgba(0, 0, 0, 0.1));
                    text-align: center;
                    width: 90%;
                    max-width: 400px;
                }
                .toast.show {
                    opacity: 1;
                    bottom: 40px;
                }
            </style>
            <div class="toast"></div>
        `;
    }

    show(message) {
        const toast = this.shadowRoot.querySelector('.toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

customElements.define('notification-toast', NotificationToast);

class MenuRecommender extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.selectedCategory = 'All';
  }
  
  connectedCallback() {
      this.render();
  }

  render() {
    const categories = ['All', ...new Set(menuItems.map(item => item.category))];
    this.shadowRoot.innerHTML = `
      <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinning { animation: spin 1s ease-in-out; }
        .card { background: var(--card-background); border-radius: 16px; padding: 24px; box-shadow: 0 8px 32px var(--shadow-color); text-align: center; margin-bottom: 20px; transition: background-color 0.3s ease, box-shadow 0.3s ease; }
        h2 { font-size: 1.8rem; }
        #menu-display { margin-bottom: 24px; font-size: 24px; font-weight: bold; color: var(--text-color); min-height: 30px; }
        #recommend-btn { background: linear-gradient(45deg, var(--primary-color), var(--secondary-color)); color: var(--button-text-color); border: none; border-radius: 8px; padding: 12px 24px; font-size: 16px; cursor: pointer; transition: transform 0.2s ease, background 0.3s ease; display: inline-flex; align-items: center; gap: 8px; }
        #recommend-btn:hover { transform: scale(1.05); }
        .category-filters { margin-bottom: 20px; display: flex; flex-wrap: wrap; justify-content: center; }
        .category-btn { background: var(--card-background); color: var(--text-color); border: 1px solid var(--shadow-color); border-radius: 20px; padding: 8px 16px; margin: 4px; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 8px; }
        .category-btn.active { background: var(--primary-color); color: var(--button-text-color); border-color: var(--primary-color); }
        .category-btn svg { width: 16px; height: 16px; }
        @media (max-width: 768px) { .card { padding: 16px; } h2 { font-size: 1.5rem; } #menu-display { font-size: 20px; } #recommend-btn { padding: 10px 20px; font-size: 14px; } .category-btn { padding: 6px 12px; font-size: 12px; } }
      </style>
      <div class="card">
        <h2 data-i18n="appTitle">${t('appTitle')}</h2>
        <div class="category-filters">
            ${categories.map(category => `<button class="category-btn ${this.selectedCategory === category ? 'active' : ''}" data-category="${category}">${this.getCategoryIcon(category)} ${t(category.toLowerCase()) || category}</button>`).join('')}
        </div>
        <div id="menu-display"><p>${t('pressButton')}</p></div>
        <button id="recommend-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shuffle"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="16 16 21 16 21 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="11" y2="11"></line></svg>
            <span data-i18n="recommendButton">${t('recommendButton')}</span>
        </button>
      </div>
    `;

    this.shadowRoot.getElementById('recommend-btn').addEventListener('click', () => this.recommendMenu());
    this.shadowRoot.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => this.updateCategory(e.currentTarget.dataset.category));
    });
  }

    getCategoryIcon(category) {
        const icons = { 'All': '🌐', 'korean': '🇰🇷', 'chinese': '🇨🇳', 'japanese': '🇯🇵', 'western': '🍝', 'other': '❓' };
        return icons[category] || '❓';
    }

    updateCategory(category) {
        this.selectedCategory = category;
        this.render();
    }

    recommendMenu() {
        const menuDisplay = this.shadowRoot.getElementById('menu-display');
        menuDisplay.innerHTML = `<p>🤔</p>`;
        menuDisplay.classList.add('spinning');

        setTimeout(() => {
            const filteredItems = this.selectedCategory === 'All' 
                ? menuItems 
                : menuItems.filter(item => item.category === this.selectedCategory);
            
            if (filteredItems.length === 0) {
                menuDisplay.innerHTML = `<p>${t('noRecommendations')}</p>`;
            } else {
                const randomIndex = Math.floor(Math.random() * filteredItems.length);
                menuDisplay.innerHTML = `<p>${filteredItems[randomIndex].name}</p>`;
            }
            menuDisplay.classList.remove('spinning');
        }, 1000);
    }
}

customElements.define('menu-recommender', MenuRecommender);

class MenuAdder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
      this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .card { background: var(--card-background); border-radius: 16px; padding: 24px; box-shadow: 0 8px 32px var(--shadow-color); text-align: center; transition: background-color 0.3s ease, box-shadow 0.3s ease; }
        h2 { font-size: 1.8rem; }
        #new-menu-input, #category-select { box-sizing: border-box; width: 100%; padding: 12px; border: 1px solid var(--shadow-color); border-radius: 8px; margin-bottom: 16px; background-color: var(--background-color); color: var(--text-color); }
        #add-menu-btn { background: linear-gradient(45deg, var(--accent-color), #9599E2); color: var(--button-text-color); border: none; border-radius: 8px; padding: 12px 24px; font-size: 16px; cursor: pointer; transition: transform 0.2s ease, background 0.3s ease; display: inline-flex; align-items: center; gap: 8px; width: 100%; justify-content: center; }
        #add-menu-btn:hover { transform: scale(1.02); }
        @media (max-width: 768px) { .card { padding: 16px; } h2 { font-size: 1.5rem; } #new-menu-input, #category-select { padding: 10px; font-size: 14px; } #add-menu-btn { padding: 10px 20px; font-size: 14px; } }
      </style>
      <div class="card">
        <h2 data-i18n="addMenuTitle">${t('addMenuTitle')}</h2>
        <input type="text" id="new-menu-input" data-i18n-placeholder="addMenuPlaceholder" placeholder="${t('addMenuPlaceholder')}">
        <select id="category-select">
            <option value="korean" data-i18n="korean">${t('korean')}</option>
            <option value="chinese" data-i18n="chinese">${t('chinese')}</option>
            <option value="japanese" data-i18n="japanese">${t('japanese')}</option>
            <option value="western" data-i18n="western">${t('western')}</option>
            <option value="other" data-i18n="other">${t('other')}</option>
        </select>
        <button id="add-menu-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span data-i18n="addButton">${t('addButton')}</span>
        </button>
      </div>
    `;

    this.shadowRoot.getElementById('add-menu-btn').addEventListener('click', () => this.addMenu());
  }

  addMenu() {
    const input = this.shadowRoot.getElementById('new-menu-input');
    const categorySelect = this.shadowRoot.getElementById('category-select');
    const newMenuName = input.value.trim();
    const newMenuCategory = categorySelect.value;
    if (newMenuName) {
        const isDuplicate = menuItems.some(item => item.name === newMenuName);
        if (!isDuplicate) {
            const newItem = { id: nextId++, name: newMenuName, category: newMenuCategory };
            this.dispatchEvent(new CustomEvent('menu-added', { detail: newItem, bubbles: true, composed: true }));
            input.value = '';
        } else {
            this.dispatchEvent(new CustomEvent('show-toast', { detail: t('toastDuplicate'), bubbles: true, composed: true }));
        }
    } else {
        this.dispatchEvent(new CustomEvent('show-toast', { detail: t('toastEnterMenu'), bubbles: true, composed: true }));
    }
  }
}

customElements.define('menu-adder', MenuAdder);

class MenuList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const menuItemsByCategory = menuItems.reduce((acc, item) => {
            const categoryKey = item.category.toLowerCase();
            if (!acc[categoryKey]) {
                acc[categoryKey] = [];
            }
            acc[categoryKey].push(item);
            return acc;
        }, {});

        this.shadowRoot.innerHTML = `
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
                .fade-in { animation: fadeIn 0.5s ease-in-out; }
                .fade-out { animation: fadeOut 0.5s ease-in-out; }
                .card { background: var(--card-background); border-radius: 16px; padding: 24px; box-shadow: 0 8px 32px var(--shadow-color); text-align: left; margin-top: 20px; grid-column: 1 / -1; }
                h2 { font-size: 1.8rem; margin-top: 0; }
                h3 { color: var(--primary-color); margin-top: 20px; border-bottom: 2px solid var(--shadow-color); padding-bottom: 10px; font-size: 1.2rem; }
                h3:first-of-type { margin-top: 0; }
                ul { list-style: none; padding: 0; margin: 0; }
                li { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; color: var(--text-color); font-size: 16px; }
                .delete-btn { background: none; border: none; cursor: pointer; color: var(--accent-color); font-size: 20px; }
                @media (max-width: 768px) { .card { padding: 16px; margin-top: 0; } h2 { font-size: 1.5rem; } h3 { font-size: 1.1rem; padding-bottom: 8px; } li { font-size: 14px; } .delete-btn { font-size: 18px; } }
            </style>
            <div class="card">
                <h2 data-i18n="menuListTitle">${t('menuListTitle')}</h2>
                ${Object.keys(menuItemsByCategory).sort().map(category => `
                    <div>
                        <h3 data-i18n="${category}">${t(category)}</h3>
                        <ul data-category="${category}">
                            ${menuItemsByCategory[category].map(item => `
                                <li class="fade-in" data-id="${item.id}">
                                    <span>${item.name}</span>
                                    <button class="delete-btn" data-id="${item.id}" data-name="${item.name}">&times;</button>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;

        this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteMenu(e.currentTarget.dataset.id, e.currentTarget.dataset.name));
        });
    }

    deleteMenu(id, name) {
        if (confirm(t('deleteConfirm', { menuName: name }))) {
            const listItem = this.shadowRoot.querySelector(`li[data-id="${id}"]`);
            listItem.classList.add('fade-out');
            setTimeout(() => {
                this.dispatchEvent(new CustomEvent('menu-deleted', { detail: { id: parseInt(id), name }, bubbles: true, composed: true }));
            }, 500);
        }
    }
}

customElements.define('menu-list', MenuList);

class PartnershipForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.formspreeEndpoint = 'https://formspree.io/f/meeeeqzy';
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .card {
                    background: var(--card-background);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 8px 32px var(--shadow-color);
                    text-align: left;
                    margin-top: 20px;
                }
                h2 {
                    font-size: 1.8rem;
                    margin-top: 0;
                    text-align: center;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    color: var(--text-color);
                    font-weight: 600;
                }
                input[type="text"],
                input[type="email"],
                textarea {
                    width: calc(100% - 22px); /* Adjust for padding and border */
                    padding: 10px;
                    border: 1px solid var(--shadow-color);
                    border-radius: 8px;
                    background-color: var(--background-color);
                    color: var(--text-color);
                    box-sizing: border-box; /* Include padding and border in the element's total width and height */
                }
                textarea {
                    resize: vertical;
                    min-height: 100px;
                }
                button[type="submit"] {
                    background: linear-gradient(45deg, var(--accent-color), #9599E2);
                    color: var(--button-text-color);
                    border: none;
                    border-radius: 8px;
                    padding: 12px 24px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: transform 0.2s ease, background 0.3s ease;
                    width: 100%;
                    margin-top: 10px;
                }
                button[type="submit"]:hover {
                    transform: scale(1.02);
                }
                button[type="submit"]:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .error-message {
                    color: var(--primary-color);
                    font-size: 0.9em;
                    margin-top: 5px;
                    display: none;
                }

                @media (max-width: 768px) {
                    .card {
                        padding: 16px;
                    }
                    h2 {
                        font-size: 1.5rem;
                    }
                    input[type="text"],
                    input[type="email"],
                    textarea {
                        padding: 8px;
                        font-size: 14px;
                    }
                    button[type="submit"] {
                        padding: 10px 20px;
                        font-size: 14px;
                    }
                }
            </style>
            <div class="card">
                <h2 data-i18n="formTitle">Form Title</h2>
                <form id="partnership-form">
                    <div class="form-group">
                        <label for="name" data-i18n="formNameLabel">Name</label>
                        <input type="text" id="name" name="name" required data-i18n-placeholder="formNamePlaceholder">
                        <div class="error-message" data-error-for="name"></div>
                    </div>
                    <div class="form-group">
                        <label for="email" data-i18n="formEmailLabel">Email</label>
                        <input type="email" id="email" name="email" required data-i18n-placeholder="formEmailPlaceholder">
                        <div class="error-message" data-error-for="email"></div>
                    </div>
                    <div class="form-group">
                        <label for="message" data-i18n="formMessageLabel">Message</label>
                        <textarea id="message" name="message" required data-i18n-placeholder="formMessagePlaceholder"></textarea>
                        <div class="error-message" data-error-for="message"></div>
                    </div>
                    <button type="submit" data-i18n="formSubmitButton">Submit</button>
                </form>
            </div>
        `;

        this.shadowRoot.getElementById('partnership-form').addEventListener('submit', this.handleSubmit.bind(this));
        // Initial i18n update for placeholders
        this.updateI18nPlaceholders();
    }

    updateI18nPlaceholders() {
        this.shadowRoot.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.dataset.i18nPlaceholder);
        });
        this.shadowRoot.querySelector('[data-i18n="formTitle"]').textContent = t('formTitle');
        this.shadowRoot.querySelector('[data-i18n="formNameLabel"]').textContent = t('formNameLabel');
        this.shadowRoot.querySelector('[data-i18n="formEmailLabel"]').textContent = t('formEmailLabel');
        this.shadowRoot.querySelector('[data-i18n="formMessageLabel"]').textContent = t('formMessageLabel');
        this.shadowRoot.querySelector('[data-i18n="formSubmitButton"]').textContent = t('formSubmitButton');
    }

    async handleSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const submitButton = this.shadowRoot.querySelector('button[type="submit"]');

        this.clearErrors();

        let isValid = true;
        // Simple client-side validation
        if (!formData.get('name')) {
            this.showError('name', t('formValidationErrorName'));
            isValid = false;
        }
        if (!formData.get('email') || !this.isValidEmail(formData.get('email'))) {
            this.showError('email', t('formValidationErrorEmail'));
            isValid = false;
        }
        if (!formData.get('message')) {
            this.showError('message', t('formValidationErrorRequired'));
            isValid = false;
        }

        if (!isValid) {
            this.dispatchEvent(new CustomEvent('show-toast', { detail: t('formValidationErrorGeneric'), bubbles: true, composed: true }));
            return;
        }

        submitButton.disabled = true;

        try {
            const response = await fetch(this.formspreeEndpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                form.reset();
                this.dispatchEvent(new CustomEvent('show-toast', { detail: t('formSubmitSuccess'), bubbles: true, composed: true }));
            } else {
                const data = await response.json();
                if (data.errors) {
                    data.errors.forEach(error => {
                        this.showError(error.field, error.message);
                    });
                } else {
                    this.dispatchEvent(new CustomEvent('show-toast', { detail: t('formSubmitError'), bubbles: true, composed: true }));
                }
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.dispatchEvent(new CustomEvent('show-toast', { detail: t('formSubmitError'), bubbles: true, composed: true }));
        } finally {
            submitButton.disabled = false;
        }
    }

    isValidEmail(email) {
        // Basic email regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    showError(field, message) {
        const errorElement = this.shadowRoot.querySelector(`[data-error-for="${field}"]`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearErrors() {
        this.shadowRoot.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }
}

customElements.define('partnership-form', PartnershipForm);


// =================================================================================
// Main App Logic
// =================================================================================

function updateUI() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    // Re-render components (Shadow DOM components manage their own i18n after initial render)
    // For custom elements, calling render() updates their internal Shadow DOM
    document.querySelector('menu-recommender')?.render();
    document.querySelector('menu-adder')?.render();
    document.querySelector('menu-list')?.render();
    document.querySelector('partnership-form')?.updateI18nPlaceholders(); // Call specific update method for form
}

document.addEventListener('DOMContentLoaded', () => {
    const recommender = document.querySelector('menu-recommender');
    const adder = document.querySelector('menu-adder');
    const toast = document.querySelector('notification-toast');
    const menuList = document.querySelector('menu-list');
    const themeToggle = document.getElementById('theme-toggle');
    const langSelect = document.getElementById('lang-select');
    const commentsRefresh = document.getElementById('comments-refresh');
    const commentsOpen = document.getElementById('comments-open');
    const commentsLoading = document.getElementById('comments-loading');
    const disqusThread = document.getElementById('disqus_thread');
    const htmlEl = document.documentElement;

    // Theme setup
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    htmlEl.setAttribute('data-theme', savedTheme);
    themeToggle.addEventListener('click', () => {
        const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    if (commentsRefresh) {
        commentsRefresh.addEventListener('click', () => {
            if (window.DISQUS) {
                window.DISQUS.reset({
                    reload: true,
                    config: window.disqus_config
                });
            } else {
                window.location.reload();
            }
        });
    }

    if (commentsOpen && window.disqusShortname && window.disqusThreadId) {
        commentsOpen.href = `https://disqus.com/home/discussion/${window.disqusShortname}/${window.disqusThreadId}/`;
    }

    if (disqusThread && commentsLoading) {
        const hideLoading = () => {
            commentsLoading.style.display = 'none';
        };
        if (disqusThread.querySelector('iframe')) {
            hideLoading();
        } else {
            const observer = new MutationObserver(() => {
                if (disqusThread.querySelector('iframe')) {
                    hideLoading();
                    observer.disconnect();
                }
            });
            observer.observe(disqusThread, { childList: true, subtree: true });
        }
    }

    // I18n setup
    langSelect.addEventListener('change', (e) => {
        loadTranslations(e.target.value);
    });
    
    const preferredLang = localStorage.getItem('preferredLang') || navigator.language.split('-')[0];
    const initialLang = ['en', 'ko'].includes(preferredLang) ? preferredLang : 'en';
    langSelect.value = initialLang;
    loadTranslations(initialLang);
    

    // Centralized event listener
    document.addEventListener('show-toast', event => {
        toast.show(event.detail);
    });

    document.addEventListener('menu-added', event => {
        menuItems.push(event.detail);
        recommender.render();
        menuList.render();
        toast.show(t('toastMenuAdded', { menuName: event.detail.name }));
    });

    document.addEventListener('menu-deleted', event => {
        menuItems = menuItems.filter(item => item.id !== event.detail.id);
        recommender.render();
        menuList.render();
        toast.show(t('toastMenuDeleted', { menuName: event.detail.name }));
    });
});
