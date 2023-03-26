import { DarkHeresyActor } from "./actor.js";
import { DarkHeresyItem } from "./item.js";
import { AcolyteSheet } from "../sheet/actor/acolyte.js";
import { NpcSheet } from "../sheet/actor/npc.js";
import { WeaponSheet } from "../sheet/weapon.js";
import { AmmunitionSheet } from "../sheet/ammunition.js";
import { WeaponModificationSheet } from "../sheet/weapon-modification.js";
import { ArmourSheet } from "../sheet/armour.js";
import { ForceFieldSheet } from "../sheet/force-field.js";
import { CyberneticSheet } from "../sheet/cybernetic.js";
import { DrugSheet } from "../sheet/drug.js";
import { GearSheet } from "../sheet/gear.js";
import { ToolSheet } from "../sheet/tool.js";
import { CriticalInjurySheet } from "../sheet/critical-injury.js";
import { MalignancySheet } from "../sheet/malignancy.js";
import { MentalDisorderSheet } from "../sheet/mental-disorder.js";
import { MutationSheet } from "../sheet/mutation.js";
import { PsychicPowerSheet } from "../sheet/psychic-power.js";
import { TalentSheet } from "../sheet/talent.js";
import { SpecialAbilitySheet } from "../sheet/special-ability.js";
import { TraitSheet } from "../sheet/trait.js";
import { AptitudeSheet } from "../sheet/aptitude.js";
import { initializeHandlebars } from "./handlebars.js";
import { migrateWorld } from "./migration.js";
import { prepareCommonRoll, prepareCombatRoll, preparePsychicPowerRoll, prepareShipCombatRoll } from "./dialog.js";
import { commonRoll, combatRoll, shipCombatRoll } from "./roll.js";
import DhMacroUtil from "./macro.js";
import { VehicleSheet } from "../sheet/actor/vehicle.js";
import { AircraftSheet } from "../sheet/actor/aircraft.js";
import { StarshipSheet } from "../sheet/actor/starship.js";
import { StarshipweaponSheet } from "../sheet/starship-weapon.js";
import { StarshipcoreSheet } from "../sheet/starship-core.js";
import { StarshipsuppSheet } from "../sheet/starship-supp.js";
import { SquadronsSheet } from "../sheet/squadrons.js";
import { GroundtroopsSheet } from "../sheet/groundtroops.js";

// Import Helpers
import * as chat from "./chat.js";

Hooks.once("init", () => {
  CONFIG.Combat.initiative = { formula: "@initiative.base + @initiative.bonus", decimals: 0 };
  CONFIG.Actor.documentClass = DarkHeresyActor;
  CONFIG.Item.documentClass = DarkHeresyItem;
  CONFIG.fontDefinitions["Caslon Antique"] = {editor: true, fonts: []};
  game.darkHeresy = {
    testInit: {
      prepareCommonRoll,
      prepareCombatRoll,
      prepareShipCombatRoll,
      preparePsychicPowerRoll
    },
    tests: {
      commonRoll,
      combatRoll,
      shipCombatRoll
    }
  };
  game.macro = DhMacroUtil;
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("dark-heresy", AcolyteSheet, { types: ["acolyte"], makeDefault: true });
  Actors.registerSheet("dark-heresy", NpcSheet, { types: ["npc"], makeDefault: true });
  Actors.registerSheet("dark-heresy", VehicleSheet, { types: ["vehicle"], makeDefault: true });
  Actors.registerSheet("dark-heresy", AircraftSheet, { types: ["aircraft"], makeDefault: true });
  Actors.registerSheet("dark-heresy", StarshipSheet, { types: ["starship"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("dark-heresy", WeaponSheet, { types: ["weapon"], makeDefault: true });
  Items.registerSheet("dark-heresy", AmmunitionSheet, { types: ["ammunition"], makeDefault: true });
  Items.registerSheet("dark-heresy", WeaponModificationSheet, { types: ["weaponModification"], makeDefault: true });
  Items.registerSheet("dark-heresy", ArmourSheet, { types: ["armour"], makeDefault: true });
  Items.registerSheet("dark-heresy", ForceFieldSheet, { types: ["forceField"], makeDefault: true });
  Items.registerSheet("dark-heresy", CyberneticSheet, { types: ["cybernetic"], makeDefault: true });
  Items.registerSheet("dark-heresy", DrugSheet, { types: ["drug"], makeDefault: true });
  Items.registerSheet("dark-heresy", GearSheet, { types: ["gear"], makeDefault: true });
  Items.registerSheet("dark-heresy", ToolSheet, { types: ["tool"], makeDefault: true });
  Items.registerSheet("dark-heresy", CriticalInjurySheet, { types: ["criticalInjury"], makeDefault: true });
  Items.registerSheet("dark-heresy", MalignancySheet, { types: ["malignancy"], makeDefault: true });
  Items.registerSheet("dark-heresy", MentalDisorderSheet, { types: ["mentalDisorder"], makeDefault: true });
  Items.registerSheet("dark-heresy", MutationSheet, { types: ["mutation"], makeDefault: true });
  Items.registerSheet("dark-heresy", PsychicPowerSheet, { types: ["psychicPower"], makeDefault: true });
  Items.registerSheet("dark-heresy", TalentSheet, { types: ["talent"], makeDefault: true });
  Items.registerSheet("dark-heresy", SpecialAbilitySheet, { types: ["specialAbility"], makeDefault: true });
  Items.registerSheet("dark-heresy", TraitSheet, { types: ["trait"], makeDefault: true });
  Items.registerSheet("dark-heresy", AptitudeSheet, { types: ["aptitude"], makeDefault: true });
  Items.registerSheet("dark-heresy", StarshipweaponSheet, { types: ["starshipWeapon"], makeDefault: true });
  Items.registerSheet("dark-heresy", StarshipcoreSheet, { types: ["starshipCore"], makeDefault: true });
  Items.registerSheet("dark-heresy", StarshipsuppSheet, { types: ["starshipSupplementary"], makeDefault: true });
  Items.registerSheet("dark-heresy", SquadronsSheet, { types: ["squadrons"], makeDefault: true });
  Items.registerSheet("dark-heresy", GroundtroopsSheet, { types: ["groundTroops"], makeDefault: true });
  initializeHandlebars();
  game.settings.register("dark-heresy", "worldSchemaVersion", {
    name: "World Version",
    hint: "Used to automatically upgrade worlds data when the system is upgraded.",
    scope: "world",
    config: true,
    default: 0,
    type: Number
  });
});

Hooks.once("ready", () => {
  migrateWorld();
  CONFIG.ChatMessage.documentClass.prototype.getRollData = function() {
    return this.getFlag("dark-heresy", "rollData");
  };
});


/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */

Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);
Hooks.on("getChatLogEntryContext", chat.showRolls);
/**
 * Create a macro when dropping an entity on the hotbar
 * Item      - open roll dialog for item
 */
Hooks.on("hotbarDrop", (bar, data, slot) => {
  if (data.type === "Item" || data.type === "Actor")
  {
    DhMacroUtil.createMacro(data, slot);
    return false;
  }
});
