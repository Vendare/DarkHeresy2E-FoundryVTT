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
            characteristic.isLeft = i < middle;
            characteristic.isRight = i >= middle;
            characteristic.advanceCharacteristic = this._getAdvanceCharacteristic(characteristic.advance)
            i++;
        }
        this.insanityBonus = Math.floor(this.insanity / 10);
        this.corruptionBonus = Math.floor(this.corruption / 10);
        this.psy.currentRating = this.psy.rating - this.psy.sustained;
        this.initiative.bonus = this.characteristics[this.initiative.characteristic].bonus;
    }

    _computeSkills() {
        for (let skill of Object.values(this.skills)) {
            let short = skill.characteristics[0];
            let characteristic = this._findCharacteristic(short)
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
        this.experience.total = this.experience.value + this.experience.totalSpent;
    }

    _computeArmour() {
        let locations = game.system.template.Item.armour.part;
    
        let toughness = this.characteristics.toughness;
    
        this.data.data.armour =
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
        this.data.data.movement = {
            half: agility.bonus + (size - 4),
            full: (agility.bonus * 2) + (size - 4),
            charge: (agility.bonus * 3) + (size - 4),
            run: (agility.bonus * 6) + (size - 4)
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
        this.data.data.encumbrance = {
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
        const dmgRolls = []
        const maxWounds = this.wounds.max;

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
            value: this.wounds.value,
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
                return this.armour.head.total;
            case "ARMOUR.LEFT_ARM":
                return this.armour.leftArm.total;
            case "ARMOUR.RIGHT_ARM":
                return this.armour.rightArm.total;
            case "ARMOUR.BODY":
                return this.armour.body.total;
            case "ARMOUR.LEFT_LEG":
                return this.armour.leftLeg.total;
            case "ARMOUR.RIGHT_LEG":
                return this.armour.rightLeg.total;
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

    get characteristics() {return this.data.data.characteristics}
    get skills() {return this.data.data.skills}
    get initiative() {return this.data.data.initiative}
    get wounds() {return this.data.data.wounds}
    get fatigue() {return this.data.data.fatigue}
    get fate() {return this.data.data.fate}
    get psy() {return this.data.data.psy}
    get bio() {return this.data.data.bio}
    get experience() {return this.data.data.experience}
    get insanity() {return this.data.data.insanity}
    get corruption() {return this.data.data.corruption}
    get aptitudes() {return this.data.data.aptitudes}
    get size() {return this.data.data.size}
    get faction() {return this.data.data.faction}
    get subfaction() {return this.data.data.subfaction}
    get subtype() {return this.data.data.type}
    get threatLevel() {return this.data.data.threatLevel}
    get armour() {return this.data.data.armour}
    get encumbrance() {return this.data.data.encumbrance}
    get movement() {return this.data.data.movement}

}