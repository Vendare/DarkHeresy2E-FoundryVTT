import { commonRoll, combatRoll, reportEmptyClip } from "./roll.js";

/**
 * Show a generic roll dialog.
 * @param {object} rollData
 */
export async function prepareCommonRoll(rollData) {
    const html = await renderTemplate("systems/dark-heresy/template/dialog/common-roll.hbs", rollData);
    let dialog = new Dialog({
        title: game.i18n.localize(rollData.name),
        content: html,
        buttons: {
            roll: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("BUTTON.ROLL"),
                callback: async html => {
                    if (rollData.isEvasion) {
                        const skill = html.find("#selectedSkill")[0];
                        if (skill) {
                            rollData.name = game.i18n.localize(skill.options[skill.selectedIndex].text);
                            let actor = game.actors[rollData.ownerId];
                            if (actor) {
                                let evasion = actor.skills[skill.value];
                                rollData.baseTarget = evasion?.total;
                            }
                        }
                    } else {
                        rollData.name = game.i18n.localize(rollData.name);
                        rollData.baseTarget = parseInt(html.find("#target")[0].value, 10);
                        rollData.rolledWith = html.find("[name=characteristic] :selected").text();
                    }
                    rollData.modifier = parseInt(html.find("#modifier")[0].value, 10);
                    rollData.isDamageRoll = false;
                    rollData.isCombatRoll = false;
                    await commonRoll(rollData);
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("BUTTON.CANCEL"),
                callback: () => {}
            }

        },
        default: "roll",
        close: () => {},
        render: html => {
            const sel = html.find("select[name=characteristic");
            const target = html.find("#target");
            sel.change(ev => {
                target.val(sel.val());
            });
        }
    }, {
        width: 200
    });
    dialog.render(true);
}

/**
 * Show a combat roll dialog.
 * @param {object} rollData
 * @param {DarkHeresyActor} actorRef
 */
export async function prepareCombatRoll(rollData, actorRef) {
    const html = await renderTemplate("systems/dark-heresy/template/dialog/combat-roll.hbs", rollData);
    let dialog = new Dialog({
        title: rollData.name,
        content: html,
        buttons: {
            roll: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("BUTTON.ROLL"),
                callback: async html => {
                    rollData.name = game.i18n.localize(rollData.name);
                    rollData.baseTarget = parseInt(html.find("#target")[0]?.value, 10);
                    rollData.modifier = parseInt(html.find("#modifier")[0]?.value, 10);
                    const range = html.find("#range")[0];
                    if (range) {
                        rollData.range = parseInt(range.value, 10);
                        rollData.rangeText = range.options[range.selectedIndex].text;
                    }

                    const attackType = html.find("#attackType")[0];
                    rollData.attackType = {
                        name: attackType?.value,
                        text: attackType?.options[attackType.selectedIndex].text,
                        modifier: 0
                    };

                    const aim = html.find("#aim")[0];
                    rollData.aim = {
                        val: parseInt(aim?.value, 10),
                        isAiming: aim?.value !== "0",
                        text: aim?.options[aim.selectedIndex].text
                    };

                    if (rollData.weaponTraits.inaccurate) {
                        rollData.aim.val=0;
                    } else if (rollData.weaponTraits.accurate && rollData.aim.isAiming) {
                        rollData.aim.val += 10;
                    }

                    rollData.damageFormula = html.find("#damageFormula")[0].value.replace(" ", "");
                    rollData.damageType = html.find("#damageType")[0].value;
                    rollData.damageBonus = parseInt(html.find("#damageBonus")[0].value, 10);
                    rollData.penetrationFormula = html.find("#penetration")[0].value;
                    rollData.isDamageRoll = false;
                    rollData.isCombatRoll = true;

                    if (rollData.weaponTraits.skipAttackRoll) {
                        rollData.attackType.name = "standard";
                    }

                    if (rollData.isRange && rollData.clip.max > 0) {
                        let weapon = game.actors.get(rollData.ownerId)?.items?.get(rollData.itemId);
                        if (weapon) {
                            switch (rollData.attackType.name) {
                                case "standard":
                                case "called_shot": {
                                    if (rollData.clip.value < 1) {
                                        return reportEmptyClip(rollData);
                                    } else {
                                        rollData.clip.value -= 1;
                                        await weapon.update({"system.clip.value": rollData.clip.value});
                                    }
                                    break;
                                }
                                case "semi_auto": {
                                    if (rollData.clip.value < rollData.rateOfFire.burst) {
                                        return reportEmptyClip(rollData);
                                    } else {
                                        rollData.clip.value -= rollData.rateOfFire.burst;
                                        await weapon.update({"system.clip.value": rollData.clip.value});
                                    }
                                    break;
                                }
                                case "full_auto": {
                                    if (rollData.clip.value < rollData.rateOfFire.full) {
                                        return reportEmptyClip(rollData);
                                    } else {
                                        rollData.clip.value -= rollData.rateOfFire.full;
                                        await weapon.update({"system.clip.value": rollData.clip.value});
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    await combatRoll(rollData);
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("BUTTON.CANCEL"),
                callback: () => {}
            }
        },
        default: "roll",
        close: () => {}
    }, {width: 200});
    dialog.render(true);
}

/**
 * Show a psychic power roll dialog.
 * @param {object} rollData
 */
export async function preparePsychicPowerRoll(rollData) {
    const html = await renderTemplate("systems/dark-heresy/template/dialog/psychic-power-roll.hbs", rollData);
    let dialog = new Dialog({
        title: rollData.name,
        content: html,
        buttons: {
            roll: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("BUTTON.ROLL"),
                callback: async html => {
                    rollData.name = game.i18n.localize(rollData.name);
                    rollData.baseTarget = parseInt(html.find("#target")[0].value, 10);
                    rollData.modifier = parseInt(html.find("#modifier")[0].value, 10);
                    rollData.psy.value = parseInt(html.find("#psy")[0].value, 10);
                    rollData.psy.warpConduit = html.find("#warpConduit")[0].checked;
                    rollData.damageFormula = html.find("#damageFormula")[0].value;
                    rollData.damageType = html.find("#damageType")[0].value;
                    rollData.damageBonus = parseInt(html.find("#damageBonus")[0].value, 10);
                    rollData.penetrationFormula = html.find("#penetration")[0].value;
                    rollData.rateOfFire = { burst: rollData.psy.value, full: rollData.psy.value };
                    const attackType = html.find("#attackType")[0];
                    rollData.attackType.name = attackType.value;
                    rollData.attackType.text = attackType.options[attackType.selectedIndex].text;
                    rollData.psy.useModifier = true;
                    rollData.isDamageRoll = false;
                    rollData.isCombatRoll = true;
                    await combatRoll(rollData);
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("BUTTON.CANCEL"),
                callback: () => {}
            }
        },
        default: "roll",
        close: () => {}
    }, {width: 200});
    dialog.render(true);
}
