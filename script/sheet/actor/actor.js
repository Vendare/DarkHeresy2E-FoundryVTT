import { prepareCommonRoll, prepareCombatRoll, preparePsychicPowerRoll } from "../../common/dialog.js";
import DarkHeresyUtil from "../../common/util.js";

export class DarkHeresySheet extends ActorSheet {
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".item-create").click(ev => this._onItemCreate(ev));
        html.find(".item-edit").click(ev => this._onItemEdit(ev));
        html.find(".item-delete").click(ev => this._onItemDelete(ev));
        html.find(".ammo-unlink").click(ev => this._onAmmoUnlink(ev));
        html.find(".roll-characteristic").click(async ev => await this._prepareRollCharacteristic(ev));
        html.find(".roll-skill").click(async ev => await this._prepareRollSkill(ev));
        html.find(".roll-speciality").click(async ev => await this._prepareRollSpeciality(ev));
        html.find(".roll-insanity").click(async ev => await this._prepareRollInsanity(ev));
        html.find(".roll-corruption").click(async ev => await this._prepareRollCorruption(ev));
        html.find(".roll-weapon").click(async ev => await this._prepareRollWeapon(ev));
        html.find(".roll-psychic-power").click(async ev => await this._prepareRollPsychicPower(ev));
        html.find(".condition-toggle").click(this._onConditionToggle.bind(this));
    }

    /** @override */
    async getData() {
        const data = super.getData();
        data.system = data.data.system;
        data.items = this.constructItemLists(data);
        data.enrichment = await this._enrichment();
        data.effects = this.prepareActiveEffectCategories();
        return data;
    }

    async _enrichment() {
        let enrichment = {};
        if (this.actor.type !== "npc") {
            enrichment["system.bio.notes"] = await TextEditor.enrichHTML(this.actor.system.bio.notes, { async: true });
        } else {
            enrichment["system.notes"] = await TextEditor.enrichHTML(this.actor.system.notes, { async: true });
        }
        return foundry.utils.expandObject(enrichment);
    }

    /** @override */
    get template() {
        if (!game.user.isGM && this.actor.limited) {
            return "systems/dark-heresy/template/sheet/actor/limited-sheet.hbs";
        } else {
            return this.options.template;
        }
    }

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        if (this.actor.isOwner) {
            buttons = [
                {
                    label: game.i18n.localize("BUTTON.ROLL"),
                    class: "custom-roll",
                    icon: "fas fa-dice",
                    onclick: async () => await this._prepareCustomRoll()
                }
            ].concat(buttons);
        }
        return buttons;
    }

    _onItemCreate(event) {
        event.preventDefault();
        let header = event.currentTarget.dataset;

        let data = {
            name: `New ${game.i18n.localize(`TYPES.Item.${header.type.toLowerCase()}`)}`,
            type: header.type
        };
        this.actor.createEmbeddedDocuments("Item", [data], { renderSheet: true });
    }

    _onItemEdit(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        let item = this.actor.items.get(div.data("itemId"));
        item.sheet.render(true);
    }

    _onItemDelete(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        this.actor.deleteEmbeddedDocuments("Item", [div.data("itemId")]);
        div.slideUp(200, () => this.render(false));
    }

    _onAmmoUnlink(event) {
        event.preventDefault();
        const ammoId = $(event.currentTarget).parents(".linked-item").data("ammoId");
        const weaponId = $(event.currentTarget).parents(".item").data("itemId");

        let newAmmos = this.actor.items.get(weaponId).system.ammo.filter(ammo => ammo !== ammoId);
        this.actor.items.get(weaponId).update({ "system.ammo": newAmmos });
        this.actor.items.get(ammoId).update({ "system.weaponId": "" });
    }

    async _prepareCustomRoll() {
        const rollData = {
            name: "DIALOG.CUSTOM_ROLL",
            baseTarget: 50,
            modifier: 0,
            ownerId: this.actor.id
        };
        await prepareCommonRoll(rollData);
    }

    async _prepareRollCharacteristic(event) {
        event.preventDefault();
        const characteristicName = $(event.currentTarget).data("characteristic");
        await prepareCommonRoll(
            DarkHeresyUtil.createCharacteristicRollData(this.actor, characteristicName)
        );
    }

    async _prepareRollSkill(event) {
        event.preventDefault();
        const skillName = $(event.currentTarget).data("skill");
        await prepareCommonRoll(
            DarkHeresyUtil.createSkillRollData(this.actor, skillName)
        );
    }

    async _prepareRollSpeciality(event) {
        event.preventDefault();
        const skillName = $(event.currentTarget).parents(".item").data("skill");
        const specialityName = $(event.currentTarget).data("speciality");
        await prepareCommonRoll(
            DarkHeresyUtil.createSpecialtyRollData(this.actor, skillName, specialityName)
        );
    }

    async _prepareRollInsanity(event) {
        event.preventDefault();
        await prepareCommonRoll(
            DarkHeresyUtil.createFearTestRolldata(this.actor)
        );
    }

    async _prepareRollCorruption(event) {
        event.preventDefault();
        await prepareCommonRoll(
            DarkHeresyUtil.createMalignancyTestRolldata(this.actor)
        );
    }

    async _prepareRollWeapon(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        const weapon = this.actor.items.get(div.data("itemId"));
        await prepareCombatRoll(
            DarkHeresyUtil.createWeaponRollData(this.actor, weapon),
            this.actor
        );
    }

    async _prepareRollPsychicPower(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        const psychicPower = this.actor.items.get(div.data("itemId"));
        await preparePsychicPowerRoll(
            DarkHeresyUtil.createPsychicRollData(this.actor, psychicPower)
        );
    }

    _onConditionToggle(ev)
    {
        let key = $(ev.currentTarget).parents(".condition").data("key");
        if (this.actor.hasCondition(key)) {
            this.actor.removeCondition(key);
        } else {
            this.actor.addCondition(key);
        }
    }

    constructItemLists() {
        let items = {};
        let itemTypes = this.actor.itemTypes;
        items.mentalDisorders = itemTypes.mentalDisorder;
        items.malignancies = itemTypes.malignancy;
        items.mutations = itemTypes.mutation;
        if (this.actor.type === "npc") {
            items.abilities = itemTypes.talent
                .concat(itemTypes.trait)
                .concat(itemTypes.specialAbility);
        }
        items.talents = itemTypes.talent;
        items.traits = itemTypes.trait;
        items.specialAbilities = itemTypes.specialAbility;
        items.aptitudes = itemTypes.aptitude;

        items.psychicPowers = itemTypes.psychicPower;

        items.criticalInjuries = itemTypes.criticalInjury;

        items.gear = itemTypes.gear;
        items.drugs = itemTypes.drug;
        items.tools = itemTypes.tool;
        items.cybernetics = itemTypes.cybernetic;

        items.armour = itemTypes.armour;
        items.forceFields = itemTypes.forceField;

        items.weapons = itemTypes.weapon;
        items.weaponMods = itemTypes.weaponModification;
        items.ammunitions = itemTypes.ammunition;
        this._sortItemLists(items);

        return items;
    }

    _sortItemLists(items) {
        for (let list in items) {
            if (Array.isArray(items[list])) items[list] = items[list].sort((a, b) => a.sort - b.sort);
            else if (typeof items[list] == "object") _sortItemLists(items[list]);
        }
    }

    /**
     *  Prepare the data structure for Active Effects which are currently embedded in an Actor or Item.
     * @returns {object}                   Data for rendering
     */
    prepareActiveEffectCategories() {
        // Define effect header categories
        const categories = {
            temporary: {
                type: "temporary",
                label: game.i18n.localize("DH.Effect.Temporary"),
                effects: []
            },
            passive: {
                type: "passive",
                label: game.i18n.localize("DH.Effect.Passive"),
                effects: []
            },
            inactive: {
                type: "inactive",
                label: game.i18n.localize("DH.Effect.Inactive"),
                effects: []
            }
        };

        categories.conditions = CONFIG.statusEffects.map(i => {
            return {
                name: i.name,
                key: i.id,
                img: i.img,
                existing: this.actor.hasCondition(i.id)
            };
        });

        for (let e of Array.from(this.actor.allApplicableEffects()))
        {
            if (!this._isCondition(e)) {
                if (e.disabled) categories.inactive.effects.push(e);
                else if (e.isTemporary) categories.temporary.effects.push(e);
                else categories.passive.effects.push(e);
            }
        }
        return categories;
    }

    _isCondition(effect) {
        return CONFIG.statusEffects.map(i => i.id).includes(Array.from(effect.statuses)[0])
    }

}
