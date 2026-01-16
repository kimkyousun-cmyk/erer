// =================================================================================
// Data Store
// =================================================================================

let menuItems = [
    { id: 1, name: "피자", category: "양식" },
    { id: 2, name: "햄버거", category: "양식" },
    { id: 3, name: "초밥", category: "일식" },
    { id: 4, name: "김치찌개", category: "한식" },
    { id: 5, name: "파스타", category: "양식" },
    { id: 6, name: "치킨", category: "한식" },
    { id: 7, name: "떡볶이", category: "한식" },
    { id: 8, name: "짜장면", category: "중식" },
    { id: 9, name: "삼겹살", category: "한식" },
    { id: 10, name: "부대찌개", category: "한식" }
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
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .spinning {
            animation: spin 1s ease-in-out;
        }
        .card {
          background: var(--card-background);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px var(--shadow-color);
          text-align: center;
          margin-bottom: 20px; 
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }
        #menu-display {
          margin-bottom: 24px;
          font-size: 24px;
          font-weight: bold;
          color: var(--text-color);
          min-height: 30px;
        }
        #recommend-btn {
          background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
          color: var(--button-text-color);
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        #recommend-btn:hover {
          transform: scale(1.05);
        }
        .category-filters {
            margin-bottom: 20px;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
        }
        .category-btn {
            background: var(--card-background);
            color: var(--text-color);
            border: 1px solid var(--shadow-color);
            border-radius: 20px;
            padding: 8px 16px;
            margin: 4px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .category-btn.active {
            background: var(--primary-color);
            color: var(--button-text-color);
            border-color: var(--primary-color);
        }
        .category-btn svg {
            width: 16px;
            height: 16px;
        }
      </style>
      <div class="card">
        <h2>오늘 뭐 먹지?</h2>
        <div class="category-filters">
            ${categories.map(category => `<button class="category-btn ${this.selectedCategory === category ? 'active' : ''}" data-category="${category}">${this.getCategoryIcon(category)} ${category}</button>`).join('')}
        </div>
        <div id="menu-display"><p>버튼을 눌러주세요</p></div>
        <button id="recommend-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shuffle"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="16 16 21 16 21 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="11" y2="11"></line></svg>
            메뉴 추천
        </button>
      </div>
    `;

    this.shadowRoot.getElementById('recommend-btn').addEventListener('click', () => this.recommendMenu());
    this.shadowRoot.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => this.updateCategory(e.currentTarget.dataset.category));
    });
  }

    getCategoryIcon(category) {
        const icons = {
            'All': '🌐',
            '한식': '🇰🇷',
            '중식': '🇨🇳',
            '일식': '🇯🇵',
            '양식': '🍝',
            '기타': '❓'
        };
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
                menuDisplay.innerHTML = `<p>추천할 메뉴가 없습니다.</p>`;
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
        .card {
          background: var(--card-background);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px var(--shadow-color);
          text-align: center;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }
        #new-menu-input {
          width: calc(100% - 24px);
          padding: 12px;
          border: 1px solid var(--shadow-color);
          border-radius: 8px;
          margin-bottom: 16px;
          background-color: var(--background-color);
          color: var(--text-color);
        }
        #category-select {
            width: calc(100% - 24px);
            padding: 12px;
            border: 1px solid var(--shadow-color);
            border-radius: 8px;
            margin-bottom: 16px;
            background-color: var(--background-color);
            color: var(--text-color);
        }
        #add-menu-btn {
          background: linear-gradient(45deg, var(--accent-color), #9599E2);
          color: var(--button-text-color);
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        #add-menu-btn:hover {
          transform: scale(1.05);
        }
      </style>
      <div class="card">
        <h2>새로운 메뉴 추가</h2>
        <input type="text" id="new-menu-input" placeholder="예: 닭갈비">
        <select id="category-select">
            <option value="한식">한식</option>
            <option value="중식">중식</option>
            <option value="일식">일식</option>
            <option value="양식">양식</option>
            <option value="기타">기타</option>
        </select>
        <button id="add-menu-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            추가
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
            this.dispatchEvent(new CustomEvent('show-toast', { detail: "이미 존재하는 메뉴입니다.", bubbles: true, composed: true }));
        }
    } else {
        this.dispatchEvent(new CustomEvent('show-toast', { detail: "추가할 메뉴를 입력해주세요.", bubbles: true, composed: true }));
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
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});

        this.shadowRoot.innerHTML = `
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                .fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                .fade-out {
                    animation: fadeOut 0.5s ease-in-out;
                }
                .card {
                    background: var(--card-background);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 8px 32px var(--shadow-color);
                    text-align: left;
                    margin-top: 20px;
                    grid-column: 1 / -1;
                }
                h3 {
                    color: var(--primary-color);
                    margin-top: 0;
                    border-bottom: 2px solid var(--shadow-color);
                    padding-bottom: 10px;
                }
                ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                li {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    color: var(--text-color);
                }
                .delete-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--accent-color);
                    font-size: 16px;
                }
            </style>
            <div class="card">
                <h2>메뉴 목록</h2>
                ${Object.keys(menuItemsByCategory).map(category => `
                    <div>
                        <h3>${category}</h3>
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
        if (confirm(`"${name}" 메뉴를 정말 삭제하시겠습니까?`)) {
            const listItem = this.shadowRoot.querySelector(`li[data-id="${id}"]`);
            listItem.classList.add('fade-out');
            setTimeout(() => {
                this.dispatchEvent(new CustomEvent('menu-deleted', { detail: { id: parseInt(id), name }, bubbles: true, composed: true }));
            }, 500);
        }
    }
}

customElements.define('menu-list', MenuList);


// =================================================================================
// Main App Logic
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    const recommender = document.querySelector('menu-recommender');
    const adder = document.querySelector('menu-adder');
    const toast = document.querySelector('notification-toast');
    const menuList = document.querySelector('menu-list');
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    htmlEl.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Centralized event listener
    document.addEventListener('show-toast', event => {
        toast.show(event.detail);
    });

    document.addEventListener('menu-added', event => {
        menuItems.push(event.detail);
        recommender.render();
        menuList.render();
        toast.show(`"${event.detail.name}" 메뉴가 추가되었습니다!`);
    });

    document.addEventListener('menu-deleted', event => {
        menuItems = menuItems.filter(item => item.id !== event.detail.id);
        recommender.render();
        menuList.render();
        toast.show(`"${event.detail.name}" 메뉴가 삭제되었습니다.`);
    });
    
    // Initial render
    recommender.render();
    menuList.render();
});