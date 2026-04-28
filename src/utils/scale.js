import { Dimensions, PixelRatio } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

// Design baseline: iPhone 14 / Pixel 7 — 390 × 844 logical points
const BASE_W = 390;
const BASE_H = 844;

/** Horizontal linear scale — use for widths, horizontal padding */
export const s = (n) => Math.round((W / BASE_W) * n);

/** Vertical linear scale — use for heights, vertical padding */
export const vs = (n) => Math.round((H / BASE_H) * n);

/**
 * Moderate scale — use for font sizes.
 * factor 0 = no scaling, factor 1 = full linear scaling.
 * 0.4 is a good middle ground for text.
 */
export const ms = (n, factor = 0.4) => Math.round(n + (s(n) - n) * factor);

/** True screen width / height (useful for layout decisions) */
export const SCREEN_W = W;
export const SCREEN_H = H;

/** Whether the device is a small phone (< 360pt wide) */
export const isSmall = W < 360;

/** Whether the device is a tablet (>= 600pt wide) */
export const isTablet = W >= 600;
