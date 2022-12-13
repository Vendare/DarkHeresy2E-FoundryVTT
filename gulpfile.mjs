/** Modified copy of file found in dnd5e (https://github.com/foundryvtt/dnd5e/blob/master/LICENSE.txt) */

import gulp from "gulp";

import * as css from "./utils/css.mjs";
import * as javascript from "./utils/javascript.mjs";


// Default export - build CSS and watch for updates
export default gulp.series(
  gulp.parallel(css.compile),
  css.watchUpdates
);

// CSS compiling
export const buildCSS = gulp.series(css.compile);

// Javascript linting
export const lint = gulp.series(javascript.lint);

// Build all artifacts
export const buildAll = gulp.parallel(
  css.compile,
);
