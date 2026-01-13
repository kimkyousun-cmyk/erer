# Blueprint: 오늘 뭐 먹지?

## Overview

A simple web application to help users decide what to eat. It recommends a random food item from a predefined list and allows users to add new items to the list.

## Implemented Features

*   **Initial Setup:** A basic HTML structure with two cards for recommending and adding menu items, styled with CSS and controlled by JavaScript.
*   **Web Components:** The UI has been refactored into modular and reusable Web Components (`<menu-recommender>` and `<menu-adder>`).
*   **Data Persistence:** The menu list is now saved to `localStorage`, so user-added items persist between sessions.
*   **Custom Notifications:** User feedback is provided through non-intrusive toast notifications instead of browser alerts.
*   **Theme Switching (Dark/White Mode):** Users can switch between dark and light themes. The preference is saved in `localStorage` and the OS preference is automatically detected.

## Current Task: Design Modernization

This is the plan to improve the application based on modern web development practices and the `GEMINI.md` guidelines.

1.  **Modernize CSS and Design:**
    *   Introduce CSS custom properties (variables) for the color palette, fonts, and other design tokens to make theming and maintenance easier.
    *   Apply a more modern and visually appealing design, incorporating principles from `GEMINI.md` such as improved iconography, gradients, and shadows.
    *   **Completed:** Implemented dark and white modes with a theme switcher.

## Future Improvements

*   **Improve Inter-Component Communication:** Use custom events to communicate between the new Web Components. For example, when the `<menu-adder>` component adds a new item, it will dispatch an event that the `<menu-recommender>` component can listen to in order to update its list.
