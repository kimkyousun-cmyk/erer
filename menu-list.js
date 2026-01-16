import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const menuItemsCollection = collection(db, 'menuItems');

class MenuList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.menuItems = [];
        this.loadMenuItems();
    }

    async loadMenuItems() {
        const querySnapshot = await getDocs(menuItemsCollection);
        this.menuItems = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        this.render();
    }

    render() {
        const menuItemsByCategory = this.menuItems.reduce((acc, item) => {
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
                this.dispatchEvent(new CustomEvent('menu-deleted', { detail: { id, name }, bubbles: true, composed: true }));
            }, 500);
        }
    }

    addMenuItem(item) {
        this.menuItems.push(item);
        this.render();
    }
}

customElements.define('menu-list', MenuList);
