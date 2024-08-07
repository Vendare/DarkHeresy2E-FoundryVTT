export class DarkHeresyItemSheet extends ItemSheet {
    activateListeners(html) {
        super.activateListeners(html);
        html.find("input").focusin(ev => this._onFocusIn(ev));

        // Active Effect management
        html.on("click", ".effect-control", (ev) =>
            this.onManageActiveEffect(ev, this.item)
        );

    }

    async getData() {
        const data = await super.getData();
        data.enrichment = await this._handleEnrichment();
        data.system = data.data.system;

        // Prepare active effects for easier access
        data.effects = this.prepareActiveEffectCategories(this.item.effects);

        return data;
    }

    async _handleEnrichment() {
        let enrichment = {};
        enrichment["system.description"] = await TextEditor.enrichHTML(this.item.system.description, { async: true });
        enrichment["system.effect"] = await TextEditor.enrichHTML(this.item.system.effect, { async: true });
        return foundry.utils.expandObject(enrichment);
    }

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        buttons = [
            {
                label: game.i18n.localize("BUTTON.POST_ITEM"),
                class: "item-post",
                icon: "fas fa-comment",
                onclick: ev => this.item.sendToChat()
            }
        ].concat(buttons);
        return buttons;
    }

    _onFocusIn(event) {
        $(event.currentTarget).select();
    }

    /**
     * Prepare the data structure for Active Effects which are currently embedded in an Actor or Item.
     * @param {ActiveEffect[]} effects    A collection or generator of Active Effect documents to prepare sheet data for
     * @returns {object}                   Data for rendering
     */
    prepareActiveEffectCategories(effects) {
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

        // Iterate over active effects, classifying them into categories
        for (let e of effects) {
            if (e.disabled) categories.inactive.effects.push(e);
            else if (e.isTemporary) categories.temporary.effects.push(e);
            else categories.passive.effects.push(e);
        }
        return categories;
    }

    /**
     * Manage Active Effect instances through an Actor or Item Sheet via effect control buttons.
     * @param {MouseEvent} event      The left-click event on the effect control
     * @param {Actor|Item} owner      The owning document which manages this effect
     * @returns {object}              effect function
     */
    onManageActiveEffect(event, owner) {
        event.preventDefault();
        const a = event.currentTarget;
        const li = a.closest("li");
        const effect = li.dataset.effectId
            ? owner.effects.get(li.dataset.effectId)
            : null;
        switch (a.dataset.action) {
            case "create":
                return owner.createEmbeddedDocuments("ActiveEffect", [
                    {
                        name: game.i18n.format("DOCUMENT.New", {
                            type: game.i18n.localize("DOCUMENT.ActiveEffect")
                        }),
                        icon: "icons/svg/aura.svg",
                        origin: owner.uuid,
                        "duration.rounds":
                            li.dataset.effectType === "temporary" ? 1 : undefined,
                        disabled: li.dataset.effectType === "inactive"
                    },
                ]);
            case "edit":
                return effect.sheet.render(true);
            case "delete":
                return effect.delete();
            case "toggle":
                return effect.update({ disabled: !effect.disabled });
        }
    }
}
