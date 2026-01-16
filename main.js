
import './menu-list.js';
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const menuItemsCollection = collection(db, 'menuItems');

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
    this.menuItems = [];
    this.loadMenuItems();
  }

  async loadMenuItems() {
    const querySnapshot = await getDocs(menuItemsCollection);
    if (querySnapshot.empty) {
        const defaultItems = [
            { name: "피자", category: "양식" },
            { name: "햄버거", category: "양식" },
            { name: "초밥", category: "일식" },
            { name: "김치찌개", category: "한식" },
            { name: "파스타", category: "양식" },
            { name: "치킨", category: "한식" },
            { name: "떡볶이", category: "한식" },
            { name: "짜장면", category: "중식" },
            { name: "삼겹살", category: "한식" },
            { name: "부대찌개", category: "한식" }
        ];
        for (const item of defaultItems) {
            await addDoc(menuItemsCollection, item);
        }
        this.menuItems = defaultItems.map(item => ({ ...item, id: doc.id }));
    } else {
        this.menuItems = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    }
    this.render();
  }

  render() {
    const categories = ['All', ...new Set(this.menuItems.map(item => item.category))];
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
            ? this.menuItems 
            : this.menuItems.filter(item => item.category === this.selectedCategory);
        
        if (filteredItems.length === 0) {
            menuDisplay.innerHTML = `<p>추천할 메뉴가 없습니다.</p>`;
        } else {
            const randomIndex = Math.floor(Math.random() * filteredItems.length);
            menuDisplay.innerHTML = `<p>${filteredItems[randomIndex].name}</p>`;
        }
        menuDisplay.classList.remove('spinning');
    }, 1000);
  }

    addMenuItem(item) {
        this.menuItems.push(item);
        this.render();
    }

    deleteMenuItem(id) {
        this.menuItems = this.menuItems.filter(item => item.id !== id);
        this.render();
    }
}

class MenuAdder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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

  async addMenu() {
    const input = this.shadowRoot.getElementById('new-menu-input');
    const categorySelect = this.shadowRoot.getElementById('category-select');
    const newMenuName = input.value.trim();
    const newMenuCategory = categorySelect.value;
    if (newMenuName) {
        const q = query(menuItemsCollection, where("name", "==", newMenuName));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            const docRef = await addDoc(menuItemsCollection, { name: newMenuName, category: newMenuCategory });
            this.dispatchEvent(new CustomEvent('menu-added', { detail: { id: docRef.id, name: newMenuName, category: newMenuCategory } }));
            input.value = '';
        } else {
            this.dispatchEvent(new CustomEvent('show-toast', { detail: "이미 존재하는 메뉴입니다." }));
        }
    } else {
        this.dispatchEvent(new CustomEvent('show-toast', { detail: "추가할 메뉴를 입력해주세요." }));
    }
  }
}

customElements.define('menu-recommender', MenuRecommender);
customElements.define('menu-adder', MenuAdder);


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

    if (adder && recommender && toast && menuList) {
        adder.addEventListener('menu-added', event => {
            recommender.addMenuItem(event.detail);
            menuList.addMenuItem(event.detail);
            toast.show(`"${event.detail.name}" 메뉴가 추가되었습니다!`);
        });

        adder.addEventListener('show-toast', event => {
            toast.show(event.detail);
        });

        document.addEventListener('menu-deleted', async event => {
            await deleteDoc(doc(db, "menuItems", event.detail.id));
            recommender.deleteMenuItem(event.detail.id);
            toast.show(`"${event.detail.name}" 메뉴가 삭제되었습니다.`);
        });
    } else {
        console.error('One or more components are missing from the DOM.');
    }
});
