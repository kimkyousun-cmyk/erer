
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
    this.loadMenuItems();
    this.render();
  }

  loadMenuItems() {
      const savedItems = localStorage.getItem('menuItems');
      if (savedItems) {
          this.menuItems = JSON.parse(savedItems);
      } else {
          this.menuItems = [
            "피자", "햄버거", "초밥", "김치찌개", "파스타",
            "치킨", "떡볶이", "짜장면", "삼겹살", "부대찌개"
          ];
      }
  }

  saveMenuItems() {
      localStorage.setItem('menuItems', JSON.stringify(this.menuItems));
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
        }
        #recommend-btn:hover {
          transform: scale(1.05);
        }
      </style>
      <div class="card">
        <h2>오늘 뭐 먹지?</h2>
        <div id="menu-display"><p>버튼을 눌러주세요</p></div>
        <button id="recommend-btn">메뉴 추천</button>
      </div>
    `;

    this.shadowRoot.getElementById('recommend-btn').addEventListener('click', () => this.recommendMenu());
  }

  recommendMenu() {
    const menuDisplay = this.shadowRoot.getElementById('menu-display');
    const randomIndex = Math.floor(Math.random() * this.menuItems.length);
    menuDisplay.innerHTML = `<p>${this.menuItems[randomIndex]}</p>`;
  }

    addMenuItem(item) {
        if (item && !this.menuItems.includes(item)) {
            this.menuItems.push(item);
            this.saveMenuItems();
            return true;
        }
        return false;
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
        #add-menu-btn {
          background: linear-gradient(45deg, var(--accent-color), #9599E2);
          color: var(--button-text-color);
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.3s ease;
        }
        #add-menu-btn:hover {
          transform: scale(1.05);
        }
      </style>
      <div class="card">
        <h2>새로운 메뉴 추가</h2>
        <input type="text" id="new-menu-input" placeholder="예: 닭갈비">
        <button id="add-menu-btn">추가</button>
      </div>
    `;

    this.shadowRoot.getElementById('add-menu-btn').addEventListener('click', () => this.addMenu());
  }

  addMenu() {
    const input = this.shadowRoot.getElementById('new-menu-input');
    const newMenu = input.value.trim();
    if (newMenu) {
        this.dispatchEvent(new CustomEvent('menu-added', { detail: newMenu }));
        input.value = '';
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

    if (adder && recommender && toast) {
        adder.addEventListener('menu-added', event => {
            const result = recommender.addMenuItem(event.detail);
            if(result) {
                toast.show(`"${event.detail}" 메뉴가 추가되었습니다!`);
            } else {
                toast.show("이미 존재하는 메뉴입니다.");
            }
        });

        adder.addEventListener('show-toast', event => {
            toast.show(event.detail);
        });
    } else {
        console.error('One or more components are missing from the DOM.');
    }
});
