export async function commonRoll(rollData) {
    await _computeTarget(rollData);
    await _rollTarget(rollData);
    await _sendToChat(rollData);
}

export async function combatRoll(rollData) {
    _computeTarget(rollData);
    if(rollData.skipAttackRoll) {
        _rollDamage(rollData);
    } else {
        _rollTarget(rollData);
        if (rollData.isSuccess) {
            _rollDamage(rollData);
        }
    }
    await _sendToChat(rollData);
}

export async function reportEmptyClip(rollData) {
    await _emptyClipToChat(rollData);
}

async function _computeTarget(rollData) {
    const range = (rollData.range) ? rollData.range : "0";
    let attackType = 0;
    if (typeof rollData.attackType !== "undefined" && rollData.attackType != null) {
        _computeRateOfFire(rollData);
        attackType = rollData.attackType.modifier;
    }
    let psyModifier = 0;
    if (typeof rollData.psy !== "undefined" && typeof rollData.psy.useModifier !== "undefined" && rollData.psy.useModifier) {
        //Set Current Psyrating to the allowed maximum if it is bigger
        if(rollData.psy.value > rollData.psy.max) {
            rollData.psy.value = rollData.psy.max;
        }
        psyModifier = (rollData.psy.rating - rollData.psy.value) * 10;
        rollData.psy.push = psyModifier < 0;
        if(rollData.psy.push && rollData.psy.warpConduit) {
            let ratingBonus = await (new Roll("1d5").evaluate()).total;
            rollData.psy.value += ratingBonus
        }
    }
    const formula = `0 + ${rollData.modifier} + ${range} + ${attackType} + ${psyModifier}`;
    let r = new Roll(formula, {});
    await r.evaluate();
    if (r.total > 60) {
        rollData.target = rollData.baseTarget + 60;
    } else if (r.total < -60) {
        rollData.target = rollData.baseTarget + -60;
    } else {
        rollData.target = rollData.baseTarget + r.total;
    }
    rollData.rollObject = r;
}

async function _rollTarget(rollData) {
    let r = new Roll("1d100", {});
    await r.evaluate();
    rollData.result = r.total;
    rollData.rollObject = r;
    rollData.isSuccess = rollData.result <= rollData.target;
    if (rollData.isSuccess) {
        rollData.dof = 0;
        rollData.dos = 1 + _getDegree(rollData.target, rollData.result);
    } else {
        rollData.dos = 0;
        rollData.dof = 1 + _getDegree(rollData.result, rollData.target);
    }
    if (typeof rollData.psy !== "undefined") _computePsychicPhenomena(rollData);
}

async function _rollDamage(rollData) {
    let formula = "0";
    rollData.damages = [];
    if (rollData.damageFormula) {
        rollData.damageFormula =`${rollData.damageFormula}+${rollData.damageBonus}`
        formula = _replaceSymbols(rollData.damageFormula, rollData);
    }
    let penetration = await _rollPenetration(rollData);
    let firstHit = await _computeDamage(formula, rollData.dos, penetration);
    if (firstHit.total !== 0) {
        const firstLocation = _getLocation(rollData.result);
        firstHit.location = firstLocation;
        firstHit.formula = rollData.damageFormula; // For Tooltip
        rollData.damages.push(firstHit);
        if (rollData.attackType.hitMargin > 0) {
            let maxAdditionalHit = Math.floor((rollData.dos - 1) / rollData.attackType.hitMargin);
            if (typeof rollData.maxAdditionalHit !== "undefined" && maxAdditionalHit > rollData.maxAdditionalHit) {
                maxAdditionalHit = rollData.maxAdditionalHit;
            }
            rollData.numberOfHit = maxAdditionalHit + 1;
            for (let i = 0; i < maxAdditionalHit; i++) {
                let additionalHit = await _computeDamage(formula, rollData.dos, penetration);
                additionalHit.location = _getAdditionalLocation(firstLocation, i);
                additionalHit.formula = rollData.damageFormula;
                rollData.damages.push(additionalHit);
            }
        } else {
            rollData.numberOfHit = 1;
        }
        let minDamage = rollData.damages.reduce((min, damage) => min.minDice < damage.minDice ? min : damage, rollData.damages[0]);
        if (minDamage.minDice < rollData.dos) {
          minDamage.total += (rollData.dos - minDamage.minDice)
          minDamage.result =  minDamage.result.replace(`(${minDamage.minDice})`, `(${minDamage.minDice} -> DoS: ${rollData.dos})`);
        };
    }
}

function _computeDamage(formula, rollData, penetration) {
    let r = new Roll(formula, {});
    await r.evaluate();
    let damage = {
        total: r.total,
        righteousFury: 0,
        penetration: penetration,
        dices: [],
        result: "",
        dos: dos,
        formula: formula,
        replaced: false,
        damageRoll: r.render()
    };
    let diceResult = "";
    r.terms.forEach((term) => {
        if (typeof term === 'object' && term !== null) {
            term.results.forEach(result => {
                if (result.active && result.result === rollData.rfFace) damage.righteousFury = _rollRighteousFury();
                if (result.active && result.result < rollData.dos) damage.dices.push(result.result);
                if (result.active && (typeof damage.minDice === "undefined" || result.result < damage.minDice)) damage.minDice = result.result;
                diceResult += `+(${result.result})`;
            });
        }
    });
    damage.result = formula.replace(/\dd\d*/gi, diceResult.substring(1));
    return damage;
}

async function  _rollPenetration(rollData) {
    let penetration = (rollData.penetrationFormula) ? _replaceSymbols(rollData.penetrationFormula, rollData) : "0";
    if (penetration.includes("("))
    {
        if (rollData.dos >= 3)
            penetration = parseInt(penetration.split("(")[1])
        else penetration = parseInt(penetration)
    }
    let r = new Roll(penetration.toString(), {});
    await r.evaluate();
    return r.total;
}

async function _rollRighteousFury() {
    let r = new Roll("1d5", {});
    await r.evaluate();
    return r.total;
}

function _computePsychicPhenomena(rollData) {
    rollData.psy.hasPhenomena = rollData.psy.push ? !_isDouble(rollData.result) : _isDouble(rollData.result);
}

function _isDouble(number) {
    if (number === 100) {
        return true;
    } else {
        const digit = number % 10;
        return number - digit === digit * 10;
    }
}

function _getLocation(result) {
    const toReverse = result < 10 ? "0" + result : result.toString();
    const locationTarget = parseInt(toReverse.split('').reverse().join(''));
    if (locationTarget <= 10) {
        return "ARMOUR.HEAD";
    } else if (locationTarget <= 20) {
        return "ARMOUR.RIGHT_ARM";
    } else if (locationTarget <= 30) {
        return "ARMOUR.LEFT_ARM";
    } else if (locationTarget <= 70) {
        return "ARMOUR.BODY";
    } else if (locationTarget <= 85) {
        return "ARMOUR.RIGHT_LEG";
    } else if (locationTarget <= 100) {
        return "ARMOUR.LEFT_LEG";
    } else {
        return "ARMOUR.BODY";
    }
}

function _computeRateOfFire(rollData) {
    rollData.maxAdditionalHit = 0;

    switch(rollData.attackType.name) {
        case "standard" :
            rollData.attackType.modifier = 10;
            rollData.attackType.hitMargin = 0;
            break;

        case "bolt" :
        case "blast" :
            rollData.attackType.modifier = 0;
            rollData.attackType.hitMargin = 0;
            break;

        case "swift" :
        case "semi_auto" :
        case "barrage" :
            rollData.attackType.modifier = 0;
            rollData.attackType.hitMargin = 2;
            rollData.maxAdditionalHit = rollData.rateOfFire.burst - 1;
            break;

        case "lightning":
        case "full_auto":
            rollData.attackType.modifier = -10;
            rollData.attackType.hitMargin = 1;
            rollData.maxAdditionalHit = rollData.rateOfFire.full - 1;
            break;

        case "storm":
            rollData.attackType.modifier = 0;
            rollData.attackType.hitMargin = 1;
            rollData.maxAdditionalHit = rollData.rateOfFire.full - 1;
            break;
        
        case "called_shot":
            rollData.attackType.modifier = -20;
            rollData.attackType.hitMargin = 0;
            break;

        case "charge":
            rollData.attackType.modifier = 20;
            rollData.attackType.hitMargin = 0;
            break;

        case "allOut":
            rollData.attackType.modifier = 30;
            rollData.attackType.hitMargin = 0;
            break;

        default:
            rollData.attackType.modifier = 0;
            rollData.attackType.hitMargin = 0;
            break;
    }
}

const additionalHit = {
    head: ["ARMOUR.HEAD", "ARMOUR.RIGHT_ARM", "ARMOUR.BODY", "ARMOUR.LEFT_ARM", "ARMOUR.BODY"],
    rightArm: ["ARMOUR.RIGHT_ARM", "ARMOUR.RIGHT_ARM", "ARMOUR.HEAD", "ARMOUR.BODY", "ARMOUR.RIGHT_ARM"],
    leftArm: ["ARMOUR.LEFT_ARM", "ARMOUR.LEFT_ARM", "ARMOUR.HEAD", "ARMOUR.BODY", "ARMOUR.LEFT_ARM"],
    body: ["ARMOUR.BODY", "ARMOUR.RIGHT_ARM", "ARMOUR.HEAD", "ARMOUR.LEFT_ARM", "ARMOUR.BODY"],
    rightLeg: ["ARMOUR.RIGHT_LEG", "ARMOUR.BODY", "ARMOUR.RIGHT_ARM", "ARMOUR.HEAD", "ARMOUR.BODY"],
    leftLeg: ["ARMOUR.LEFT_LEG", "ARMOUR.BODY", "ARMOUR.LEFT_ARM", "ARMOUR.HEAD", "ARMOUR.BODY"],
}

function _getAdditionalLocation(firstLocation, numberOfHit) {
    if (firstLocation === "ARMOUR.HEAD") {
        return _getLocationByIt(additionalHit.head, numberOfHit);
    } else if (firstLocation === "ARMOUR.RIGHT_ARM") {
        return _getLocationByIt(additionalHit.rightArm, numberOfHit);
    } else if (firstLocation === "ARMOUR.LEFT_ARM") {
        return _getLocationByIt(additionalHit.leftArm, numberOfHit);
    } else if (firstLocation === "ARMOUR.BODY") {
        return _getLocationByIt(additionalHit.body, numberOfHit);
    } else if (firstLocation === "ARMOUR.RIGHT_LEG") {
        return _getLocationByIt(additionalHit.rightLeg, numberOfHit);
    } else if (firstLocation === "ARMOUR.LEFT_LEG") {
        return _getLocationByIt(additionalHit.leftLeg, numberOfHit);
    } else {
        return _getLocationByIt(additionalHit.body, numberOfHit);
    }
}

function _getLocationByIt(part, numberOfHit) {
    const index = numberOfHit > (part.length - 1) ? part.length - 1 : numberOfHit;
    return part[index];
}


function _getDegree(a, b) {
    return Math.floor(a / 10) - Math.floor(b / 10);
}
/**
 * Replaces all Symbols in the given Formula with their Respective Values
 * The Symbols consist of Attribute Boni and Psyrating
 * @param {*} formula 
 * @param {*} rollData 
 */
function _replaceSymbols(formula, rollData) {
    if(rollData.psy) {
        formula = formula.replaceAll(/PR/gi, rollData.psy.value);
    }
    for(let boni of rollData.attributeBoni) {
        formula = formula.replaceAll(boni.regex, boni.value);
    }
    return formula;
}

async function _sendToChat(rollData) {
    rollData.render = await rollData.rollObject.render()
    // wait for any damage roll renders
    if(rollData.damages){
        rollData.damages.forEach(async d => d.damageRoll = await d.damageRoll)
    }

    const html = await renderTemplate("systems/dark-heresy/template/chat/roll.html", rollData);
    let chatData = {
        user: game.user.id,
        rollMode: game.settings.get("core", "rollMode"),
        content: html,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL
    };
    if(rollData.rollObject){
        chatData.roll = rollData.rollObject;

    }
    if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
        chatData.whisper = ChatMessage.getWhisperRecipients("GM");
    } else if (chatData.rollMode === "selfroll") {
        chatData.whisper = [game.user];
    }
    ChatMessage.create(chatData);
}

async function _emptyClipToChat(rollData) {
    let chatData = {
        user: game.user.id,
        content: `
          <div class="dark-heresy chat roll">
              <div class="background border">
                  <p><strong>Reload! Out of Ammo!</strong></p>
              </div>
          </div>
        `
    };
    ChatMessage.create(chatData);
}