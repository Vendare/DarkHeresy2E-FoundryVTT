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
    "systems/dark-heresy/template/sheet/actor/acolyte.html",
    "systems/dark-heresy/template/sheet/actor/npc.html",
    "systems/dark-heresy/template/sheet/actor/limited-sheet.html",
    "systems/dark-heresy/template/sheet/actor/vehicle.html",
    "systems/dark-heresy/template/sheet/actor/aircraft.html",
    "systems/dark-heresy/template/sheet/actor/starship.html",

    "systems/dark-heresy/template/sheet/actor/tab/abilities.html",
    "systems/dark-heresy/template/sheet/actor/tab/combat.html",
    "systems/dark-heresy/template/sheet/actor/tab/gear.html",
    "systems/dark-heresy/template/sheet/actor/tab/notes.html",
    "systems/dark-heresy/template/sheet/actor/tab/npc-notes.html",
    "systems/dark-heresy/template/sheet/actor/tab/npc-stats.html",
    "systems/dark-heresy/template/sheet/actor/tab/progression.html",
    "systems/dark-heresy/template/sheet/actor/tab/psychic-powers.html",
    "systems/dark-heresy/template/sheet/actor/tab/stats.html",
    "systems/dark-heresy/template/sheet/actor/tab/vehicle-combat.html",
    "systems/dark-heresy/template/sheet/actor/tab/vehicle-progression.html",
    "systems/dark-heresy/template/sheet/actor/tab/vehicle-notes.html",
    "systems/dark-heresy/template/sheet/actor/tab/aircraft-combat.html",
    "systems/dark-heresy/template/sheet/actor/tab/aircraft-progression.html",
    "systems/dark-heresy/template/sheet/actor/tab/starship-combat.html",
    "systems/dark-heresy/template/sheet/actor/tab/starship-components.html",
    "systems/dark-heresy/template/sheet/actor/tab/starship-progression.html",
    "systems/dark-heresy/template/sheet/actor/tab/starship-notes.html",

    "systems/dark-heresy/template/sheet/mental-disorder.html",
    "systems/dark-heresy/template/sheet/aptitude.html",
    "systems/dark-heresy/template/sheet/malignancy.html",
    "systems/dark-heresy/template/sheet/mutation.html",
    "systems/dark-heresy/template/sheet/talent.html",
    "systems/dark-heresy/template/sheet/trait.html",
    "systems/dark-heresy/template/sheet/special-ability.html",
    "systems/dark-heresy/template/sheet/psychic-power.html",
    "systems/dark-heresy/template/sheet/critical-injury.html",
    "systems/dark-heresy/template/sheet/weapon.html",
    "systems/dark-heresy/template/sheet/armour.html",
    "systems/dark-heresy/template/sheet/gear.html",
    "systems/dark-heresy/template/sheet/drug.html",
    "systems/dark-heresy/template/sheet/tool.html",
    "systems/dark-heresy/template/sheet/cybernetic.html",
    "systems/dark-heresy/template/sheet/weapon-modification.html",
    "systems/dark-heresy/template/sheet/ammunition.html",
    "systems/dark-heresy/template/sheet/force-field.html",
    "systems/dark-heresy/template/sheet/characteristics/information.html",
    "systems/dark-heresy/template/sheet/characteristics/left.html",
    "systems/dark-heresy/template/sheet/characteristics/name.html",
    "systems/dark-heresy/template/sheet/characteristics/right.html",
    "systems/dark-heresy/template/sheet/characteristics/total.html",
    "systems/dark-heresy/template/sheet/starship-equipment.html",
    "systems/dark-heresy/template/sheet/starship-weapon.html",
    "systems/dark-heresy/template/sheet/squadrons.html",
    "systems/dark-heresy/template/sheet/groundtroops.html",
    "systems/dark-heresy/template/chat/item.html",
    "systems/dark-heresy/template/chat/roll.html",
    "systems/dark-heresy/template/chat/critical.html",
    "systems/dark-heresy/template/chat/shiproll.html",
    "systems/dark-heresy/template/dialog/common-roll.html",
    "systems/dark-heresy/template/dialog/combat-roll.html",
    "systems/dark-heresy/template/dialog/psychic-power-roll.html",
    "systems/dark-heresy/template/dialog/acquire-roll.html",
    "systems/dark-heresy/template/dialog/shipcombat-roll.html"
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

}