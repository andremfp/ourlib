declare module "pulltorefreshjs" {
  interface PullToRefreshOptions {
    mainElement?: HTMLElement;
    onRefresh?: () => Promise<void> | void;
    shouldPullToRefresh?: () => boolean;
    distThreshold?: number;
    distMax?: number;
    distReload?: number;
    instructionsPullToRefresh?: string;
    instructionsReleaseToRefresh?: string;
    instructionsRefreshing?: string;
    iconArrow?: string;
    iconRefreshing?: string;
    resistanceFunction?: (t: number) => number;
    getMarkup?: () => string;
    getStyles?: () => string;
    triggerElement?: HTMLElement;
  }

  interface PullToRefreshInstance {
    destroy(): void;
  }

  const PullToRefresh: {
    init(options: PullToRefreshOptions): PullToRefreshInstance;
    destroyAll(): void;
  };

  export default PullToRefresh;
}
