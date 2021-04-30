export class DarkHeresyItem extends Item {
    async sendToChat() {
        const item = new CONFIG.Item.documentClass(this.data._source);
        const html = await renderTemplate("systems/dark-heresy/template/chat/item.html", {item, data: item.data.data});
        const chatData = {
            user: game.user.id,
            rollMode: game.settings.get("core", "rollMode"),
            content: html,
        };
        if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
            chatData.whisper = ChatMessage.getWhisperRecipients("GM");
        } else if (chatData.rollMode === "selfroll") {
            chatData.whisper = [game.user];
        }
        ChatMessage.create(chatData);
    }


    get clip() { return `${this.data.data.clip.value}/${this.data.data.clip.max}` }

    get rateOfFire() {
        let rof = this.data.data.rateOfFire
        let single = rof.single > 0 ? "S" : "-";
        let burst = rof.burst > 0 ? `${rof.burst}` : "-";
        let full = rof.full > 0 ? `${rof.full}` : "-";
        return `${single}/${burst}/${full}`
    }

    get damageType() {
        switch (this.data.data.damageType) {
            case "energy":
              return game.i18n.localize("DAMAGE_TYPE.ENERGY_SHORT");
            case "impact":
              return game.i18n.localize("DAMAGE_TYPE.IMPACT_SHORT");
            case "rending":
              return game.i18n.localize("DAMAGE_TYPE.RENDING_SHORT");
            case "explosive":
              return game.i18n.localize("DAMAGE_TYPE.EXPLOSIVE_SHORT");
            default:
              return game.i18n.localize("DAMAGE_TYPE.IMPACT_SHORT");
          }
    }

    get weaponClass() {

        switch (this.data.data.class) {
          case "melee":
            return game.i18n.localize("WEAPON.MELEE");
          case "thrown":
            return game.i18n.localize("WEAPON.THROWN");
          case "launched":
            return game.i18n.localize("WEAPON.LAUNCHED");
          case "placed":
            return game.i18n.localize("WEAPON.PLACED");
          case "pistol":
            return game.i18n.localize("WEAPON.PISTOL");
          case "basic":
            return game.i18n.localize("WEAPON.BASIC");
          case "heavy":
            return game.i18n.localize("WEAPON.HEAVY");
          case "vehicle":
            return game.i18n.localize("WEAPON.VEHICLE");
          default:
            return game.i18n.localize("WEAPON.MELEE");
        }
    }
    get weaponType() {

        switch (this.data.data.type) {
            case "las" : 
                return game.i18n.localize("WEAPON.LAS")
            case "solidprojectile" : 
                return game.i18n.localize("WEAPON.SOLIDPROJECTILE")
            case "bolt" : 
                return game.i18n.localize("WEAPON.BOLT")
            case "melta" : 
                return game.i18n.localize("WEAPON.MELTA")
            case "plasma" : 
                return game.i18n.localize("WEAPON.PLASMA")
            case "flame" : 
                return game.i18n.localize("WEAPON.FLAME")
            case "lowtech" : 
                return game.i18n.localize("WEAPON.LOWTECH")
            case "launcher" : 
                return game.i18n.localize("WEAPON.LAUNCHER")
            case "explosive" : 
                return game.i18n.localize("WEAPON.EXPLOSIVE")
            case "exotic" : 
                return game.i18n.localize("WEAPON.EXOTIC")
            case "chain" : 
                return game.i18n.localize("WEAPON.CHAIN")
            case "power" : 
                return game.i18n.localize("WEAPON.POWER")
            case "shock" : 
                return game.i18n.localize("WEAPON.SHOCK")
            case "force" : 
                return game.i18n.localize("WEAPON.FORCE")
        }
    }

    get craftsmanship() {
        switch (this.data.data.craftsmanship) {
            case "poor":
              return game.i18n.localize("CRAFTSMANSHIP.POOR");
            case "common":
              return game.i18n.localize("CRAFTSMANSHIP.COMMON");
            case "good":
              return game.i18n.localize("CRAFTSMANSHIP.GOOD");
            case "best":
              return game.i18n.localize("CRAFTSMANSHIP.BEST");
            default:
              return game.i18n.localize("CRAFTSMANSHIP.COMMON");
          }
    }

    get availability() {
        switch (this.data.data.availability) {
            case "ubiquitous":
              return game.i18n.localize("AVAILABILITY.UBIQUITOUS");
            case "abundant":
              return game.i18n.localize("AVAILABILITY.ABUNDANT");
            case "plentiful":
              return game.i18n.localize("AVAILABILITY.PLENTIFUL");
            case "common":
              return game.i18n.localize("AVAILABILITY.COMMON");
            case "average":
              return game.i18n.localize("AVAILABILITY.AVERAGE");
            case "scarce":
              return game.i18n.localize("AVAILABILITY.SCARCE");
            case "rare":
              return game.i18n.localize("AVAILABILITY.RARE");
            case "very-rare":
              return game.i18n.localize("AVAILABILITY.VERY_RARE");
            case "extremely-rare":
              return game.i18n.localize("AVAILABILITY.EXTREMELY_RARE");
            case "near-unique":
              return game.i18n.localize("AVAILABILITY.NEAR_UNIQUE");
            case "Unique":
              return game.i18n.localize("AVAILABILITY.UNIQUE");
            default:
              return game.i18n.localize("AVAILABILITY.COMMON");
          }
    }

    get armourType() {
        switch (this.data.data.type) {
            case "basic":
              return game.i18n.localize("ARMOUR_TYPE.BASIC");
            case "flak":
              return game.i18n.localize("ARMOUR_TYPE.FLAK");
            case "mesh":
              return game.i18n.localize("ARMOUR_TYPE.MESH");
            case "carapace":
              return game.i18n.localize("ARMOUR_TYPE.CARAPACE");
            case "power":
              return game.i18n.localize("ARMOUR_TYPE.POWER");
            default:
              return game.i18n.localize("ARMOUR_TYPE.COMMON");
          }
    }

    get part() {
        let part = this.data.data.part
        let parts = [];
        if (part.head > 0) parts.push(`${game.i18n.localize("ARMOUR.HEAD")} (${part.head})`);
        if (part.leftArm > 0) parts.push(`${game.i18n.localize("ARMOUR.LEFT_ARM")} (${part.leftArm})`);
        if (part.rightArm > 0) parts.push(`${game.i18n.localize("ARMOUR.RIGHT_ARM")} (${part.rightArm})`);
        if (part.body > 0) parts.push(`${game.i18n.localize("ARMOUR.BODY")} (${part.body})`);
        if (part.leftLeg > 0) parts.push(`${game.i18n.localize("ARMOUR.LEFT_LEG")} (${part.leftLeg})`);
        if (part.rightLeg > 0) parts.push(`${game.i18n.localize("ARMOUR.RIGHT_LEG")} (${part.rightLeg})`);
        return parts.join(" / ");
    }

    get partLocation() {
        switch (this.data.data.part) {
            case "head":
              return game.i18n.localize("ARMOUR.HEAD");
            case "leftArm":
              return game.i18n.localize("ARMOUR.LEFT_ARM");
            case "rightArm":
              return game.i18n.localize("ARMOUR.RIGHT_ARM");
            case "body":
              return game.i18n.localize("ARMOUR.BODY");
            case "leftLeg":
              return game.i18n.localize("ARMOUR.LEFT_LEG");
            case "rightLeg":
              return game.i18n.localize("ARMOUR.RIGHT_LEG");
            default:
              return game.i18n.localize("ARMOUR.BODY");
          }
    }

    get psychicPowerZone() {
        switch (this.data.data.damage.zone) {
            case "bolt":
              return game.i18n.localize("PSYCHIC_POWER.BOLT");
            case "barrage":
              return game.i18n.localize("PSYCHIC_POWER.BARRAGE");
            case "storm":
              return game.i18n.localize("PSYCHIC_POWER.STORM");
            default:
              return game.i18n.localize("PSYCHIC_POWER.BOLT");
          }
    }

    get isInstalled() { 
        return this.data.data.installed ?
         game.i18n.localize("Yes") : 
         game.i18n.localize("No")
    }



    get damage() {return this.data.data.damage}

    get range() {return this.data.data.range}

    get weight() {return this.data.data.weight}

    get upgrades() {return this.data.data.upgrades}

    get shortDescription() {return this.data.data.shortDescription}




    get isMentalDisorder() { return this.type === "mentalDisorder"; }

    get isMalignancy() { return this.type === "malignancy"; }

    get isMutation() { return this.type === "mutation"; }

    get isTalent() { return this.type === "talent"; }

    get isTrait() { return this.type === "trait"; }

    get isAptitude() { return this.type === "aptitude"; }

    get isSpecialAbility() { return this.type === "specialAbility"; }

    get isPsychicPower() { return this.type === "psychicPower"; }

    get isCriticalInjury() { return this.type === "criticalInjury"; }

    get isWeapon() { return this.type === "weapon"; }

    get isArmour() { return this.type === "armour"; }

    get isGear() { return this.type === "gear"; }

    get isDrug() { return this.type === "drug"; }

    get isTool() { return this.type === "tool"; }

    get isCybernetic() { return this.type === "cybernetic"; }

    get isWeaponModification() { return this.type === "weaponModification"; }

    get isAmmunition() { return this.type === "ammunition"; }

    get isForceField() { return this.type === "forceField"; }

    get isAbilities() { return this.isTalent || item.isTrait || item.isSpecialAbility; }

}