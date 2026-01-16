# Blueprint: 오늘 뭐 먹지?

## Overview

A simple web application to help users decide what to eat. It recommends a random food item from a predefined list and allows users to add new items to the list.

## Implemented Features

*   **Initial Setup:** A basic HTML structure with two cards for recommending and adding menu items, styled with CSS and controlled by JavaScript.
*   **Web Components:** The UI has been refactored into modular and reusable Web Components (`<menu-recommender>` and `<menu-adder>`).
*   **Data Persistence:** The menu list is now saved to `localStorage`, so user-added items persist between sessions.
*   **Custom Notifications:** User feedback is provided through non-intrusive toast notifications instead of browser alerts.
*   **Theme Switching (Dark/White Mode):** Users can switch between dark and light themes. The preference is saved in `localStorage` and the OS preference is automatically detected.
*   **Deployment:** The application has been deployed via `git push`.
*   **카테고리 필터 (Category Filter):** Added food categories and allowed users to filter the recommendations by category.
*   **메뉴 삭제 (Delete Menu):** Allowed users to delete menu items from the list.
*   **애니메이션 추가 (Add Animation):** Added animations to make the user experience more engaging.
*   **UI/UX 개선 (UI/UX Improvements):** Improved the layout and added icons to the buttons.
*   **Firebase 연동 (Firebase Integration):** Integrated Firebase to store the menu items in a shared database.

## Current Task: All tasks completed