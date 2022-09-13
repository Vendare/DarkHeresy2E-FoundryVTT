export class DarkHeresyActor extends Actor {

    async _preCreate(data, options, user) {
        let initData = {
            "token.bar1": { "attribute": "combat.wounds" },
            "token.bar2": { "attribute": "combat.shock" },
            "token.displayName": CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
            "token.displayBars": CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
            "token.disposition": CONST.TOKEN_DISPOSITIONS.NEUTRAL,
            "token.name": data.name
          }
          if (data.type === "agent") {
            initData["token.vision"] =  true;
            initData["token.actorLink"] = true;
          }
          this.data.update(initData)
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
        let middle = Object.values(this.characteristics).length / 2;
        let i = 0;
        for (let characteristic of Object.values(this.characteristics)) {
            characteristic.total = characteristic.base + characteristic.advance;
            characteristic.bonus = Math.floor(characteristic.total / 10) + characteristic.unnatural;
            if(this.fatigue.value > characteristic.bonus) {
                characteristic.total = Math.ceil(characteristic.total / 2);
                characteristic.bonus = Math.floor(characteristic.total / 10) + characteristic.unnatural;
            }
            characteristic.isLeft = i < middle;
            characteristic.isRight = i >= middle;
            characteristic.advanceCharacteristic = this._getAdvanceCharacteristic(characteristic.advance)
            i++;
        }
        this.system.insanityBonus = Math.floor(this.insanity / 10);
        this.system.corruptionBonus = Math.floor(this.corruption / 10);
        this.psy.currentRating = this.psy.rating - this.psy.sustained;
        this.initiative.bonus = this.characteristics[this.initiative.characteristic].bonus;
        // done as variables to make it easier to read & understand
        let tb = Math.floor(
            ( this.characteristics.toughness.base
            + this.characteristics.toughness.advance) / 10);

        let wb = Math.floor(
            ( this.characteristics.willpower.base
            + this.characteristics.willpower.advance) / 10);

        //the only thing not affected by itself
        this.fatigue.max = tb + wb;

    }

    _computeSkills() {
        for (let skill of Object.values(this.skills)) {
            let short = skill.characteristics[0];
            let characteristic = this._findCharacteristic(short)
            skill.total = characteristic.total + skill.advance;
            skill.advanceSkill = this._getAdvanceSkill(skill.advance)
            if (skill.isSpecialist) {
                for (let speciality of Object.values(skill.specialities)) {
                    speciality.total = characteristic.total + speciality.advance;
                    speciality.isKnown = speciality.advance >= 0;
                    skill.advanceSpec = this._getAdvanceSkill(speciality.advance)
                }
            }
        }
    }

    _computeItems() {
        let encumbrance = 0;
        for (let item of this.items) {

            if (item.weight) {
                encumbrance = encumbrance + item.weight;
            }
        }
        this._computeEncumbrance(encumbrance);
    }

    _computeExperience() {
        this.experience.spentCharacteristics = 0;
        this.experience.spentSkills = 0;
        this.experience.spentTalents = 0;
        this.experience.spentPsychicPowers = this.psy.cost;
        for (let characteristic of Object.values(this.characteristics)) {
            this.experience.spentCharacteristics += parseInt(characteristic.cost, 10);
        }
        for (let skill of Object.values(this.skills)) {
            if (skill.isSpecialist) {
                for (let speciality of Object.values(skill.specialities)) {
                    this.experience.spentSkills += parseInt(speciality.cost, 10);
                }
            } else {
                this.experience.spentSkills += parseInt(skill.cost, 10);
            }
        }
        for (let item of this.items) {
            if (item.isTalent) {
                this.experience.spentTalents += parseInt(item.cost, 10);
            } else if (item.isPsychicPower) {
                this.experience.spentPsychicPowers += parseInt(item.cost, 10);
            }
        }
        this.experience.totalSpent = this.experience.spentCharacteristics + this.experience.spentSkills + this.experience.spentTalents + this.experience.spentPsychicPowers;
        this.experience.remaining = this.experience.value - this.experience.totalSpent;
    }

    _computeArmour() {
        let locations = game.system.template.Item.armour.part;

        let toughness = this.characteristics.toughness;

        this.system.armour =
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
        this.items
            .filter(item => item.type === "armour")
            .reduce((acc, armour) => {
                Object.keys(locations)
                    .forEach((location) => {
                        let armourVal = armour.part[location] || 0;
                        if (armourVal > acc[location]) {
                            acc[location] = armourVal;
                        }
                    }
                    )
                return acc;
            }, maxArmour);

        this.armour.head.value = maxArmour["head"];
        this.armour.leftArm.value = maxArmour["leftArm"];
        this.armour.rightArm.value = maxArmour["rightArm"];
        this.armour.body.value = maxArmour["body"];
        this.armour.leftLeg.value = maxArmour["leftLeg"];
        this.armour.rightLeg.value = maxArmour["rightLeg"];

        this.armour.head.total += this.armour.head.value;
        this.armour.leftArm.total += this.armour.leftArm.value;
        this.armour.rightArm.total += this.armour.rightArm.value;
        this.armour.body.total += this.armour.body.value;
        this.armour.leftLeg.total += this.armour.leftLeg.value;
        this.armour.rightLeg.total += this.armour.rightLeg.value;
    }

    _computeMovement() {
        let agility = this.characteristics.agility;
        let size = this.size;
        this.system.movement = {
            half: agility.bonus + size - 4,
            full: (agility.bonus + size - 4) * 2,
            charge: (agility.bonus  + size - 4) * 3,
            run: (agility.bonus + size - 4) * 6
        }
    }

    _findCharacteristic(short) {
        for (let characteristic of Object.values(this.characteristics)) {
            if (characteristic.short === short) {
                return characteristic;
            }
        }
        return { total: 0 };
    }

    _computeEncumbrance(encumbrance) {
        const attributeBonus = this.characteristics.strength.bonus + this.characteristics.toughness.bonus;
        this.system.encumbrance = {
            max: 0,
            value: encumbrance
        };
        switch (attributeBonus) {
            case 0:
                this.encumbrance.max = 0.9;
                break
            case 1:
                this.encumbrance.max = 2.25;
                break
            case 2:
                this.encumbrance.max = 4.5;
                break
            case 3:
                this.encumbrance.max = 9;
                break
            case 4:
                this.encumbrance.max = 18;
                break
            case 5:
                this.encumbrance.max = 27;
                break
            case 6:
                this.encumbrance.max = 36;
                break
            case 7:
                this.encumbrance.max = 45;
                break
            case 8:
                this.encumbrance.max = 56;
                break
            case 9:
                this.encumbrance.max = 67;
                break
            case 10:
                this.encumbrance.max = 78;
                break
            case 11:
                this.encumbrance.max = 90;
                break
            case 12:
                this.encumbrance.max = 112;
                break
            case 13:
                this.encumbrance.max = 225;
                break
            case 14:
                this.encumbrance.max = 337;
                break
            case 15:
                this.encumbrance.max = 450;
                break
            case 16:
                this.encumbrance.max = 675;
                break
            case 17:
                this.encumbrance.max = 900;
                break
            case 18:
                this.encumbrance.max = 1350;
                break
            case 19:
                this.encumbrance.max = 1800;
                break
            case 20:
                this.encumbrance.max = 2250;
                break
            default:
                this.encumbrance.max = 2250;
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
        let wounds = this.wounds.value;
        let criticalWounds = this.wounds.critical;
        const damageTaken = []
        const maxWounds = this.wounds.max;

        // apply damage from multiple hits
        for (const damage of damages) {
            // get the armour for the location and minus penetration, no negatives
            let armour = Math.max(this._getArmour(damage.location) - Number(damage.penetration), 0)
            // reduce damage by toughness bonus
            const damageMinusToughness = Math.max(Number(damage.amount) - this.system.characteristics.toughness.bonus, 0)

            // calculate wounds to add, reducing damage by armour after pen
            let woundsToAdd = Math.max(damageMinusToughness - armour, 0)

            // If no wounds inflicted and righteous fury was rolled, attack causes one wound
            if (damage.righteousFury && woundsToAdd === 0) {
                woundsToAdd = 1
            } else if (damage.righteousFury) {
                // roll on crit table but don't add critical wounds
                this._recordDamage(damageTaken, damage.righteousFury, damage, 'Critical Effect (RF)')
            }

            // check for critical wounds
            if (wounds === maxWounds) {
                // all new wounds are critical
                criticalWounds += woundsToAdd;
                this._recordDamage(damageTaken, woundsToAdd, damage, 'Critical')

            } else if (wounds + woundsToAdd > maxWounds) {
                // will bring wounds to max and add left overs as crits
                this._recordDamage(damageTaken, maxWounds - wounds, damage, 'Wounds')

                woundsToAdd = (wounds + woundsToAdd) - maxWounds;
                criticalWounds += woundsToAdd;
                wounds = maxWounds;
                this._recordDamage(damageTaken, woundsToAdd, damage, 'Critical')
            } else {
                this._recordDamage(damageTaken, woundsToAdd, damage, 'Wounds');
                wounds += woundsToAdd;
            }
        }

        // Update the Actor
        const updates = {
            "system.wounds.value": wounds,
            "system.wounds.critical": criticalWounds
        };

        // Delegate damage application to a hook
        const allowed = Hooks.call("modifyTokenAttribute", {
            attribute: "wounds.value",
            value: this.wounds.value,
            isDelta: false,
            isBar: true
        }, updates);

        await this._showCritMessage(damageTaken, this.name, wounds, criticalWounds);
        return allowed !== false ? this.update(updates) : this;
    }

    /**
     * Records damage to be shown as in chat
     * @param {Object[]} damageRolls array to record damages
     * @param {number} damageRolls.damage amount of damage dealt
     * @param {string} damageRolls.source source of the damage e.g. Critical
     * @param {string} damageRolls.location location taking the damage
     * @param {string} damageRolls.type type of the damage
     * @param {number} damage amount of damage dealt
     * @param {Object} damageObject damage object containing location and type
     * @param {string} damageObject.location damage location
     * @param {string} damageObject.type damage type
     * @param {string} source source of the damage
     */
    _recordDamage(damageRolls, damage, damageObject, source) {
        damageRolls.push({
            damage,
            source,
            location: damageObject.location,
            type: damageObject.type
        })
    }

    /**
     * Gets the armour value not including toughness bonus for a non-localized location string
     * @param {string} location
     * @returns {number} armour value for the location
     */
    _getArmour(location) {
        switch (location) {
            case "ARMOUR.HEAD":
                return this.armour.head.value;
            case "ARMOUR.LEFT_ARM":
                return this.armour.leftArm.value;
            case "ARMOUR.RIGHT_ARM":
                return this.armour.rightArm.value;
            case "ARMOUR.BODY":
                return this.armour.body.value;
            case "ARMOUR.LEFT_LEG":
                return this.armour.leftLeg.value;
            case "ARMOUR.RIGHT_LEG":
                return this.armour.rightLeg.value;
            default:
                return 0;
        }
    }

    /**
     * Helper to show that an effect from the critical table needs to be applied.
     * TODO: This needs styling, rewording and ideally would roll on the crit tables for you
     * @param {Object[]} rolls Array of critical rolls
     * @param {number} rolls.damage Damage applied
     * @param {string} rolls.type Letter representing the damage type
     * @param {string} rolls.source What kind of damage represented
     * @param {string} rolls.location Where this damage applied against for armor and AP considerations
     */
    async _showCritMessage(rolls, target, totalWounds, totalCritWounds) {
        if (rolls.length === 0) return;
        const html = await renderTemplate("systems/dark-heresy/template/chat/critical.html", {
            rolls,
            target,
            totalWounds,
            totalCritWounds
        })
        ChatMessage.create({ content: html });
    }

    get characteristics() {return this.system.characteristics}
    get skills() {return this.system.skills}
    get initiative() {return this.system.initiative}
    get wounds() {return this.system.wounds}
    get fatigue() {return this.system.fatigue}
    get fate() {return this.system.fate}
    get psy() {return this.system.psy}
    get bio() {return this.system.bio}
    get experience() {return this.system.experience}
    get insanity() {return this.system.insanity}
    get corruption() {return this.system.corruption}
    get aptitudes() {return this.system.aptitudes}
    get size() {return this.system.size}
    get faction() {return this.system.faction}
    get subfaction() {return this.system.subfaction}
    get subtype() {return this.system.type}
    get threatLevel() {return this.system.threatLevel}
    get armour() {return this.system.armour}
    get encumbrance() {return this.system.encumbrance}
    get movement() {return this.system.movement}

}