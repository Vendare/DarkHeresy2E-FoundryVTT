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
import { prepareCommonRoll, prepareCombatRoll, preparePsychicPowerRoll } from "./dialog.js";
import { commonRoll, combatRoll } from "./roll.js";

// Import Helpers
import * as chat from "./chat.js";

Hooks.once("init", () => {
    CONFIG.Combat.initiative = { formula: "@initiative.base + @initiative.bonus", decimals: 0 };
    CONFIG.Actor.entityClass = DarkHeresyActor;
    CONFIG.Item.entityClass = DarkHeresyItem;
    CONFIG.fontFamilies.push("Caslon Antique");
    game.darkHeresy = {
        prepareCommonRoll,
        prepareCombatRoll,
        preparePsychicPowerRoll,
        commonRoll,
        combatRoll
    };
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
    initializeHandlebars();
    game.settings.register("dark-heresy", "worldSchemaVersion", {
        name: "World Version",
        hint: "Used to automatically upgrade worlds data when the system is upgraded.",
        scope: "world",
        config: true,
        default: 0,
        type: Number,
    });
    game.settings.register("dark-heresy", "defaultTokenDisplay", {
        name: "Default token name display mode",
        hint: "Choose default behavior on hovering on token names.",
        scope: "world",
        config: true,
        type: String,
        default: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
        choices: {
          [CONST.TOKEN_DISPLAY_MODES.NONE]: "Never Displayed",
          [CONST.TOKEN_DISPLAY_MODES.CONTROL]: "When Controlled",
          [CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER]: "Hovered by Owner",
          [CONST.TOKEN_DISPLAY_MODES.HOVER]: "Hovered by Anyone",
          [CONST.TOKEN_DISPLAY_MODES.OWNER]: "Always for Owner",
          [CONST.TOKEN_DISPLAY_MODES.ALWAYS]: "Always for Everyone"
        }
    });
});

Hooks.once("ready", () => {
    migrateWorld();
});

Hooks.on("preCreateActor", (createData) => {
    mergeObject(createData, {
        "token.bar1" :{ "attribute" : "wounds" },
        "token.bar2" :{ "attribute" : "fatigue" },
        "token.displayName" : game.settings.get('dark-heresy', 'defaultTokenDisplay'),
        "token.displayBars" : CONST.TOKEN_DISPLAY_MODES.ALWAYS,
        "token.disposition" : CONST.TOKEN_DISPOSITIONS.NEUTRAL,
        "token.name" : createData.name
    });
    if (createData.type === "acolyte") {
        createData.token.vision = true;
        createData.token.actorLink = true;
    }
});


/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */

Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);
