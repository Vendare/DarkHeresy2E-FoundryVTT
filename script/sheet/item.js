export class DarkHeresyItemSheet extends ItemSheet {
    activateListeners(html) {
        super.activateListeners(html);
        html.find("input").focusin(ev => this._onFocusIn(ev));
    }

    async getData() {
        const data = await super.getData();
        data.enrichment = await this._handleEnrichment();
        data.system = data.data.system;
        return data;
    }

    async _handleEnrichment() {
        let enrichment ={};
        enrichment["system.description"] = await TextEditor.enrichHTML(this.item.system.description, {async: true});
        enrichment["system.effect"] = await TextEditor.enrichHTML(this.item.system.effect, {async: true});
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
}
