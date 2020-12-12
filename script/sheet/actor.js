import { prepareCommonRoll, prepareCombatRoll, preparePsychicPowerRoll } from "../common/dialog.js";

export class DarkHeresySheet extends ActorSheet {
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".item-create").click(ev => this._onItemCreate(ev));
    html.find(".item-edit").click(ev => this._onItemEdit(ev));
    html.find(".item-delete").click(ev => this._onItemDelete(ev));
    html.find("input").focusin(ev => this._onFocusIn(ev));
    html.find(".roll-characteristic").click(async ev => await this._prepareRollCharacteristic(ev));
    html.find(".roll-skill").click(async ev => await this._prepareRollSkill(ev));
    html.find(".roll-speciality").click(async ev => await this._prepareRollSpeciality(ev));
    html.find(".roll-insanity").click(async ev => await this._prepareRollInsanity(ev));
    html.find(".roll-corruption").click(async ev => await this._prepareRollCorruption(ev));
    html.find(".roll-weapon").click(async ev => await this._prepareRollWeapon(ev));
    html.find(".roll-psychic-power").click(async ev => await this._prepareRollPsychicPower(ev));
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    if (this.actor.owner) {
      buttons = [
        {
          label: game.i18n.localize("BUTTON.ROLL"),
          class: "custom-roll",
          icon: "fas fa-dice",
          onclick: async (ev) => await this._prepareCustomRoll()
        }
      ].concat(buttons);
    }
    return buttons;
  }

  _onItemCreate(event) {
    event.preventDefault();
    let header = event.currentTarget;
    let data = duplicate(header.dataset);
    data["name"] = `New ${data.type.capitalize()}`;
    this.actor.createEmbeddedEntity("OwnedItem", data, {renderSheet: true});
  }

  _onItemEdit(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents(".item");
    const item = this.actor.getOwnedItem(div.data("itemId"));
    item.sheet.render(true);
  }

  _onItemDelete(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents(".item");
    this.actor.deleteOwnedItem(div.data("itemId"));
    div.slideUp(200, () => this.render(false));
  }

  _onFocusIn(event) {
    $(event.currentTarget).select();
  }

  async _prepareCustomRoll() {
    const rollData = {
      name: "DIALOG.CUSTOM_ROLL",
      baseTarget: 50,
      modifier: 0
    };
    await prepareCommonRoll(rollData);
  }

  async _prepareRollCharacteristic(event) {
    event.preventDefault();
    const characteristicName = $(event.currentTarget).data("characteristic");
    const characteristic = this.actor.data.data.characteristics[characteristicName];
    const rollData = {
      name: characteristic.label,
      baseTarget: characteristic.total,
      modifier: 0
    };
    await prepareCommonRoll(rollData);
  }

  async _prepareRollSkill(event) {
    event.preventDefault();
    const skillName = $(event.currentTarget).data("skill");
    const skill = this.actor.data.data.skills[skillName];
    const rollData = {
      name: skill.label,
      baseTarget: skill.total,
      modifier: 0
    };
    await prepareCommonRoll(rollData);
  }

  async _prepareRollSpeciality(event) {
    event.preventDefault();
    const skillName = $(event.currentTarget).parents(".item").data("skill");
    const specialityName = $(event.currentTarget).data("speciality");
    const skill = this.actor.data.data.skills[skillName];
    const speciality = skill.specialities[specialityName];
    const rollData = {
      name: speciality.label,
      baseTarget: speciality.total,
      modifier: 0
    };
    await prepareCommonRoll(rollData);
  }

  async _prepareRollInsanity(event) {
    event.preventDefault();
    const characteristic = this.actor.data.data.characteristics.willpower;
    const rollData = {
      name: "FEAR.HEADER",
      baseTarget: characteristic.total,
      modifier: 0
    };
    await prepareCommonRoll(rollData);
  }

  async _prepareRollCorruption(event) {
    event.preventDefault();
    const characteristic = this.actor.data.data.characteristics.willpower;
    const rollData = {
      name: "CORRUPTION.HEADER",
      baseTarget: characteristic.total,
      modifier: this._getCorruptionModifier()
    };
    await prepareCommonRoll(rollData);
  }

  async _prepareRollWeapon(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents(".item");
    const weapon = this.actor.getOwnedItem(div.data("itemId"));
    let characteristic = this._getWeaponCharacteristic(weapon);
    let rateOfFire;
    if (weapon.data.data.class === "melee") {
      rateOfFire = { burst: characteristic.bonus, full: characteristic.bonus };
    } else {
      rateOfFire = { burst: weapon.data.data.rateOfFire.burst, full: weapon.data.data.rateOfFire.full };
    }
    let rollData = {
      name: weapon.name,
      baseTarget: characteristic.total + weapon.data.data.attack,
      modifier: 0,
      isMelee: weapon.data.data.class === "melee",
      isRange: !(weapon.data.data.class === "melee"),
      damageFormula: weapon.data.data.damage,
      damageBonus: (weapon.data.data.class === "melee") ? this.actor.data.data.characteristics.strength.bonus : 0,
      damageType: weapon.data.data.damageType,
      penetrationFormula: weapon.data.data.penetration,
      rateOfFire: rateOfFire,
      special: weapon.data.data.special,
      psy: { value: this.actor.data.data.psy.rating, display: false },
    };
    await prepareCombatRoll(rollData);
  }

  async _prepareRollPsychicPower(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents(".item");
    const psychicPower = this.actor.getOwnedItem(div.data("itemId"));
    let characteristic = this._getPsychicPowerCharacteristic(psychicPower);
    const rollData = {
      name: psychicPower.name,
      baseTarget: characteristic.total,
      modifier: psychicPower.data.data.focusPower.difficulty,
      damageFormula: psychicPower.data.data.damage.formula,
      psy: { value: 1, max: this.actor.data.data.psy.rating, display: true },
      damageType: psychicPower.data.data.damage.type,
      damageBonus: 0,
      penetrationFormula: psychicPower.data.data.damage.penetration,
      attackType: { name: psychicPower.data.data.zone }
    };
    await preparePsychicPowerRoll(rollData);
  }

  _getCorruptionModifier() {
    const corruption = this.actor.data.data.corruption;
    if (corruption <= 30) {
      return 0;
    } else if (corruption >= 31 && corruption <= 60) {
      return -10;
    } else if (corruption >= 61 && corruption <= 90) {
      return -20;
    } else if (corruption >= 91) {
      return -30;
    }
  }

  _getWeaponCharacteristic(weapon) {
    if (weapon.data.data.class === "melee") {
      return this.actor.data.data.characteristics.weaponSkill;
    } else {
      return this.actor.data.data.characteristics.ballisticSkill;
    }
  }

  _getPsychicPowerCharacteristic(psychicPower) {
    const normalizeName = psychicPower.data.data.focusPower.test.toLowerCase();
    if (this.actor.data.data.characteristics.hasOwnProperty(normalizeName)) {
      return this.actor.data.data.characteristics[normalizeName];
    } else {
      return this.actor.data.data.characteristics.willpower;
    }
  }
}
