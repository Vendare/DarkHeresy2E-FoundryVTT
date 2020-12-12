export async function commonRoll(rollData) {
    _computeTarget(rollData);
    _rollTarget(rollData);
    await _sendToChat(rollData);
}

export async function combatRoll(rollData) {
    _computeTarget(rollData);
    _rollTarget(rollData);
    if (rollData.isSuccess) {
        _rollDamage(rollData);
    }
    await _sendToChat(rollData);
}

function _computeTarget(rollData) {
    const range = (rollData.range) ? rollData.range : "0";
    let attackType = 0;
    if (typeof rollData.attackType !== "undefined" && rollData.attackType != null) {
        _computeRateOfFire(rollData);
        attackType = rollData.attackType.modifier;
    }
    let psyModifier = 0;
    if (typeof rollData.psy !== "undefined" && typeof rollData.psy.useModifier !== "undefined" && rollData.psy.useModifier) {
        psyModifier = (rollData.psy.max - rollData.psy.value) * 10;
        rollData.psy.push = psyModifier < 0;
    }
    const formula = `0 + ${rollData.modifier} + ${range} + ${attackType} + ${psyModifier}`;
    let r = new Roll(formula, {});
    r.evaluate();
    if (r.total > 60) {
        rollData.target = rollData.baseTarget + 60;
    } else if (r.total < -60) {
        rollData.target = rollData.baseTarget + -60;
    } else {
        rollData.target = rollData.baseTarget + r.total;
    }
    rollData.rollObject = r;
}

function _rollTarget(rollData) {
    let r = new Roll("1d100", {});
    r.evaluate();
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

function _rollDamage(rollData) {
    let formula = "0";
    rollData.damages = [];
    if (rollData.damageFormula) formula = `${rollData.damageFormula} + ${rollData.damageBonus}`;
    let penetration = _rollPenetration(rollData);
    let firstHit = _computeDamage(formula, rollData.dos, penetration);
    if (firstHit.total !== 0) {
        const firstLocation = _getLocation(rollData.result);
        firstHit.location = firstLocation;
        rollData.damages.push(firstHit);
        if (rollData.attackType.hitMargin > 0) {
            let maxAdditionalHit = Math.floor((rollData.dos - 1) / rollData.attackType.hitMargin);
            if (typeof rollData.maxAdditionalHit !== "undefined" && maxAdditionalHit > rollData.maxAdditionalHit) {
                maxAdditionalHit = rollData.maxAdditionalHit;
            }
            rollData.numberOfHit = maxAdditionalHit + 1;
            for (let i = 0; i < maxAdditionalHit; i++) {
                let additionalHit = _computeDamage(formula, rollData.dos, penetration);
                additionalHit.location = _getAdditionalLocation(firstLocation, i);
                rollData.damages.push(additionalHit);
            }
        } else {
            rollData.numberOfHit = 1;
        }
        let minDamage = rollData.damages.reduce((min, damage) => min.minDice < damage.minDice ? min : damage, rollData.damages[0]);
        if (minDamage.minDice < rollData.dos) minDamage.total += (rollData.dos - minDamage.minDice);
    }
}

function _computeDamage(formula, dos, penetration) {
    let r = new Roll(formula, {});
    r.evaluate();
    let damage = {
        total: r.total,
        righteousFury: 0,
        penetration: penetration,
        dices: []
    };
    r.terms.forEach((term) => {
        if (typeof term === 'object' && term !== null) {
            term.results.forEach(result => {
                if (result.active && result.result === term.faces) damage.righteousFury = _rollRighteousFury();
                if (result.active && result.result < dos) damage.dices.push(result.result);
                if (result.active && (typeof damage.minDice === "undefined" || result.result < damage.minDice)) damage.minDice = result.result;
            });
        }
    });
    return damage;
}

function _rollPenetration(rollData) {
    let penetration = (rollData.penetrationFormula) ? rollData.penetrationFormula : "0";
    let r = new Roll(penetration, {});
    r.evaluate();
    return r.total;
}

function _rollRighteousFury() {
    let r = new Roll("1d5", {});
    r.evaluate();
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
    const locationTarget = parseFloat(result.toString().split('').reverse().join('')) * Math.sign(result);
    if (locationTarget <= 10) {
        return "ARMOUR.HEAD";
    } else if (locationTarget >= 11 && locationTarget <= 20) {
        return "ARMOUR.RIGHT_ARM";
    } else if (locationTarget >= 21 && locationTarget <= 30) {
        return "ARMOUR.LEFT_ARM";
    } else if (locationTarget >= 31 && locationTarget <= 70) {
        return "ARMOUR.BODY";
    } else if (locationTarget >= 71 && locationTarget <= 85) {
        return "ARMOUR.RIGHT_LEG";
    } else if (locationTarget >= 86 && locationTarget <= 100) {
        return "ARMOUR.LEFT_LEG";
    } else {
        return "ARMOUR.BODY";
    }
}

function _computeRateOfFire(rollData) {
    rollData.maxAdditionalHit = 0;
    if (rollData.attackType.name === "standard" || rollData.attackType.name === "bolt") {
        rollData.attackType.modifier = 10;
        rollData.attackType.hitMargin = 0;
    } else if (rollData.attackType.name === "swift" || rollData.attackType.name === "semi_auto" || rollData.attackType.name === "barrage") {
        rollData.attackType.modifier = 0;
        rollData.attackType.hitMargin = 2;
        rollData.maxAdditionalHit = rollData.rateOfFire.burst - 1;
    } else if (rollData.attackType.name === "lightning" || rollData.attackType.name === "full_auto" || rollData.attackType.name === "storm") {
        rollData.attackType.modifier = -10;
        rollData.attackType.hitMargin = 1;
        rollData.maxAdditionalHit = rollData.rateOfFire.full - 1;
    } else if (rollData.attackType.name === "called_shot") {
        rollData.attackType.modifier = -20;
        rollData.attackType.hitMargin = 0;
    } else {
        rollData.attackType.modifier = 0;
        rollData.attackType.hitMargin = 0;
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

async function _sendToChat(rollData) {
    const html = await renderTemplate("systems/dark-heresy/template/chat/roll.html", rollData);
    let chatData = {
        user: game.user._id,
        rollMode: game.settings.get("core", "rollMode"),
        content: html,
        type: CHAT_MESSAGE_TYPES.ROLL
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