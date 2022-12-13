/** Modified copy of file found in dnd5e (https://github.com/foundryvtt/dnd5e/blob/master/LICENSE.txt) */

import gulp from "gulp";

import * as javascript from "./utils/javascript.mjs";

// Javascript linting
export const lint = gulp.series(javascript.lint);
