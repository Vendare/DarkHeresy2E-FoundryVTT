import { commonRoll, combatRoll, reportEmptyClip, shipCombatRoll } from "./roll.js";

/**
 * Show a generic roll dialog.
 * @param {object} rollData
 */
export async function prepareCommonRoll(rollData) {
  const html = await renderTemplate("systems/dark-heresy/template/dialog/common-roll.html", rollData);
  let dialog = new Dialog({
    title: game.i18n.localize(rollData.name),
    content: html,
    buttons: {
      roll: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize("BUTTON.ROLL"),
        callback: async html => {
          rollData.name = game.i18n.localize(rollData.name);
          rollData.baseTarget = parseInt(html.find("#target")[0].value, 10);
          rollData.rolledWith = html.find("[name=characteristic] :selected").text();
          rollData.modifier = html.find("#modifier")[0].value;
          rollData.isCombatTest = false;
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

export async function prepareAcquireRoll(rollData) {
  const html = await renderTemplate("systems/dark-heresy/template/dialog/acquire-roll.html", rollData);
  let dialog = new Dialog({
    title: game.i18n.localize(rollData.name),
    content: html,
    buttons: {
      roll: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize("BUTTON.ROLL"),
        callback: async html => {
          rollData.name = game.i18n.localize(rollData.name);
          rollData.baseTarget = parseInt(html.find("#target")[0].value, 10);
          rollData.rolledWith = html.find("[name=characteristic] :selected").text();
          rollData.modifier = html.find("#modifier")[0].value;
          rollData.rarity = html.find("#rarity")[0].value;
          rollData.quality = html.find("#quality")[0].value;
          rollData.scale = html.find("#scale")[0].value;
          rollData.acquire = rollData.rarity+ "+" + rollData.quality+ "+" + rollData.scale;
          rollData.isCombatTest = false;
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
    const html = await renderTemplate("systems/dark-heresy/template/dialog/combat-roll.html", rollData);
    let dialog = new Dialog({
        title: rollData.name,
        content: html,
        buttons: {
            roll: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("BUTTON.ROLL"),
                callback: async (html) => {
                    rollData.name = game.i18n.localize(rollData.name);
                    rollData.baseTarget = parseInt(html.find("#target")[0]?.value, 10);
                    rollData.modifier = html.find("#modifier")[0]?.value;
                    const range = html.find("#range")[0];
                    if (typeof range !== "undefined" && range !== null) {
                        rollData.range = range.value;
                        rollData.rangeText = range.options[range.selectedIndex].text;
                    }
                    const attackType = html.find("#attackType")[0];
                    rollData.attackType = { 
                      name : attackType?.value,
                      text : attackType?.options[attackType.selectedIndex].text,
                      modifier : 0
                    };
                    const aim = html.find("#aim")[0]
                    if(rollData.weaponTraits.skipAttackRoll) {}
                    else {
                      rollData.aim = {
                        val : aim.value,
                        isAiming : aim.value !== "0",
                        text : aim?.options[aim.selectedIndex].text
                      };
                      if (rollData.weaponTraits.inaccurate) {rollData.aim.val=0;} else
                      if (rollData.weaponTraits.accurate&&rollData.aim.val>0) {rollData.aim.val=rollData.aim.val+"+"+10;}
                    }
                    rollData.damageFormula = html.find("#damageFormula")[0].value.replace(' ', '');
                    rollData.damageType = html.find("#damageType")[0].value;
                    rollData.damageBonus = parseInt(html.find("#damageBonus")[0].value, 10);
                    rollData.penetrationFormula = html.find("#penetration")[0].value;
                    rollData.isCombatTest = true;
                    if (rollData.weaponTraits.skipAttackRoll) {rollData.attackType.name = "standard";}
                    if (rollData.isRange && rollData.clip.max > 0) {
                        const weapon = game.actors.get(rollData.ownerId)?.items?.get(rollData.itemId);
                        if(weapon) {
                            switch(rollData.attackType.name) {
                                case 'standard':
                                case 'called_shot': {
                                    if (rollData.clip.value < 1) {
                                        return reportEmptyClip(rollData);
                                    } else {
                                        rollData.clip.value -= 1;                                        
                                        await weapon.update({"system.clip.value" : rollData.clip.value})
                                    }
                                    break;
                                }
                                case 'semi_auto': {
                                    if (rollData.clip.value < rollData.rateOfFire.burst) {
                                        return reportEmptyClip(rollData);
                                    } else {
                                        rollData.clip.value -= rollData.rateOfFire.burst;
                                        await weapon.update({"system.clip.value" : rollData.clip.value})
                                    }
                                    break;
                                }
                                case 'full_auto': {
                                    if (rollData.clip.value < rollData.rateOfFire.full) {
                                        return reportEmptyClip(rollData);
                                    } else {
                                        rollData.clip.value -= rollData.rateOfFire.full;
                                        await weapon.update({"system.clip.value" : rollData.clip.value})
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    await combatRoll(rollData);
                },
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("BUTTON.CANCEL"),
                callback: () => {},
            },
        },
        default: "roll",
        close: () => {},
    }, {width: 200});
    dialog.render(true);
}

/**
 * Show a psychic power roll dialog.
 * @param {object} rollData
 */
export async function preparePsychicPowerRoll(rollData) {
  const html = await renderTemplate("systems/dark-heresy/template/dialog/psychic-power-roll.html", rollData);
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
          rollData.modifier = html.find("#modifier")[0].value;
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
          rollData.isCombatTest = true;
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

export async function prepareShipCombatRoll(rollData, actorRef) {
  const html = await renderTemplate("systems/dark-heresy/template/dialog/shipcombat-roll.html", rollData);
  let dialog = new Dialog({
      title: rollData.name,
      content: html,
      buttons: {
          roll: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize("BUTTON.ROLL"),
              callback: async (html) => {
                  rollData.name = game.i18n.localize(rollData.name);
                  rollData.baseTarget = parseInt(html.find("#target")[0]?.value, 10);
                  rollData.modifier = html.find("#modifier")[0]?.value;
                  const range = html.find("#range")[0];
                  if (typeof range !== "undefined" && range !== null) {
                      rollData.range = range.value;
                      rollData.rangeText = range.options[range.selectedIndex].text;
                  }
                  rollData.attackType = { text: "None", name: "none", modifier: 0};
                  if (rollData.isCannon) {rollData.attackType.name="macro"; rollData.attackType.text="Macro";} else
                  if (rollData.isLance) {rollData.attackType.name="lance"; rollData.attackType.text="Lance";} else
                  if (rollData.isTorpedo) {rollData.attackType.name="torpedo"; rollData.attackType.text="Torpedo";} else
                  if (rollData.isNova) {rollData.attackType.name="nova"; rollData.attackType.text="Nova"; rollData.attackType.modifier = -20;} else
                  {rollData.attackType.name="none"}

                  rollData.damageFormula = html.find("#damageFormula")[0].value.replace(' ', '');
                  rollData.damageBonus = parseInt(html.find("#damageBonus")[0].value, 10);
                  rollData.critical = html.find("#critical")[0].value;
                  rollData.isCombatTest = true;
                  await shipCombatRoll(rollData);
              },
          },
          cancel: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize("BUTTON.CANCEL"),
              callback: () => {},
          },
      },
      default: "roll",
      close: () => {},
  }, {width: 200});
  dialog.render(true);
}