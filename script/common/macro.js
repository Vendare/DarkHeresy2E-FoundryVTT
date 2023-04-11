import DarkHeresyUtil from "./util.js";
import { prepareCombatRoll, preparePsychicPowerRoll } from "./dialog.js";

export default class DhMacroUtil {

    static async createMacro(data, slot)
    {
    // Create item macro if rollable item - weapon, spell, prayer, trait, or skill
        let document = await fromUuid(data.uuid);
        let macro;
        if (document.documentName === "Item") {
            let command = `game.macro.rollAttack("${document.name}", "${document.type}");`;
            macro = game.macros.contents.find(m => (m.name === document.name) && (m.command === command));
            if (!macro) {
                macro = await Macro.create({
                    name: document.name,
                    type: "script",
                    img: document.img,
                    command: command
                }, { displaySheet: false });
            }
        }
        else if (document.documentName === "Actor") {
            macro = await Macro.create({
                name: document.name,
                type: "script",
                img: document.img,
                command: `game.actors.get("${document.id}").sheet.render(true)`
            }, { displaySheet: false });
        }
        if (macro) game.user.assignHotbarMacro(macro, slot);
    }

    static rollAttack(itemName, itemType) {
        const speaker = ChatMessage.getSpeaker();
        let actor;

        if (speaker.token) actor = game.actors.tokens[speaker.token];
        if (!actor) actor = game.actors.get(speaker.actor);

        let item = actor ? actor.items.find(i => i.name === itemName && i.type === itemType) : null;

        if (!item) return ui.notifications.warn(`${game.i18n.localize("NOTIFICATION.MACRO_ITEM_NOT_FOUND")} ${itemName}`);

        if (item.isPsychicPower) {
            this.rollPsychicPower(actor, item);
        }
        if (item.isWeapon) {
            this.rollWeapon(actor, item);
        }
    }

    static rollPsychicPower(actor, item) {
        let rollData = DarkHeresyUtil.createPsychicRollData(actor, item);
        preparePsychicPowerRoll(rollData);
    }

    static rollWeapon(actor, item) {
        let rollData = DarkHeresyUtil.createWeaponRollData(actor, item);
        prepareCombatRoll(rollData);
    }
}
