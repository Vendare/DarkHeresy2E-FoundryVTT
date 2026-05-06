const fields = foundry.data.fields;

export default class EquipmentItemData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            craftsmanship: new fields.StringField({ initial: "common" }),
            description: new fields.StringField({ initial: "" }),
            availability: new fields.StringField({ initial: "common" }),
            weight: new fields.NumberField({ initial: 0 })
        };
    }
}
