const defaultMenus = [
  { name: "비빔밥", desc: "가볍고 든든", tags: ["한식", "밥"], time: 15, score: 12 },
  { name: "돈까스", desc: "바삭한 행복", tags: ["일식", "튀김"], time: 20, score: 18 },
  { name: "마라탕", desc: "얼큰하게", tags: ["중식", "매운"], time: 25, score: 22 },
  { name: "샐러드", desc: "가볍고 상쾌", tags: ["건강", "가벼운"], time: 10, score: 9 },
  { name: "피자", desc: "친구들과", tags: ["양식", "공유"], time: 30, score: 15 },
  { name: "김치찌개", desc: "집밥 느낌", tags: ["한식", "국물"], time: 20, score: 20 },
  { name: "초밥", desc: "깔끔한 선택", tags: ["일식", "가벼운"], time: 25, score: 14 },
  { name: "버거", desc: "빠른 만족", tags: ["패스트", "양식"], time: 12, score: 16 }
];

const storeKey = "menu-reco:data";
const voteKey = "menu-reco:votes";
const favKey = "menu-reco:favs";

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

function loadVotes() {
  return JSON.parse(localStorage.getItem(voteKey) || "{}");
}

function saveVotes(votes) {
  localStorage.setItem(voteKey, JSON.stringify(votes));
}

function loadFavs() {
  return JSON.parse(localStorage.getItem(favKey) || "{}");
}

function saveFavs(favs) {
  localStorage.setItem(favKey, JSON.stringify(favs));
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
      <div class="meta">⏱ ${m.time}분 · 👍 ${m.score}</div>
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
    });
  });
}

function pickRandom(menus) {
  return menus[Math.floor(Math.random() * menus.length)];
}

function updateRecommend(menu) {
  const tags = $("[data-recommend-tags]");
  tags.innerHTML = menu.tags.map((t) => `<span class="tag">${t}</span>`).join("");
  $("[data-recommend-title]").textContent = menu.name;
  $("[data-recommend-desc]").textContent = menu.desc;
  $("[data-recommend-meta]").textContent = `⏱ ${menu.time}분 · 👍 ${menu.score}`;
  $("[data-recommend-card]").dataset.name = menu.name;
}

function applyFilters() {
  const menus = loadMenus();
  const query = $("[data-search]").value.toLowerCase().trim();
  const onlyFav = $("[data-only-favorite]").checked;
  const onlyQuick = $("[data-only-quick]").checked;
  const favs = loadFavs();

  let filtered = menus.filter((m) => {
    const text = `${m.name} ${m.desc} ${m.tags.join(" ")}`.toLowerCase();
    if (query && !text.includes(query)) return false;
    if (onlyQuick && m.time > 15) return false;
    if (onlyFav && !favs[m.name]) return false;
    return true;
  });

  const sort = document.querySelector("[data-sort].active")?.dataset.sort || "popular";
  if (sort === "popular") filtered.sort((a, b) => b.score - a.score);
  if (sort === "quick") filtered.sort((a, b) => a.time - b.time);
  if (sort === "random") filtered.sort(() => Math.random() - 0.5);

  renderList(filtered);
}

function init() {
  const menus = loadMenus();
  renderTags(menus);
  applyFilters();

  $("[data-action='pick']").addEventListener("click", () => {
    const menu = pickRandom(loadMenus());
    updateRecommend(menu);
  });
  $("[data-action='surprise']").addEventListener("click", () => {
    const menu = pickRandom(loadMenus().filter((m) => m.time <= 20));
    updateRecommend(menu);
  });

  $("[data-search]").addEventListener("input", applyFilters);
  $("[data-clear]").addEventListener("click", () => {
    $("[data-search]").value = "";
    $("[data-only-favorite]").checked = false;
    $("[data-only-quick]").checked = false;
    applyFilters();
  });

  $$("[data-sort]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$("[data-sort]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    });
  });

  $("[data-only-favorite]").addEventListener("change", applyFilters);
  $("[data-only-quick]").addEventListener("change", applyFilters);

  $("[data-add-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const menu = {
      name: data.get("name").toString().trim(),
      desc: data.get("desc").toString().trim(),
      tags: data.get("tags").toString().split(",").map((t) => t.trim()).filter(Boolean),
      time: Number(data.get("time")),
      score: 0
    };
    const menus = loadMenus();
    menus.push(menu);
    saveMenus(menus);
    renderTags(menus);
    applyFilters();
    form.reset();
    $("[data-add-msg]").textContent = "추가 완료!";
    setTimeout(() => ($("[data-add-msg]").textContent = ""), 1500);
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
}

init();
