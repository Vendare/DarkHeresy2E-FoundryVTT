import { DarkHeresyItemSheet } from "./item.js";

export class StarshipcoreSheet extends DarkHeresyItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["dark-heresy", "sheet", "starshipcore"],
            template: "systems/dark-heresy/template/sheet/starship-equipment.html",
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
    