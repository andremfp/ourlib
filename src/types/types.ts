// Routes
export type RouteName = "login" | "register" | "not-found" | "main";

// Tabs
export type TabName = "Home" | "My Libraries" | "Add Book" | "Profile";
export type Tab = {
  name: string;
  label: string;
  outlineSvg: Record<string, string>;
  outlineRects?: SVGRect[];
  outlinePaths: Record<string, string>[];
  filledSvg: Record<string, string>;
  filledPaths: Record<string, string>[];
};

// Icons
export type SVGRect = {
  "stroke-linejoin": "round" | "miter" | "bevel" | "inherit";
  width: string;
  height: string;
  x: string;
  y: string;
  rx: string;
  ry: string;
};
