import { DarkHeresySheet } from "./actor.js";

export class NpcSheet extends DarkHeresySheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["dark-heresy", "sheet", "actor"],
            template: "systems/dark-heresy/template/sheet/npc.html",
            width: 700,
            height: 881,
            resizable: false,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "stats",
                },
            ],
        });
    }

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        if (this.actor.owner) {
            buttons = [].concat(buttons);
        }
        return buttons;
    }

    getData() {
        const data = super.getData();
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".item-cost").focusout(async (ev) => { await this._onItemCostFocusOut(ev); });
    }

    async _onItemCostFocusOut(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        let item = this.actor.getOwnedItem(div.data("itemId"));
        let data = { _id: item._id, "data.cost": $(event.currentTarget)[0].value };
        await this.actor.updateOwnedItem(data);
        this._render(true);
    }
}
