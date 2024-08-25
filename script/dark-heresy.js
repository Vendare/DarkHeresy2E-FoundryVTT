import { DarkHeresyActor } from "./common/actor.js";
import { DarkHeresyItem } from "./common/item.js";
import { AcolyteSheet } from "./sheet/actor/acolyte.js";
import { NpcSheet } from "./sheet/actor/npc.js";
import { WeaponSheet } from "./sheet/weapon.js";
import { AmmunitionSheet } from "./sheet/ammunition.js";
import { WeaponModificationSheet } from "./sheet/weapon-modification.js";
import { ArmourSheet } from "./sheet/armour.js";
import { ForceFieldSheet } from "./sheet/force-field.js";
import { CyberneticSheet } from "./sheet/cybernetic.js";
import { DrugSheet } from "./sheet/drug.js";
import { GearSheet } from "./sheet/gear.js";
import { ToolSheet } from "./sheet/tool.js";
import { CriticalInjurySheet } from "./sheet/critical-injury.js";
import { MalignancySheet } from "./sheet/malignancy.js";
import { MentalDisorderSheet } from "./sheet/mental-disorder.js";
import { MutationSheet } from "./sheet/mutation.js";
import { PsychicPowerSheet } from "./sheet/psychic-power.js";
import { TalentSheet } from "./sheet/talent.js";
import { SpecialAbilitySheet } from "./sheet/special-ability.js";
import { TraitSheet } from "./sheet/trait.js";
import { AptitudeSheet } from "./sheet/aptitude.js";
import { initializeHandlebars } from "./common/handlebars.js";
import { migrateWorld } from "./common/migration.js";
import { prepareCommonRoll, prepareCombatRoll, preparePsychicPowerRoll } from "./common/dialog.js";
import { commonRoll, combatRoll } from "./common/roll.js";
import { chatListeners } from "./common/chat.js";
import DhMacroUtil from "./common/macro.js";
import Dh from "./common/config.js";

// Import Helpers
import * as chat from "./common/chat.js";
import { registerDataModels } from "./setup/registerDataModels.js";

Hooks.once("init", function() {
    CONFIG.Combat.initiative = { formula: "@initiative.base + @initiative.bonus", decimals: 0 };
    CONFIG.Actor.documentClass = DarkHeresyActor;
    CONFIG.Item.documentClass = DarkHeresyItem;
    CONFIG.fontDefinitions["Caslon Antique"] = { editor: true, fonts: [] };
    CONFIG.ActiveEffect.legacyTransferral = false;
    game.darkHeresy = {
        config: Dh,
        testInit: {
            prepareCommonRoll,
            prepareCombatRoll,
            preparePsychicPowerRoll
        },
        tests: {
            commonRoll,
            combatRoll
        }
    };
    game.macro = DhMacroUtil;
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("dark-heresy", AcolyteSheet, { types: ["acolyte"], makeDefault: true });
    Actors.registerSheet("dark-heresy", NpcSheet, { types: ["npc"], makeDefault: true });
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

    registerDataModels();

    initializeHandlebars();

    game.settings.register("dark-heresy", "worldSchemaVersion", {
        name: "World Version",
        hint: "Used to automatically upgrade worlds data when the system is upgraded.",
        scope: "world",
        config: true,
        default: 0,
        type: Number
    });
    game.settings.register("dark-heresy", "autoCalcXPCosts", {
        name: "Calculate XP Costs",
        hint: "If enabled, calculate XP costs automatically.",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    game.settings.register("dark-heresy", "useSpraytemplate", {
        name: "Use Template with Spray Weapons",
        hint: "If enabled, Spray Weapons will require the user to put down a template before the roll is made. Templates are NOT removed automatically",
        scope: "client",
        config: true,
        default: true,
        type: Boolean
    });

});

Hooks.once("ready", function() {
    migrateWorld();
    CONFIG.ChatMessage.documentClass.prototype.getRollData = function() {
        return this.getFlag("dark-heresy", "rollData");
    };
});


/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */

/** Add Event Listeners for Buttons on chat boxes */
Hooks.once("renderChatLog", (chat, html) => {
    chatListeners(html);
});

/** Add Options to context Menu of chatmessages */
Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);

/**
 * Create a macro when dropping an entity on the hotbar
 * Item      - open roll dialog for item
 */
Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (data.type === "Item" || data.type === "Actor") {
        DhMacroUtil.createMacro(data, slot);
        return false;
    }
});

Hooks.on("renderDarkHeresySheet", (sheet, html, data) => {
    html.find("input.cost").prop("disabled", game.settings.get("dark-heresy", "autoCalcXPCosts"));
    html.find(":not(.psychic-power) > input.item-cost").prop("disabled", game.settings.get("dark-heresy", "autoCalcXPCosts"));
});
