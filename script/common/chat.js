import { commonRoll, combatRoll, damageRoll } from "./roll.js";
import { prepareCommonRoll } from "./dialog.js";
import DarkHeresyUtil from "./util.js";


/**
 * Listeners for Chatmessages
 * @param {HTMLElement} html
 */
export function chatListeners(html) {
    html.on("click", ".invoke-test", onTestClick.bind(this));
    html.on("click", ".invoke-damage", onDamageClick.bind(this));
    html.on("click", ".reload-Weapon", onReloadClick.bind(this));
    html.on("dblclick", ".dark-heresy.chat.roll>.background.border", onChatRollClick.bind(this));
}

/**
 * This function is used to hook into the Chat Log context menu to add additional options to each message
 * These options make it easy to conveniently apply damage to controlled tokens based on the value of a Roll
 *
 * @param {HTMLElement} html    The Chat Message being rendered
 * @param {Array} options       The Array of Context Menu options
 *
 * @returns {Array}              The extended options Array including new context choices
 */
export const addChatMessageContextOptions = function(html, options) {
    let canApply = li => {
        const message = game.messages.get(li.data("messageId"));
        return message.getRollData()?.flags.isDamageRoll
            && message.isContentVisible
            && canvas.tokens.controlled.length;
    };
    options.push(
        {
            name: game.i18n.localize("CHAT.CONTEXT.APPLY_DAMAGE"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canApply,
            callback: li => applyChatCardDamage(li)
        }
    );

    let canReroll = li => {
        const message = game.messages.get(li.data("messageId"));
        let actor = game.actors.get(message.getRollData()?.ownerId);
        return message.isRoll
            && !message.getRollData()?.flags.isDamageRoll
            && message.isContentVisible
            && actor?.fate.value > 0;
    };

    options.push(
        {
            name: game.i18n.localize("CHAT.CONTEXT.REROLL"),
            icon: '<i class="fa-solid fa-repeat"></i>',
            condition: canReroll,
            callback: li => {
                const message = game.messages.get(li.data("messageId"));
                rerollTest(message.getRollData());
            }
        }
    );
    return options;
};

/**
 * Apply rolled dice damage to the token or tokens which are currently controlled.
 * This allows for damage to be scaled by a multiplier to account for healing, critical hits, or resistance
 *
 * @param {HTMLElement} roll    The chat entry which contains the roll data
 * @param {number} multiplier   A damage multiplier to apply to the rolled damage.
 * @returns {Promise}
 */
function applyChatCardDamage(roll, multiplier) {
    // Get the damage data, get them as arrays in case of multiple hits
    const amount = roll.find(".damage-total");
    const location = roll.find(".damage-location");
    const penetration = roll.find(".damage-penetration");
    const type = roll.find(".damage-type");
    const righteousFury = roll.find(".damage-righteous-fury");

    // Put the data from different hits together
    const damages = [];
    for (let i = 0; i < amount.length; i++) {
        damages.push({
            amount: $(amount[i]).text(),
            location: $(location[i]).data("location"),
            penetration: $(penetration[i]).text(),
            type: $(type[i]).text(),
            righteousFury: $(righteousFury[i]).text()
        });
    }

    // Apply to any selected actors
    return Promise.all(canvas.tokens.controlled.map(t => {
        const a = t.actor;
        return a.applyDamage(damages);
    }));
}

/**
 * Rerolls the Test using the same Data as the initial Roll while reducing an actors fate
 * @param {object} rollData
 * @returns {Promise}
 */
function rerollTest(rollData) {
    let actor = game.actors.get(rollData.ownerId);
    actor.update({ "system.fate.value": actor.fate.value -1 });
    delete rollData.damages; // Reset so no old data is shown on failure

    rollData.flags.isReRoll = true;
    if (rollData.flags.isCombatRoll) {
    // All the regexes in this are broken once retrieved from the chatmessage
    // No idea why this happens so we need to fetch them again so the roll works correctly
        rollData.attributeBoni = actor.attributeBoni;
        return combatRoll(rollData);
    } else {
        return commonRoll(rollData);
    }
}

/**
 * Rolls a Test for the Selected Actor
 * @param {Event} ev
 */
function onTestClick(ev) {
    let actor = game.macro.getActor();
    let id = $(ev.currentTarget).parents(".message").attr("data-message-id");
    let msg = game.messages.get(id);
    let rollData = msg.getRollData();

    if (!actor) {
        ui.notifications.warn(`${game.i18n.localize("NOTIFICATION.MACRO_ACTOR_NOT_FOUND")}`);
        return;
    }
    let evasions = {
        dodge: DarkHeresyUtil.createSkillRollData(actor, "dodge"),
        parry: DarkHeresyUtil.createSkillRollData(actor, "parry"),
        deny: DarkHeresyUtil.createCharacteristicRollData(actor, "willpower"),
        selected: "dodge"
    };
    rollData.evasions = evasions;
    rollData.target.modifier = 0;
    rollData.flags.isEvasion = true;
    rollData.flags.isAttack = false;
    rollData.flags.isDamageRoll = false;
    rollData.flags.isCombatRoll = false;
    if (rollData.psy) rollData.psy.display = false;
    rollData.name = game.i18n.localize("DIALOG.EVASION");
    prepareCommonRoll(rollData);
}

/**
 * Rolls an Evasion chat for the currently selected character from the chatcard
 * @param {Event} ev
 * @returns {Promise}
 */
function onDamageClick(ev) {
    let id = $(ev.currentTarget).parents(".message").attr("data-message-id");
    let msg = game.messages.get(id);
    let rollData = msg.getRollData();
    rollData.flags.isEvasion = false;
    rollData.flags.isCombatRoll = false;
    rollData.flags.isDamageRoll = true;
    return damageRoll(rollData);
}

/**
 * Reloads the associated weapon who is empty Without considering ammo in the users inventory
 * @param {Event} ev
 */
async function onReloadClick(ev) {
    let id = $(ev.currentTarget).parents(".message").attr("data-message-id");
    let msg = game.messages.get(id);
    let rollData = msg.getRollData();
    let weapon = game.actors.get(rollData.ownerId)?.items?.get(rollData.itemId);
    await weapon.update({"system.clip.value": rollData.weapon.clip.max});
}

/**
 * Show/hide dice rolls when a chat message is clicked.
 * @param {Event} event
 */
function onChatRollClick(event) {
    event.preventDefault();
    let roll = $(event.currentTarget.parentElement);
    let tip = roll.find(".dice-rolls");
    if ( !tip.is(":visible") ) tip.slideDown(200);
    else tip.slideUp(200);
}
