export async function commonRoll(rollData) {
    await _computeTarget(rollData);
    await _rollTarget(rollData);
    await _sendToChat(rollData);
}

export async function combatRoll(rollData) {
    if(rollData.weaponTraits.skipAttackRoll) {
        rollData.result = 5 // Attacks that skip the hit roll always hit body; 05 reversed 50 = body
        await _rollDamage(rollData);
        //Without a To Hit Roll we need a substitute otherwise foundry can't render the message
        rollData.rollObject = rollData.damages[0].damageRoll;
    } else {
        await _computeTarget(rollData);
        await _rollTarget(rollData);
        if (rollData.isSuccess) {
           await _rollDamage(rollData);
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
            let ratingBonus = await (new Roll("1d5").evaluate({async:false})).total;
            rollData.psy.value += ratingBonus
        }
    }
    const formula = `0 + ${rollData.modifier} + ${range} + ${attackType} + ${psyModifier}`;
    let r = new Roll(formula, {});
    await r.evaluate({async:false});
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
    await r.evaluate({async:false});
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
        formula = rollData.damageFormula;
        
        if(rollData.weaponTraits.tearing) {
            formula = _appendTearing(formula);
        }
        if(rollData.weaponTraits.proven) { 
            formula = _appendNumberedDiceModifier(formula, "min", rollData.weaponTraits.proven);
        }
        if(rollData.weaponTraits.primitive) {
            formula = _appendNumberedDiceModifier(formula, "max", rollData.weaponTraits.primitive);
        }

        formula =`${formula}+${rollData.damageBonus}`; 
        rollData.damageFormula = _replaceSymbols(formula, rollData);
    }
    let penetration = await _rollPenetration(rollData);
    let firstHit = await _computeDamage(penetration, rollData);
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
                let additionalHit = await _computeDamage(penetration, rollData);
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
        };
    }
}

async function _computeDamage(penetration, rollData) {
    let r = new Roll(rollData.damageFormula);
    await r.evaluate({async:false});
    let damage = {
        total: r.total,
        righteousFury: 0,
        dices: [],
        penetration: penetration,
        dos: rollData.dos,
        formula: rollData.damageFormula,
        replaced: false,
        damageRender: await r.render()
    };

    //Without a To Hit we a roll to associate the chat message with
    if(rollData.weaponTraits.skipAttackRoll) {
        damage.damageRoll = r;
    }

    r.terms.forEach((term) => {
        if (typeof term === 'object' && term !== null) {
            let rfFace = rollData.weaponTraits.rfFace ? rollData.weaponTraits.rfFace : term.faces; // without the Vengeful weapon trait rfFace is undefined
            term.results?.forEach(async result => {
                let dieResult = result.count ? result.count : result.result; // result.count = actual value if modified by term
                if (result.active && dieResult >= rfFace) damage.righteousFury = await _rollRighteousFury();
                if (result.active && dieResult < rollData.dos) damage.dices.push(dieResult);
                if (result.active && (typeof damage.minDice === "undefined" || dieResult < damage.minDice)) damage.minDice = dieResult;
            });
        }
    });
    return damage;
}

async function  _rollPenetration(rollData) {
    let penetration = (rollData.penetrationFormula) ? _replaceSymbols(rollData.penetrationFormula, rollData) : "0";
    let multiplier = 1;

    if (penetration.includes("(")) //Legacy Support
    {
        if (rollData.dos >= 3) {
            let rsValue = penetration.match(/\(\d+\)/gi) // Get Razorsharp Value
            penetration = penetration.replace(/\d+.*\(\d+\)/gi, rsValue) // Replace construct BaseValue(RazorsharpValue) with the extracted data
        }
            
    } else if(rollData.razorsharp) {
        if(rollData.dos >= 3) {
            multiplier = 2;
        }
    }
    let r = new Roll(penetration.toString());
    await r.evaluate({async:false});
    return r.total * multiplier;
}

async function _rollRighteousFury() {
    let r = new Roll("1d5");
    await r.evaluate({async:false});
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

function _appendNumberedDiceModifier(formula, modifier, value) {
    let diceRegex = /\d+d\d+/;
    if(!formula.includes(modifier))
    {
        let match = formula.match(diceRegex);
        if(match) {
            let dice = match[0];
            dice += `${modifier}${value}`;
            formula = formula.replace(diceRegex, dice);
        }
    }
    return formula;
}

function _appendTearing(formula) {
    let diceRegex = /\d+d\d+/;
    if(!formula.match(/dl|kh/gi, formula)) { // already has drop lowest or keep highest
        let match = formula.match(/\d+/g, formula)
        let numDice = parseInt(match[0]) + 1;
        let faces = parseInt(match[1]);
        let diceTerm = `${numDice}d${faces}dl`;
        formula = formula.replace(diceRegex, diceTerm);
    }
    return formula;
}

async function _sendToChat(rollData) {
    let chatData = {};       
    
    if(rollData.rollObject){
        rollData.render = await rollData.rollObject.render() 
        chatData.roll = rollData.rollObject;
    }
    const html = await renderTemplate("systems/dark-heresy/template/chat/roll.html", rollData);
    
    chatData.user = game.user.id,
    chatData.rollMode = game.settings.get("core", "rollMode"),
    chatData.content = html,
    chatData.type = CONST.CHAT_MESSAGE_TYPES.ROLL    
   
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