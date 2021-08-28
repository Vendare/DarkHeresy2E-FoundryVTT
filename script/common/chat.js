/**
 * This function is used to hook into the Chat Log context menu to add additional options to each message
 * These options make it easy to conveniently apply damage to controlled tokens based on the value of a Roll
 *
 * @param {HTMLElement} html    The Chat Message being rendered
 * @param {Array} options       The Array of Context Menu options
 *
 * @return {Array}              The extended options Array including new context choices
 */
export const addChatMessageContextOptions = function (html, options) {
    let canApply = li => {
        const message = game.messages.get(li.data("messageId"));
        return message.isRoll && message.isContentVisible && canvas.tokens.controlled.length;
    };
    options.push(
        {
            name: game.i18n.localize("CHAT.CONTEXT.APPLY_DAMAGE"),
            icon: '<i class="fas fa-user-minus"></i>',
            condition: canApply,
            callback: li => applyChatCardDamage(li)
        }
    );
    return options;
};

/**
 * Apply rolled dice damage to the token or tokens which are currently controlled.
 * This allows for damage to be scaled by a multiplier to account for healing, critical hits, or resistance
 *
 * @param {HTMLElement} roll    The chat entry which contains the roll data
 * @param {Number} multiplier   A damage multiplier to apply to the rolled damage.
 * @return {Promise}
 */
function applyChatCardDamage(roll, multiplier) {
    // get the damage data, get them as arrays in case of multiple hits
    const amount = roll.find('.damage-total')
    const location = roll.find('.damage-location')
    const penetration = roll.find('.damage-penetration')
    const type = roll.find('.damage-type')
    const righteousFury = roll.find('.damage-righteous-fury')

    // put the data from different hits together
    const damages = []
    for (let i = 0; i < amount.length; i++) {
        damages.push({
            amount: $(amount[i]).text(),
            location: $(location[i]).data("location"),
            penetration: $(penetration[i]).text(),
            type: $(type[i]).text(),
            righteousFury: $(righteousFury[i]).text(),
        })
    }

    // apply to any selected actors
    return Promise.all(canvas.tokens.controlled.map(t => {
        const a = t.actor;
        return a.applyDamage(damages);
    }));
}

export const showRolls =(html) => {
    // Show dice rolls on click
    html.on("click", ".dark-heresy.chat.roll>.background.border", onChatRollClick);
}

function onChatRollClick(event) {
    event.preventDefault();
    let roll = $(event.currentTarget.parentElement),
        tip = roll.find(".dice-rolls");
    if ( !tip.is(":visible") ) tip.slideDown(200);
    else tip.slideUp(200);
}