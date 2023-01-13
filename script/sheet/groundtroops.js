import { DarkHeresyItemSheet } from "./item.js";

export class GroundtroopsSheet extends DarkHeresyItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["dark-heresy", "sheet", "groundtroops"],
            template: "systems/dark-heresy/template/sheet/groundtroops.html",
            width: 500,
            height: 369,
            resizable: false,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "stats",
                }
            ]
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
    }
    