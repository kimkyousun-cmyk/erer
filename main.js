const defaultMenus = [
  { name: "비빔밥", desc: "가볍고 든든", tags: ["한식", "밥"], time: 15, score: 12, price: 1, spicy: 1, meals: ["lunch", "dinner"], lastPicked: null },
  { name: "돈까스", desc: "바삭한 행복", tags: ["일식", "튀김"], time: 20, score: 18, price: 2, spicy: 0, meals: ["lunch", "dinner"], lastPicked: null },
  { name: "마라탕", desc: "얼큰하게", tags: ["중식", "매운"], time: 25, score: 22, price: 2, spicy: 3, meals: ["lunch", "dinner", "late"], lastPicked: null },
  { name: "샐러드", desc: "가볍고 상쾌", tags: ["건강", "가벼운"], time: 10, score: 9, price: 1, spicy: 0, meals: ["breakfast", "lunch"], lastPicked: null },
  { name: "피자", desc: "친구들과", tags: ["양식", "공유"], time: 30, score: 15, price: 3, spicy: 1, meals: ["dinner"], lastPicked: null },
  { name: "김치찌개", desc: "집밥 느낌", tags: ["한식", "국물"], time: 20, score: 20, price: 2, spicy: 2, meals: ["lunch", "dinner"], lastPicked: null },
  { name: "초밥", desc: "깔끔한 선택", tags: ["일식", "가벼운"], time: 25, score: 14, price: 3, spicy: 0, meals: ["lunch", "dinner"], lastPicked: null },
  { name: "버거", desc: "빠른 만족", tags: ["패스트", "양식"], time: 12, score: 16, price: 2, spicy: 0, meals: ["lunch", "late"], lastPicked: null }
];

const storeKey = "menu-reco:data";
const favKey = "menu-reco:favs";
const historyKey = "menu-reco:history";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function loadMenus() {
  const saved = localStorage.getItem(storeKey);
  if (saved) return JSON.parse(saved);
  localStorage.setItem(storeKey, JSON.stringify(defaultMenus));
  return defaultMenus;
}

function saveMenus(data) {
  localStorage.setItem(storeKey, JSON.stringify(data));
}

function loadFavs() {
  return JSON.parse(localStorage.getItem(favKey) || "{}");
}

function saveFavs(favs) {
  localStorage.setItem(favKey, JSON.stringify(favs));
}

function loadHistory() {
  return JSON.parse(localStorage.getItem(historyKey) || "[]");
}

function saveHistory(items) {
  localStorage.setItem(historyKey, JSON.stringify(items.slice(0, 5)));
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function renderTags(menus) {
  const tags = Array.from(new Set(menus.flatMap((m) => m.tags))).slice(0, 12);
  const holder = $("[data-tags]");
  holder.innerHTML = tags.map((tag) => `<button class="tag" data-tag="${tag}">${tag}</button>`).join(" ");
  $$("[data-tag]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("[data-search]").value = btn.dataset.tag;
      applyFilters();
    });
  });
}

function renderList(menus) {
  const list = $("[data-list]");
  const favs = loadFavs();
  list.innerHTML = menus.map((m) => `
    <div class="card">
      <div class="tag-row">${m.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      <h3>${m.name}</h3>
      <p>${m.desc}</p>
      <div class="meta">⏱ ${m.time}분 · 👍 ${m.score} · 💰 ${priceLabel(m.price)} · 🌶 ${spicyLabel(m.spicy)}</div>
      <button class="chip" data-fav-name="${m.name}">${favs[m.name] ? "즐겨찾기 취소" : "즐겨찾기"}</button>
    </div>
  `).join("");

  $$("[data-fav-name]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const favs = loadFavs();
      const name = btn.dataset.favName;
      favs[name] = !favs[name];
      saveFavs(favs);
      applyFilters();
      updateStats();
    });
  });
}

function priceLabel(price) {
  return price === 1 ? "가성비" : price === 2 ? "보통" : "프리미엄";
}

function spicyLabel(spicy) {
  return spicy === 0 ? "안 매움" : spicy === 1 ? "약간" : spicy === 2 ? "매움" : "아주 매움";
}

function pickRandom(menus) {
  return menus[Math.floor(Math.random() * menus.length)];
}

function updateRecommend(menu) {
  const tags = $("[data-recommend-tags]");
  tags.innerHTML = menu.tags.map((t) => `<span class="tag">${t}</span>`).join("");
  $("[data-recommend-title]").textContent = menu.name;
  $("[data-recommend-desc]").textContent = menu.desc;
  $("[data-recommend-meta]").textContent = `⏱ ${menu.time}분 · 👍 ${menu.score} · 💰 ${priceLabel(menu.price)} · 🌶 ${spicyLabel(menu.spicy)}`;
  $("[data-recommend-card]").dataset.name = menu.name;
}

function applyFilters() {
  const menus = loadMenus();
  const query = $("[data-search]").value.toLowerCase().trim();
  const onlyFav = $("[data-only-favorite]").checked;
  const onlyQuick = $("[data-only-quick]").checked;
  const avoidRepeat = $("[data-avoid-repeat]").checked;
  const price = $("[data-price]").value;
  const spicy = $("[data-spicy]").value;
  const meal = $("[data-meal]").value;
  const favs = loadFavs();
  const today = todayKey();

  let filtered = menus.filter((m) => {
    const text = `${m.name} ${m.desc} ${m.tags.join(" ")}`.toLowerCase();
    if (query && !text.includes(query)) return false;
    if (onlyQuick && m.time > 15) return false;
    if (onlyFav && !favs[m.name]) return false;
    if (avoidRepeat && m.lastPicked === today) return false;
    if (price !== "all" && String(m.price) !== price) return false;
    if (spicy !== "all" && String(m.spicy) !== spicy) return false;
    if (meal !== "all" && !m.meals.includes(meal)) return false;
    return true;
  });

  const sort = document.querySelector("[data-sort].active")?.dataset.sort || "popular";
  if (sort === "popular") filtered.sort((a, b) => b.score - a.score);
  if (sort === "quick") filtered.sort((a, b) => a.time - b.time);
  if (sort === "random") filtered.sort(() => Math.random() - 0.5);

  renderList(filtered);
  $("[data-empty]").style.display = filtered.length === 0 ? "block" : "none";
}

function updateStats() {
  const menus = loadMenus();
  const favs = loadFavs();
  const total = menus.length;
  const favCount = Object.values(favs).filter(Boolean).length;
  const quickCount = menus.filter((m) => m.time <= 15).length;
  const avg = Math.round(menus.reduce((sum, m) => sum + m.time, 0) / Math.max(menus.length, 1));

  $("[data-stat='total']").textContent = total;
  $("[data-stat='favorites']").textContent = favCount;
  $("[data-stat='quick']").textContent = quickCount;
  $("[data-stat='avg']").textContent = `${avg}분`;
}

function addHistory(menu) {
  const items = loadHistory();
  items.unshift({ name: menu.name, time: menu.time, date: todayKey() });
  saveHistory(items);
  renderHistory();
}

function renderHistory() {
  const items = loadHistory();
  const list = $("[data-history]");
  list.innerHTML = items.length
    ? items.map((item) => `<li>${item.date} · ${item.name} (${item.time}분)</li>`).join("")
    : "<li>아직 기록이 없어요.</li>";
}

function initSortButtons() {
  $$("[data-sort]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$("[data-sort]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    });
  });
  document.querySelector("[data-sort='popular']").classList.add("active");
}

function initActions() {
  $("[data-action='pick']").addEventListener("click", () => {
    const menu = pickRandom(loadMenus());
    updateRecommend(menu);
    menu.lastPicked = todayKey();
    saveMenus(loadMenus().map((m) => (m.name === menu.name ? menu : m)));
    addHistory(menu);
  });

  $("[data-action='surprise']").addEventListener("click", () => {
    const menu = pickRandom(loadMenus().filter((m) => m.time <= 20));
    updateRecommend(menu);
    menu.lastPicked = todayKey();
    saveMenus(loadMenus().map((m) => (m.name === menu.name ? menu : m)));
    addHistory(menu);
  });

  $("[data-recommend-card]").addEventListener("click", (e) => {
    const name = $("[data-recommend-card]").dataset.name;
    if (!name) return;
    if (e.target.matches("[data-vote='up']")) vote(name, 1);
    if (e.target.matches("[data-vote='down']")) vote(name, -1);
    if (e.target.matches("[data-favorite]")) toggleFav(name);
  });
}

function vote(name, delta) {
  const menus = loadMenus();
  const item = menus.find((m) => m.name === name);
  if (!item) return;
  item.score = Math.max(0, item.score + delta);
  saveMenus(menus);
  updateRecommend(item);
  applyFilters();
}

function toggleFav(name) {
  const favs = loadFavs();
  favs[name] = !favs[name];
  saveFavs(favs);
  applyFilters();
  updateStats();
}

function initFilters() {
  $("[data-search]").addEventListener("input", applyFilters);
  $("[data-clear]").addEventListener("click", () => {
    $("[data-search]").value = "";
    $("[data-only-favorite]").checked = false;
    $("[data-only-quick]").checked = false;
    $("[data-avoid-repeat]").checked = false;
    $("[data-price]").value = "all";
    $("[data-spicy]").value = "all";
    $("[data-meal]").value = "all";
    applyFilters();
  });

  $$("[data-only-favorite], [data-only-quick], [data-avoid-repeat], [data-price], [data-spicy], [data-meal]").forEach((el) => {
    el.addEventListener("change", applyFilters);
  });
}

function initAddForm() {
  $("[data-add-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const meals = Array.from(form.querySelectorAll("input[name='meal']:checked")).map((input) => input.value);
    const menu = {
      name: data.get("name").toString().trim(),
      desc: data.get("desc").toString().trim(),
      tags: data.get("tags").toString().split(",").map((t) => t.trim()).filter(Boolean),
      time: Number(data.get("time")),
      price: Number(data.get("price")),
      spicy: Number(data.get("spicy")),
      meals: meals.length ? meals : ["lunch", "dinner"],
      score: 0,
      lastPicked: null
    };
    const menus = loadMenus();
    menus.push(menu);
    saveMenus(menus);
    renderTags(menus);
    applyFilters();
    updateStats();
    form.reset();
    $("[data-add-msg]").textContent = "추가 완료!";
    setTimeout(() => ($("[data-add-msg]").textContent = ""), 1500);
  });
}

function initBackup() {
  $("[data-export]").addEventListener("click", () => {
    const payload = JSON.stringify(loadMenus());
    navigator.clipboard.writeText(payload).then(() => {
      $("[data-backup-msg]").textContent = "복사 완료!";
      setTimeout(() => ($("[data-backup-msg]").textContent = ""), 1500);
    });
  });

  $("[data-reset]").addEventListener("click", () => {
    localStorage.removeItem(storeKey);
    localStorage.removeItem(favKey);
    localStorage.removeItem(historyKey);
    init();
  });

  $("[data-import-btn]").addEventListener("click", () => {
    try {
      const json = $("[data-import]").value.trim();
      if (!json) return;
      const data = JSON.parse(json);
      if (!Array.isArray(data)) throw new Error("invalid");
      saveMenus(data);
      renderTags(data);
      applyFilters();
      updateStats();
      $("[data-backup-msg]").textContent = "복원 완료!";
      setTimeout(() => ($("[data-backup-msg]").textContent = ""), 1500);
    } catch {
      $("[data-backup-msg]").textContent = "복원 실패: JSON 형식 확인";
    }
  });
}

function init() {
  const menus = loadMenus();
  renderTags(menus);
  applyFilters();
  updateStats();
  renderHistory();
  initSortButtons();
  initActions();
  initFilters();
  initAddForm();
  initBackup();
}

init();
