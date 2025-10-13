import { watch } from "vue";
import { useRoute } from "vue-router";

/**
 * Composable to manage status bar color on mobile devices (especially Android)
 * based on the current route and theme mode.
 *
 * - Non-authenticated routes (login, register, email-actions): use background color
 * - Authenticated routes (tabs): use navbar color
 * - Supports both light and dark mode
 * - Colors are dynamically read from CSS custom properties defined in style.css
 */
export function useStatusBar() {
  const route = useRoute();

  // Define public (non-authenticated) routes
  const publicRoutes = ["/login", "/register", "/email-actions"];

  /**
   * Get computed CSS custom property value from the document
   */
  const getCSSVariable = (variableName: string): string => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
  };

  /**
   * Update the theme-color meta tag based on current route and theme
   */
  const updateStatusBarColor = () => {
    const isPublicRoute = publicRoutes.includes(route.path);

    let color: string;

    if (isPublicRoute) {
      // Non-authed routes: use background color from CSS custom property
      color = getCSSVariable("--ion-background-color");
    } else {
      // Authed routes: use navbar/toolbar color from CSS custom property
      color = getCSSVariable("--ion-toolbar-background");
    }

    // Update the theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", color);
  };

  // Watch for route changes
  watch(
    () => route.path,
    () => {
      updateStatusBarColor();
    },
    { immediate: true },
  );

  // Watch for theme changes by observing the body class
  const observer = new MutationObserver(() => {
    updateStatusBarColor();
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // Initial update
  updateStatusBarColor();

  // Return cleanup function
  return () => {
    observer.disconnect();
  };
}
