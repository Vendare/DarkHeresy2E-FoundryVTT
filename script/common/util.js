export default class DarkHeresyUtil {

    static createCommonAttackRollData(actor, item) {
        return {
            name: item.name,
            attributeBoni: actor.attributeBoni,
            ownerId: actor.id,
            itemId: item.id,
            damageBonus: 0,
            damageType: item.damageType
        };
    }

    static createWeaponRollData(actor, weapon) {
        let characteristic = this.getWeaponCharacteristic(actor, weapon);
        let rateOfFire;
        if (weapon.class === "melee") {
            rateOfFire = {burst: characteristic.bonus, full: characteristic.bonus};
        } else {
            rateOfFire = {burst: weapon.rateOfFire.burst, full: weapon.rateOfFire.full};
        }
        let isMelee = weapon.class === "melee";

        let rollData = this.createCommonAttackRollData(actor, weapon);
        rollData.baseTarget= characteristic.total + weapon.attack;
        rollData.modifier= 0;
        rollData.isMelee= isMelee;
        rollData.isRange= !isMelee;
        rollData.clip= weapon.clip;
        rollData.range = weapon.range;
        rollData.rateOfFire= rateOfFire;
        rollData.weaponTraits= this.extractWeaponTraits(weapon.special);
        let attributeMod = (isMelee && !weapon.damage.match(/SB/gi) ? "+SB" : "");
        rollData.damageFormula= weapon.damage + attributeMod + (rollData.weaponTraits.force ? "+PR": "");
        rollData.penetrationFormula = weapon.penetration + (rollData.weaponTraits.force ? "+PR" : "");
        rollData.special= weapon.special;
        rollData.psy= { value: actor.psy.rating, display: false};
        rollData.attackType =  { name: "standard", text: "" };
        return rollData;
    }

    static createPsychicRollData(actor, power) {
        let focusPowerTarget = this.getFocusPowerTarget(actor, power);

        let rollData = this.createCommonAttackRollData(actor, power);
        rollData.baseTarget= focusPowerTarget.total;
        rollData.modifier= power.focusPower.difficulty;
        rollData.damageFormula= power.damage.formula;
        rollData.penetrationFormula= power.damage.penetration;
        rollData.attackType= { name: power.damage.zone, text: "" };
        rollData.weaponTraits= this.extractWeaponTraits(power.damage.special);
        rollData.special= power.damage.special;
        rollData.psy = {
            value: actor.psy.rating,
            rating: actor.psy.rating,
            max: this.getMaxPsyRating(actor),
            warpConduit: false,
            display: true
        };
        return rollData;
    }
    
    static createSkillRollData(actor, skillName) {
        const skill = actor.skills[skillName];
        const defaultChar = skill.defaultCharacteristic || skill.characteristics[0];

        let characteristics = getCharacteristicOptions(actor, defaultChar);
        characteristics = characteristics.map(char => {
            char.target += skill.advance;
            return char;
        });

        return {
            name: skill.label,
            baseTarget: skill.total,
            modifier: 0,
            characteristics: characteristics,
            ownerId: actor.id
        };
    }
    
    static createSpecialtyRollData(actor, skillName, specialityName) {
        const skill = actor.skills[skillName];
        const speciality = skill.specialities[specialityName];
        return {
            name: speciality.label,
            baseTarget: speciality.total,
            modifier: 0,
            ownerId: actor.id
        };
    }
    
    static createCharacteristicRollData(actor, characteristicName) {
        const characteristic = actor.characteristics[characteristicName];
        return {
            name: characteristic.label,
            baseTarget: characteristic.total,
            modifier: 0,
            ownerId: actor.id
        };
    }
    
    static createFearTestRolldata(actor) {  
        const characteristic = actor.characteristics.willpower;
        return {
            name: "FEAR.HEADER",
            baseTarget: characteristic.total,
            modifier: 0,
            ownerId: actor.id
        };
    }
    
    static createMalignancyTestRolldata(actor) {  
        const characteristic = actor.characteristics.willpower;
        return {
            name: "CORRUPTION.HEADER",
            baseTarget: characteristic.total,
            modifier: getMalignancyModifier(actor.corruption),
            ownerId: actor.id
        };
    }
    
    static createTraumaTestRolldata(actor) {  
        const characteristic = actor.characteristics.willpower;
        return {
            name: "TRAUMA.HEADER",
            baseTarget: characteristic.total,
            modifier: getTraumaModifier(actor.insanity),
            ownerId: actor.id
        };
    }
    
    

    static extractWeaponTraits(traits) {
    // These weapon traits never go above 9 or below 2
        return {
            accurate: this.hasNamedTrait(/(?<!in)Accurate/gi, traits),
            rfFace: this.extractNumberedTrait(/Vengeful.*\(\d\)/gi, traits), // The alternativ die face Righteous Fury is triggered on
            proven: this.extractNumberedTrait(/Proven.*\(\d\)/gi, traits),
            primitive: this.extractNumberedTrait(/Primitive.*\(\d\)/gi, traits),
            razorSharp: this.hasNamedTrait(/Razor.?-? *Sharp/gi, traits),
            spray: this.hasNamedTrait(/Spray/gi, traits),
            skipAttackRoll: this.hasNamedTrait(/Spray/gi, traits), // Currently, spray will always be the same as skipAttackRoll. However, in the future, there may be other skipAttackRoll weapons that are not Spray.
            tearing: this.hasNamedTrait(/Tearing/gi, traits),
            storm: this.hasNamedTrait(/Storm/gi, traits),
            twinLinked: this.hasNamedTrait(/Twin.?-? *Linked/gi, traits),
            force: this.hasNamedTrait(/Force/gi, traits),
            inaccurate: this.hasNamedTrait(/Inaccurate/gi, traits)
        };
    }

    static getMaxPsyRating(actor) {
        let base = actor.psy.rating;
        switch (actor.psy.class) {
            case "bound":
                return base + 2;
            case "unbound":
                return base + 4;
            case "daemonic":
                return base + 3;
        }
    }

    static extractNumberedTrait(regex, traits) {
        let rfMatch = traits.match(regex);
        if (rfMatch) {
            regex = /\d+/gi;
            return parseInt(rfMatch[0].match(regex)[0]);
        }
        return undefined;
    }

    static hasNamedTrait(regex, traits) {
        let rfMatch = traits.match(regex);
        if (rfMatch) {
            return true;
        } else {
            return false;
        }
    }

    static getWeaponCharacteristic(actor, weapon) {
        if (weapon.class === "melee") {
            return actor.characteristics.weaponSkill;
        } else {
            return actor.characteristics.ballisticSkill;
        }
    }

    static getFocusPowerTarget(actor, psychicPower) {
        const normalizeName = psychicPower.focusPower.test.toLowerCase();
        if (actor.characteristics.hasOwnProperty(normalizeName)) {
            return actor.characteristics[normalizeName];
        } else if (actor.skills.hasOwnProperty(normalizeName)) {
            return actor.skills[normalizeName];
        } else {
            return actor.characteristics.willpower;
        }
    }
    
    static getCharacteristicOptions(actor, selected) {
        const characteristics = [];
        for (let char of Object.values(actor.characteristics)) {
            characteristics.push({
                label: char.label,
                target: char.total,
                selected: char.short === selected
            });
        }
        return characteristics;
    }
    
    static getMalignancyModifier(corruption) {
        if (corruption <= 30) {
            return 0;
        } else if (corruption <= 60) {
            return -10;
        } else if (corruption <= 90) {
            return -20;
        } else {
            return -30;
        }
    }
    
    static getTraumaModifier(insanity) {
        if(insanity < 10) {
            return 0;
        } else if(insanity < 40) {
            return 10;
        } else if(insanity < 60) {
            return 0;
        } else if(insanity < 80) {
            return -10;
        } else {
            return -20;
        }
    }
}