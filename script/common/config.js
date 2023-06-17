let Dh = {};

Dh.attackType = {};

Dh.attackTypeRanged = {
    none: "ATTACK_TYPE.NONE",
    standard: "ATTACK_TYPE.STANDARD",
    semi_auto: "ATTACK_TYPE.SEMI_AUTO",
    full_auto: "ATTACK_TYPE.FULL_AUTO",
    called_shot: "ATTACK_TYPE.CALLED_SHOT"
};

Dh.attackTypeMelee = {
    none: "ATTACK_TYPE.NONE",
    standard: "ATTACK_TYPE.STANDARD",
    charge: "ATTACK_TYPE.CHARGE",
    swift: "ATTACK_TYPE.SWIFT",
    lightning: "ATTACK_TYPE.LIGHTNING",
    allOut: "ATTACK_TYPE.ALLOUT",
    called_shot: "ATTACK_TYPE.CALLED_SHOT"
};

Dh.attackTypePsy = {
    none: "ATTACK_TYPE.NONE",
    bolt: "PSYCHIC_POWER.BOLT",
    barrage: "PSYCHIC_POWER.BARRAGE",
    storm: "PSYCHIC_POWER.STORM",
    blast: "PSYCHIC_POWER.BLAST"
};

Dh.ranges = {
    0: "RANGE.NONE",
    30: "RANGE.POINT_BLANK",
    10: "RANGE.SHORT",
    "-10": "RANGE.LONG",
    "-30": "RANGE.EXTREME"
};

Dh.damageTypes = {
    energy: "DAMAGE_TYPE.ENERGY",
    impact: "DAMAGE_TYPE.IMPACT",
    rending: "DAMAGE_TYPE.RENDING",
    explosive: "DAMAGE_TYPE.EXPLOSIVE"
};

Dh.aimModes = {
    0: "AIMING.NONE",
    10: "AIMING.HALF",
    20: "AIMING.FULL"
};

DH.characteristicCosts = [
      [0, 0, 0],
      [100, 250, 500],
      [250, 500, 750],
      [500, 750, 1000],
      [750, 1000, 1500],
      [1250, 1500, 2500]];

DH.talentCosts = [[200, 300, 600], [300, 450, 900], [400, 600, 1200]];


CONFIG.statusEffects = [
    {
        id: "bleeding",
        label: "CONDITION.BLEEDING",
        icon: "systems/dark-heresy/asset/icons/bleeding.png"
    },
    {
        id: "blinded",
        label: "CONDITION.BLINDED",
        icon: "systems/dark-heresy/asset/icons/blinded.png"
    },
    {
        id: "deafened",
        label: "CONDITION.DEAFEND",
        icon: "systems/dark-heresy/asset/icons/deafened.png"
    },
    {
        id: "fear",
        label: "CONDITION.FEAR",
        icon: "systems/dark-heresy/asset/icons/fear.png"
    },
    {
        id: "fire",
        label: "CONDITION.FIRE",
        icon: "systems/dark-heresy/asset/icons/flame.png"
    },
    {
        id: "grappled",
        label: "CONDITION.GRAPPLED",
        icon: "systems/dark-heresy/asset/icons/grappled.png"
    },
    {
        id: "hidden",
        label: "CONDITION.HIDDEN",
        icon: "systems/dark-heresy/asset/icons/hidden.png"
    },
    {
        id: "pinned",
        label: "CONDITION.PINNED",
        icon: "systems/dark-heresy/asset/icons/pinning.png"
    },
    {
        id: "poisond",
        label: "CONDITION.POISONED",
        icon: "systems/dark-heresy/asset/icons/poisoned.png"
    },
    {
        id: "prone",
        label: "CONDITION.PRONE",
        icon: "systems/dark-heresy/asset/icons/prone.png"
    },
    {
        id: "stunned",
        label: "CONDITION.STUNNED",
        icon: "systems/dark-heresy/asset/icons/stunned.png"
    },
    {
        id: "unconscious",
        label: "CONDITION.UNCONSCIOUS",
        icon: "systems/dark-heresy/asset/icons/unconscious.png"
    },
    {
        id: "dead",
        label: "EFFECT.StatusDead", // Foundry Default Text Key
        icon: "systems/dark-heresy/asset/icons/dead.png"
    }
];

export default Dh;
