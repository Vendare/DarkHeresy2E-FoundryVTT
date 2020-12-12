export class DarkHeresyActor extends Actor {
    prepareData() {
        super.prepareData();
        this._computeCharacteristics(this.data);
        this._computeSkills(this.data);
        this._computeItems(this.data);
        this._computeExperience(this.data);
        this._computeArmour(this.data);
        this._computeMovement(this.data);
    }

    _computeCharacteristics(data) {
        let middle = Object.values(data.data.characteristics).length / 2;
        let i = 0;
        for (let characteristic of Object.values(data.data.characteristics)) {
            characteristic.total = characteristic.base + characteristic.advance;
            characteristic.bonus = Math.floor(characteristic.total / 10) + characteristic.unnatural;
            characteristic.isLeft = i < middle;
            characteristic.isRight = i >= middle;
            i++;
        }
        data.data.insanityBonus = Math.floor(data.data.insanity / 10);
        data.data.corruptionBonus = Math.floor(data.data.corruption / 10);
        data.data.psy.currentRating = data.data.psy.rating - data.data.psy.sustained;
        data.data.initiative.bonus = data.data.characteristics[data.data.initiative.characteristic].bonus;
    }

    _computeSkills(data) {
        for (let skill of Object.values(data.data.skills)) {
            let short = skill.characteristics[0];
            let characteristic = this._findCharacteristic(data, short)
            skill.total = characteristic.total + skill.advance;
            if (skill.isSpecialist) {
                for (let speciality of Object.values(skill.specialities)) {
                    speciality.total =  characteristic.total + speciality.advance;
                    speciality.isKnown = speciality.advance >= 0;
                }
            }
        }
    }

    _computeItems(data) {
        let encumbrance = 0;
        for (let item of Object.values(data.items)) {
            item.isMentalDisorder = item.type === "mentalDisorder";
            item.isMalignancy = item.type === "malignancy";
            item.isMutation = item.type === "mutation";
            item.isTalent = item.type === "talent";
            item.isTrait = item.type === "trait";
            item.isSpecialAbility = item.type === "specialAbility";
            item.isPsychicPower = item.type === "psychicPower";
            item.isCriticalInjury = item.type === "criticalInjury";
            item.isWeapon = item.type === "weapon";
            item.isArmour = item.type === "armour";
            item.isGear = item.type === "gear";
            item.isDrug = item.type === "drug";
            item.isTool = item.type === "tool";
            item.isCybernetic = item.type === "cybernetic";
            item.isWeaponModification = item.type === "weaponModification";
            item.isAmmunition = item.type === "ammunition";
            item.isForceField = item.type === "forceField";
            item.isAbilities = item.isTalent || item.isTrait || item.isSpecialAbility;
            if (item.data.hasOwnProperty('weight')) {
                encumbrance = encumbrance + item.data.weight;
            }
        }
        this._computeEncumbrance(data, encumbrance);
    }

    _computeExperience(data) {
        data.data.experience.spentCharacteristics = 0;
        data.data.experience.spentSkills = 0;
        data.data.experience.spentTalents = 0;
        data.data.experience.spentPsychicPowers = data.data.psy.cost;
        for (let characteristic of Object.values(data.data.characteristics)) {
            data.data.experience.spentCharacteristics += parseInt(characteristic.cost, 10);
        }
        for (let skill of Object.values(data.data.skills)) {
            if (skill.isSpecialist) {
                for (let speciality of Object.values(skill.specialities)) {
                    data.data.experience.spentSkills += parseInt(speciality.cost, 10);
                }
            } else {
                data.data.experience.spentSkills += parseInt(skill.cost, 10);
            }
        }
        for (let item of Object.values(data.items)) {
            if (item.isTalent) {
                data.data.experience.spentTalents += parseInt(item.data.cost, 10);
            } else if (item.isPsychicPower) {
                data.data.experience.spentPsychicPowers += parseInt(item.data.cost, 10);
            }
        }
        data.data.experience.totalSpent = data.data.experience.spentCharacteristics + data.data.experience.spentSkills + data.data.experience.spentTalents + data.data.experience.spentPsychicPowers;
        data.data.experience.total = data.data.experience.value + data.data.experience.totalSpent;
    }

    _computeArmour(data) {
        let toughness = data.data.characteristics.toughness;
        data.data.armour = {
            head: {
                total: toughness.bonus,
                toughnessBonus: toughness.bonus,
                value: 0
            },
            leftArm: {
                total: toughness.bonus,
                toughnessBonus: toughness.bonus,
                value: 0
            },
            rightArm: {
                total: toughness.bonus,
                toughnessBonus: toughness.bonus,
                value: 0
            },
            body: {
                total: toughness.bonus,
                toughnessBonus: toughness.bonus,
                value: 0
            },
            leftLeg: {
                total: toughness.bonus,
                toughnessBonus: toughness.bonus,
                value: 0
            },
            rightLeg: {
                total: toughness.bonus,
                toughnessBonus: toughness.bonus,
                value: 0
            }
        }
        for (let item of Object.values(data.items)) {
            if (item.isArmour) {
                data.data.armour.head.value += item.data.part.head;
                data.data.armour.leftArm.value += item.data.part.leftArm;
                data.data.armour.rightArm.value += item.data.part.rightArm;
                data.data.armour.body.value += item.data.part.body;
                data.data.armour.leftLeg.value += item.data.part.leftLeg;
                data.data.armour.rightLeg.value += item.data.part.rightLeg;
            }
        }
        data.data.armour.head.total += data.data.armour.head.value;
        data.data.armour.leftArm.total += data.data.armour.leftArm.value;
        data.data.armour.rightArm.total += data.data.armour.rightArm.value;
        data.data.armour.body.total += data.data.armour.body.value;
        data.data.armour.leftLeg.total += data.data.armour.leftLeg.value;
        data.data.armour.rightLeg.total += data.data.armour.rightLeg.value;
    }

    _computeMovement(data) {
        let agility = data.data.characteristics.agility;
        data.data.movement = {
            half: agility.bonus,
            full: agility.bonus * 2,
            charge: agility.bonus * 3,
            run: agility.bonus * 6
        }
    }

    _findCharacteristic(data, short) {
        for (let characteristic of Object.values(data.data.characteristics)) {
            if (characteristic.short === short) {
                return characteristic;
            }
        }
        return {total: 0};
    }

    _computeEncumbrance(data, encumbrance) {
        const attributeBonus = data.data.characteristics.strength.bonus + data.data.characteristics.toughness.bonus;
        data.data.encumbrance = {
            max: 0,
            value: encumbrance
        };
        switch (attributeBonus) {
            case 0:
                data.data.encumbrance.max = 0.9;
                break
            case 1:
                data.data.encumbrance.max = 2.25;
                break
            case 2:
                data.data.encumbrance.max = 4.5;
                break
            case 3:
                data.data.encumbrance.max = 9;
                break
            case 4:
                data.data.encumbrance.max = 18;
                break
            case 5:
                data.data.encumbrance.max = 27;
                break
            case 6:
                data.data.encumbrance.max = 36;
                break
            case 7:
                data.data.encumbrance.max = 45;
                break
            case 8:
                data.data.encumbrance.max = 56;
                break
            case 9:
                data.data.encumbrance.max = 67;
                break
            case 10:
                data.data.encumbrance.max = 78;
                break
            case 11:
                data.data.encumbrance.max = 90;
                break
            case 12:
                data.data.encumbrance.max = 112;
                break
            case 13:
                data.data.encumbrance.max = 225;
                break
            case 14:
                data.data.encumbrance.max = 337;
                break
            case 15:
                data.data.encumbrance.max = 450;
                break
            case 16:
                data.data.encumbrance.max = 675;
                break
            case 17:
                data.data.encumbrance.max = 900;
                break
            case 18:
                data.data.encumbrance.max = 1350;
                break
            case 19:
                data.data.encumbrance.max = 1800;
                break
            case 20:
                data.data.encumbrance.max = 2250;
                break
            default:
                data.data.encumbrance.max = 2250;
                break
        }
    }
}