import { DarkHeresyItemSheet } from "./item.js";

export class WeaponSheet extends DarkHeresyItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["dark-heresy", "sheet", "weapon"],
            template: "systems/dark-heresy/template/sheet/weapon.hbs",
            width: 500,
            height: 369,
            resizable: false,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "stats"
                }
            ],
            dragDrop: [{
                dropSelector: null
            }]
        });
    }

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        buttons = [].concat(buttons);
        return buttons;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    _canDragDrop(selector) {
        return true;
    }

    async _onDrop(event) {
        let dragEventData = TextEditor.getDragEventData(event);
        let item = fromUuidSync(dragEventData.uuid);

        // We only want to allow drops on weapons that belong to an actor
        if (!this.item.actor) return;

        // It has to be ammunition from the same actor
        if (item?.type === "ammunition" && item?.actor.uuid === this.item.actor.uuid) {
            if (this.item.ammo !== "") {
                // remove old ammo
            }

            this.item.update({ "system.ammo": item.id });
        }
    }
}
