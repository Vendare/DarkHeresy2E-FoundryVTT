import { DarkHeresySheet } from "./actor.js";

export class AcolyteSheet extends DarkHeresySheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["dark-heresy", "sheet", "actor"],
            template: "systems/dark-heresy/template/sheet/acolyte.html",
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
        html.find(".aptitude-create").click(async (ev) => { await this._onAptitudeCreate(ev); });
        html.find(".aptitude-delete").click(async (ev) => { await this._onAptitudeDelete(ev); });
        html.find(".item-cost").focusout(async (ev) => { await this._onItemCostFocusOut(ev); });
    }

    async _onAptitudeCreate(event) {
        event.preventDefault();
        let aptitudeId = Date.now().toString();
        let aptitude = { id: Date.now().toString(), name: "New Aptitude" };
        await this.actor.update({["data.aptitudes." + aptitudeId]: aptitude});
        this._render(true);
    }

    async _onAptitudeDelete(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        const aptitudeId = div.data("aptitudeId").toString();
        await this.actor.update({["data.aptitudes.-=" + aptitudeId]: null});
        this._render(true);
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
