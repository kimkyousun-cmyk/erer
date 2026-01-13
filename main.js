document.addEventListener("DOMContentLoaded", () => {
    const menuItems = [
        "피자", "햄버거", "초밥", "김치찌개", "파스타",
        "치킨", "떡볶이", "짜장면", "삼겹살", "부대찌개"
    ];

    const recommendBtn = document.getElementById("recommend-btn");
    const menuDisplay = document.getElementById("menu-display");
    const newMenuInput = document.getElementById("new-menu-input");
    const addMenuBtn = document.getElementById("add-menu-btn");

    recommendBtn.addEventListener("click", () => {
        // Add fade-out effect
        menuDisplay.classList.add("fade-out");

        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * menuItems.length);
            const recommendedMenu = menuItems[randomIndex];
            // The menu-display div contains a p tag, so we select it.
            const p = menuDisplay.querySelector("p");
            if (p) {
                p.textContent = recommendedMenu;
            }
            
            // Remove fade-out to fade-in the new content
            menuDisplay.classList.remove("fade-out");
        }, 500); // Corresponds to the transition duration
    });

    addMenuBtn.addEventListener("click", () => {
        const newMenu = newMenuInput.value.trim();
        if (newMenu) {
            if (!menuItems.includes(newMenu)) {
                menuItems.push(newMenu);
                alert(`"${newMenu}" 메뉴가 추가되었습니다!`);
                newMenuInput.value = "";
            } else {
                alert("이미 존재하는 메뉴입니다.");
            }
        } else {
            alert("추가할 메뉴를 입력해주세요.");
        }
    });
});
