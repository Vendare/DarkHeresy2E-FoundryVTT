/** Modified copy of file found in dnd5e (https://github.com/foundryvtt/dnd5e/blob/master/LICENSE.txt) */

import gulp from "gulp";

import * as css from "./utils/css.mjs";
import * as javascript from "./utils/javascript.mjs";
import * as compendia from "./utils/compendia.mjs";


// Default export - build CSS and watch for updates
export default gulp.series(
  gulp.parallel(css.compile),
  css.watchUpdates
);

// CSS compiling
export const buildCSS = gulp.series(css.compile);

// Pack compiling
export const buildPacks = gulp.series(compendia.compile);

// Javascript linting
export const lint = gulp.series(javascript.lint);

//Javascript bundling
export const bundle = gulp.series(javascript.bundle);

// Build all artifacts
export const buildAll = gulp.parallel(
    css.compile,
    compendia.compile,
    javascript.bundle
);
