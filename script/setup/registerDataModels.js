import WeaponData from "../data/item/weaponData.js";

export const registerDataModels = () => {
    foundry.utils.mergeObject(CONFIG.Actor.dataModels, {
        // Stub for when Actors are moved to data models
    });

    foundry.utils.mergeObject(CONFIG.Item.dataModels, {
        // The keys are the types defined in our template.json
        weapon: WeaponData
    });
};
