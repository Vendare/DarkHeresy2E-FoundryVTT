import gulp from "gulp";
import through2 from "through2";
import yaml from "js-yaml";
import Datastore from "nedb";
import mergeStream from "merge-stream";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACK_SRC = "./src/packs";
const PACK_DEST = "../packs";

/**
 * Function for removing compendium contents
 * @param {Datastore} database
 * @returns {Promise}
 */
function purgeDatabase(database) {
    // Mark all entries as removed
    database.remove({}, { multi: true });
    // Actually delete lines in file
    database.persistence.compactDatafile();
    return Promise.resolve("Done");
}

/**
 * Generate compendium files from yaml templates
 * @returns  {mergeStream}
 */
function buildPacks() {
    // Determine the source folders to process
    const folders = fs.readdirSync(PACK_SRC).filter(file => {
        return fs.statSync(path.join(PACK_SRC, file)).isDirectory();
    });

    // Process each folder into a compendium db
    const packs = folders.map(folder => {
        const db = new Datastore({ filename: path.resolve(__dirname, PACK_DEST, `${folder}.db`), autoload: true });
        const promise = purgeDatabase(db);
        return gulp.src(path.join(PACK_SRC, folder, "/**/*.yaml")).pipe(
            through2.obj((file, enc, cb) => {
                let json = yaml.loadAll(file.contents.toString());
                // Empty the database first so we get a fresh file
                promise.then(db.insert(json));
                cb(null, file);
            })
        );
    });
    return mergeStream(packs);
}
export const compile = buildPacks;
