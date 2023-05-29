/** Modified copy of file found in dnd5e (https://github.com/foundryvtt/dnd5e/blob/master/LICENSE.txt) */

import gulp from "gulp";
import less from "gulp-less";


const LESS_DEST = "./release/css";
const LESS_SRC = "less/dark-heresy.less";
const LESS_WATCH = ["less/*.less"];


/**
 * Compile the LESS sources into a single CSS file.
 */
function compileLESS() {
  return gulp.src(LESS_SRC)
    .pipe(less({relativeUrls: true}))
    .pipe(gulp.dest(LESS_DEST));
}
export const compile = compileLESS;


/**
 * Update the CSS if any of the LESS sources are modified.
 */
export function watchUpdates() {
  gulp.watch(LESS_WATCH, compile);
}
