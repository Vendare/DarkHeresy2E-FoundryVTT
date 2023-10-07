export const initializeHandlebars = () => {
    registerHandlebarsHelpers();
    preloadHandlebarsTemplates();
};

/**
 * Define a set of template paths to pre-load. Pre-loaded templates are compiled and cached for fast access when
 * rendering. These paths will also be available as Handlebars partials by using the file name.
 * @returns {Promise}
 */
function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/dark-heresy/template/sheet/actor/acolyte.hbs",
        "systems/dark-heresy/template/sheet/actor/npc.hbs",
        "systems/dark-heresy/template/sheet/actor/limited-sheet.hbs",

        "systems/dark-heresy/template/sheet/actor/tab/abilities.hbs",
        "systems/dark-heresy/template/sheet/actor/tab/combat.hbs",
        "systems/dark-heresy/template/sheet/actor/tab/gear.hbs",
        "systems/dark-heresy/template/sheet/actor/tab/notes.hbs",
        "systems/dark-heresy/template/sheet/actor/tab/npc-notes.hbs",
        "systems/dark-heresy/template/sheet/actor/tab/npc-stats.hbs",
        "systems/dark-heresy/template/sheet/actor/tab/progression.hbs",
        "systems/dark-heresy/template/sheet/actor/tab/psychic-powers.hbs",
        "systems/dark-heresy/template/sheet/actor/tab/stats.hbs",

        "systems/dark-heresy/template/sheet/mental-disorder.hbs",
        "systems/dark-heresy/template/sheet/aptitude.hbs",
        "systems/dark-heresy/template/sheet/malignancy.hbs",
        "systems/dark-heresy/template/sheet/mutation.hbs",
        "systems/dark-heresy/template/sheet/talent.hbs",
        "systems/dark-heresy/template/sheet/trait.hbs",
        "systems/dark-heresy/template/sheet/special-ability.hbs",
        "systems/dark-heresy/template/sheet/psychic-power.hbs",
        "systems/dark-heresy/template/sheet/critical-injury.hbs",
        "systems/dark-heresy/template/sheet/weapon.hbs",
        "systems/dark-heresy/template/sheet/armour.hbs",
        "systems/dark-heresy/template/sheet/gear.hbs",
        "systems/dark-heresy/template/sheet/drug.hbs",
        "systems/dark-heresy/template/sheet/tool.hbs",
        "systems/dark-heresy/template/sheet/cybernetic.hbs",
        "systems/dark-heresy/template/sheet/weapon-modification.hbs",
        "systems/dark-heresy/template/sheet/ammunition.hbs",
        "systems/dark-heresy/template/sheet/force-field.hbs",

        "systems/dark-heresy/template/sheet/characteristics/information.hbs",
        "systems/dark-heresy/template/sheet/characteristics/left.hbs",
        "systems/dark-heresy/template/sheet/characteristics/name.hbs",
        "systems/dark-heresy/template/sheet/characteristics/right.hbs",
        "systems/dark-heresy/template/sheet/characteristics/total.hbs",

        "systems/dark-heresy/template/chat/item.hbs",
        "systems/dark-heresy/template/chat/roll.hbs",
        "systems/dark-heresy/template/chat/damage.hbs",
        "systems/dark-heresy/template/chat/critical.hbs",
        "systems/dark-heresy/template/chat/evasion.hbs",
        "systems/dark-heresy/template/chat/emptyMag.hbs",

        "systems/dark-heresy/template/dialog/common-roll.hbs",
        "systems/dark-heresy/template/dialog/combat-roll.hbs",
        "systems/dark-heresy/template/dialog/psychic-power-roll.hbs"
    ];
    return loadTemplates(templatePaths);
}

/**
 * Add custom Handlerbars helpers.
 */
function registerHandlebarsHelpers() {
    Handlebars.registerHelper("removeMarkup", function(text) {
        const markup = /<(.*?)>/gi;
        return text.replace(markup, "");
    });

    Handlebars.registerHelper("enrich", function(string) {
        return TextEditor.enrichHTML(string, {async: false});
    });

    Handlebars.registerHelper("damageTypeLong", function(damageType) {
        damageType = (damageType || "i").toLowerCase();
        switch (damageType) {
            case "e":
                return game.i18n.localize("DAMAGE_TYPE.ENERGY");
            case "i":
                return game.i18n.localize("DAMAGE_TYPE.IMPACT");
            case "r":
                return game.i18n.localize("DAMAGE_TYPE.RENDING");
            case "x":
                return game.i18n.localize("DAMAGE_TYPE.EXPLOSIVE");
            default:
                return game.i18n.localize("DAMAGE_TYPE.IMPACT");
        }
    });


    Handlebars.registerHelper("damageTypeShort", function(damageType) {
        switch (damageType) {
            case "energy":
                return game.i18n.localize("DAMAGE_TYPE.ENERGY_SHORT");
            case "impact":
                return game.i18n.localize("DAMAGE_TYPE.IMPACT_SHORT");
            case "rending":
                return game.i18n.localize("DAMAGE_TYPE.RENDING_SHORT");
            case "explosive":
                return game.i18n.localize("DAMAGE_TYPE.EXPLOSIVE_SHORT");
            default:
                return game.i18n.localize("DAMAGE_TYPE.IMPACT_SHORT");
        }
    });

    Handlebars.registerHelper("config", function(key) {
        return game.darkHeresy.config[key];
    });

}

