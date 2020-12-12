export class DarkHeresyItem extends Item {
    async sendToChat() {
        const item = duplicate(this.data);
        if (item.img.includes("/mystery-man")) {
            item.img = null;
        }
        item.isMentalDisorder = item.type === "mentalDisorder";
        item.isMalignancy = item.type === "malignancy";
        item.isMutation = item.type === "mutation";
        item.isTalent = item.type === "talent";
        item.isTrait = item.type === "trait";
        item.isSpecialAbility = item.type === "specialAbility";
        item.isPsychicPower = item.type === "psychicPower";
        item.isCriticalInjury = item.type === "criticalInjury";
        item.isWeapon = item.type === "weapon";
        item.isArmour = item.type === "armour";
        item.isGear = item.type === "gear";
        item.isDrug = item.type === "drug";
        item.isTool = item.type === "tool";
        item.isCybernetic = item.type === "cybernetic";
        item.isWeaponModification = item.type === "weaponModification";
        item.isAmmunition = item.type === "ammunition";
        item.isForceField = item.type === "forceField";
        const html = await renderTemplate("systems/dark-heresy/template/chat/item.html", item);
        const chatData = {
            user: game.user._id,
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
}