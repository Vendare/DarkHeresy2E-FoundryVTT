export class DarkHeresyActor extends Actor {

    async _preCreate(data, options, user) {
        mergeObject(data, {
            "token.bar1": { "attribute": "wounds" },
            "token.bar2": { "attribute": "fatigue" },
            "token.displayName": game.settings.get('dark-heresy', 'defaultTokenDisplay'),
            "token.displayBars": CONST.TOKEN_DISPLAY_MODES.ALWAYS,
            "token.disposition": CONST.TOKEN_DISPOSITIONS.NEUTRAL,
            "token.name": data.name
        });
        if (data.type === "acolyte") {
            data.token.vision = true;
            data.token.actorLink = true;
        }
    }

    prepareData() {
        super.prepareData();
        this._computeCharacteristics();
        this._computeSkills();
        this._computeItems();
        this._computeExperience();
        this._computeArmour();
        this._computeMovement();
    }

    _computeCharacteristics() {
        let data = this.data
        let middle = Object.values(data.data.characteristics).length / 2;
        let i = 0;
        for (let characteristic of Object.values(data.data.characteristics)) {
            characteristic.total = characteristic.base + characteristic.advance;
            characteristic.bonus = Math.floor(characteristic.total / 10) + characteristic.unnatural;
            characteristic.isLeft = i < middle;
            characteristic.isRight = i >= middle;
            characteristic.advanceCharacteristic = this._getAdvanceCharacteristic(characteristic.advance)
            i++;
        }
        data.data.insanityBonus = Math.floor(data.data.insanity / 10);
        data.data.corruptionBonus = Math.floor(data.data.corruption / 10);
        data.data.psy.currentRating = data.data.psy.rating - data.data.psy.sustained;
        data.data.initiative.bonus = data.data.characteristics[data.data.initiative.characteristic].bonus;
    }

    _computeSkills() {
        let data = this.data
        for (let skill of Object.values(data.data.skills)) {
            let short = skill.characteristics[0];
            let characteristic = this._findCharacteristic(data, short)
            skill.total = characteristic.total + skill.advance;
            skill.advanceSkill = this._getAdvanceCharacteristic(skill.advance)
            if (skill.isSpecialist) {
                for (let speciality of Object.values(skill.specialities)) {
                    speciality.total = characteristic.total + speciality.advance;
                    speciality.isKnown = speciality.advance >= 0;
                    skill.advanceSpec = this._getAdvanceCharacteristic(speciality.advance)
                }
            }

        }
    }

    _computeItems() {
        let data = this.data
        let encumbrance = 0;
        for (let item of this.items) {

            if (item.data.data.hasOwnProperty('weight')) {
                encumbrance = encumbrance + item.data.data.weight;
            }
        }
        this._computeEncumbrance(encumbrance);
    }

    _computeExperience() {
        let data = this.data
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
        for (let item of this.items) {
            if (item.isTalent) {
                data.data.experience.spentTalents += parseInt(item.data.data.cost, 10);
            } else if (item.isPsychicPower) {
                data.data.experience.spentPsychicPowers += parseInt(item.data.data.cost, 10);
            }
        }
        data.data.experience.totalSpent = data.data.experience.spentCharacteristics + data.data.experience.spentSkills + data.data.experience.spentTalents + data.data.experience.spentPsychicPowers;
        data.data.experience.total = data.data.experience.value + data.data.experience.totalSpent;
    }

    _computeArmour() {
        let data = this.data
        let locations = game.system.template.Item.armour.part;

        let toughness = data.data.characteristics.toughness;

        data.data.armour =
            Object.keys(locations)
                .reduce((accumulator, location) =>
                    Object.assign(accumulator,
                        {
                            [location]: {
                                total: toughness.bonus,
                                toughnessBonus: toughness.bonus,
                                value: 0
                            }
                        }), {});

        // object for storing the max armour
        let maxArmour = Object.keys(locations)
            .reduce((acc, location) =>
                Object.assign(acc, { [location]: 0 }), {})

        // for each item, find the maximum armour val per location
        data.items
            .filter(item => item.type === "armour")
            .reduce((acc, armour) => {
                Object.keys(locations)
                    .forEach((location) => {
                        let armourVal = armour.data.part[location] || 0;
                        if (armourVal > acc[location]) {
                            acc[location] = armourVal;
                        }
                    }
                    )
                return acc;
            }, maxArmour);

        data.data.armour.head.value = maxArmour["head"];
        data.data.armour.leftArm.value = maxArmour["leftArm"];
        data.data.armour.rightArm.value = maxArmour["rightArm"];
        data.data.armour.body.value = maxArmour["body"];
        data.data.armour.leftLeg.value = maxArmour["leftLeg"];
        data.data.armour.rightLeg.value = maxArmour["rightLeg"];

        data.data.armour.head.total += data.data.armour.head.value;
        data.data.armour.leftArm.total += data.data.armour.leftArm.value;
        data.data.armour.rightArm.total += data.data.armour.rightArm.value;
        data.data.armour.body.total += data.data.armour.body.value;
        data.data.armour.leftLeg.total += data.data.armour.leftLeg.value;
        data.data.armour.rightLeg.total += data.data.armour.rightLeg.value;
    }

    _computeMovement() {
        let data = this.data
        let agility = data.data.characteristics.agility;
        let size = data.data.size;
        data.data.movement = {
            half: agility.bonus + (size - 4),
            full: (agility.bonus * 2) + (size - 4),
            charge: (agility.bonus * 3) + (size - 4),
            run: (agility.bonus * 6) + (size - 4)
        }
    }

    _findCharacteristic(short) {
        let data = this.data
        for (let characteristic of Object.values(data.data.characteristics)) {
            if (characteristic.short === short) {
                return characteristic;
            }
        }
        return { total: 0 };
    }

    _computeEncumbrance(encumbrance) {
        let data = this.data
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


    _getAdvanceCharacteristic(characteristic)
    {
        switch (characteristic || 0) {
          case 0:
            return "N";
          case 5:
            return "S";
          case 10:
            return "I";
          case 15:
            return "T";
          case 20:
            return "P";
          case 25:
            return "E";
          default:
            return "N";
        }
    }
    
    _getAdvanceSkill(skill)
    {
        switch (skill || 0) {
            case -20:
              return "U";
            case 0:
              return "K";
            case 10:
              return "T";
            case 20:
              return "E";
            case 30:
              return "V";
            default:
              return "U";
          }
    }

    /**
     * Apply wounds to the actor, takes into account the armour value
     * and the area of the hit.
     * @param {Object[]} damages            Array of damage objects to apply to the Actor
     * @param {number} damages.amount       An amount of damage to sustain
     * @param {string} damages.location     Localised location of the body part taking damage
     * @param {number} damages.penetration  Amount of penetration from the attack
     * @param {string} damages.type         Type of damage
     * @param {number} damages.righteousFury Amount rolled on the righteous fury die, defaults to 0
     * @return {Promise<Actor>}             A Promise which resolves once the damage has been applied
     */
    async applyDamage(damages) {
        let wounds = this.data.data.wounds.value;
        let criticalWounds = this.data.data.wounds.critical;
        const dmgRolls = []
        const maxWounds = this.data.data.wounds.max;

        // apply damage from multiple hits
        for (const damage of damages) {
            // get the armour for the location and minus penetration
            let armour = this._getArmour(damage.location) - Number(damage.penetration)

            // calculate wounds to add
            let woundsToAdd = Math.max(Number(damage.amount) - armour, 0)

            // If no wounds inflicted and righteous fury was rolled, attack causes one wound
            if (damage.righteousFury && woundsToAdd === 0) {
                woundsToAdd = 1
            } else if (damage.righteousFury) {
                // roll on crit table but don't add critical wounds
                dmgRolls.push({
                    appliedDmg: damage.righteousFury,
                    type: damage.type,
                    source: 'Critical Effect (RF)'
                })
            }

            // check for critical wounds
            if (wounds === maxWounds) {
                // all new wounds are critical
                criticalWounds += woundsToAdd;
                dmgRolls.push({
                    appliedDmg: woundsToAdd,
                    type: damage.type,
                    source: 'Critical Damage'
                })
            } else if (wounds + woundsToAdd > maxWounds) {
                // will bring wounds to max and add left overs as crits
                dmgRolls.push({
                    appliedDmg: maxWounds - wounds,
                    type: damage.type,
                    source: 'Wounds'
                })
                woundsToAdd = (wounds + woundsToAdd) - maxWounds;
                criticalWounds += woundsToAdd;
                wounds = maxWounds;
                dmgRolls.push({
                    appliedDmg: woundsToAdd,
                    type: damage.type,
                    source: 'Critical'
                });
            } else {
                dmgRolls.push({
                    appliedDmg: woundsToAdd,
                    type: damage.type,
                    source: 'Wounds'
                })
                wounds += woundsToAdd
            }
        }

        // Update the Actor
        const updates = {
            "data.wounds.value": wounds,
            "data.wounds.critical": criticalWounds
        };

        // Delegate damage application to a hook
        const allowed = Hooks.call("modifyTokenAttribute", {
            attribute: "wounds.value",
            value: this.data.data.wounds.value,
            isDelta: false,
            isBar: true
        }, updates);

        await this._showCritMessage(dmgRolls, this.name, wounds, criticalWounds)
        return allowed !== false ? this.update(updates) : this;
    }

    /**
     * Gets the armour value for a non-localized location string
     * @param {string} location
     * @returns {number} armour value for the location
     */
    _getArmour(location) {
        switch (location) {
            case "ARMOUR.HEAD":
                return this.data.data.armour.head.total;
            case "ARMOUR.LEFT_ARM":
                return this.data.data.armour.leftArm.total;
            case "ARMOUR.RIGHT_ARM":
                return this.data.data.armour.rightArm.total;
            case "ARMOUR.BODY":
                return this.data.data.armour.body.total;
            case "ARMOUR.LEFT_LEG":
                return this.data.data.armour.leftLeg.total;
            case "ARMOUR.RIGHT_LEG":
                return this.data.data.armour.rightLeg.total;
            default:
                return 0;
        }
    }

    /**
     * Helper to show that an effect from the critical table needs to be applied.
     * TODO: This needs styling, rewording and ideally would roll on the crit tables for you
     * @param {Object[]} rolls Array of critical rolls
     * @param {number} rolls.appliedDmg Number rolled on the crit table
     * @param {string} rolls.type Letter representing the damage type
     * @param {string} rolls.source What kind of damage represented
     * @param {string} rolls.location Where this damage applied against for armor and AP considerations
     */
    async _showCritMessage(rolls, target, totalWounds, totalCritWounds) {
        if (rolls.length === 0) return;
        const html = await renderTemplate("systems/dark-heresy/template/chat/critical.html", {
            rolls: rolls,
            target: target,
            totalWounds: totalWounds,
            totalCritWounds: totalCritWounds
        })
        ChatMessage.create({ content: html });
    }

}