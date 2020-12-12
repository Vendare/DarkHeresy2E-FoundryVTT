export const migrateWorld = async () => {
    const schemaVersion = 2;
    const worldSchemaVersion = Number(game.settings.get("dark-heresy", "worldSchemaVersion"));
    if (worldSchemaVersion !== schemaVersion && game.user.isGM) {
        ui.notifications.info("Upgrading the world, please wait...");
        for (let actor of game.actors.entities) {
            try {
                const update = migrateActorData(actor.data, worldSchemaVersion);
                if (!isObjectEmpty(update)) {
                    await actor.update(update, {enforceTypes: false});
                }
            } catch (e) {
                console.error(e);
            }
        }
        for (let pack of game.packs.filter((p) => p.metadata.package === "world" && ["Actor"].includes(p.metadata.entity))) {
            await migrateCompendium(pack, worldSchemaVersion);
        }
        game.settings.set("dark-heresy", "worldSchemaVersion", schemaVersion);
        ui.notifications.info("Upgrade complete!");
    }
};

const migrateActorData = (actor, worldSchemaVersion) => {
    const update = {};
    if (worldSchemaVersion < 1) {
        if (actor.type === "acolyte" || actor.type === "npc") {
            actor.data.skills.psyniscience.characteristics = [ "Per", "WP" ];
            update["data.skills.psyniscience"] = actor.data.skills.psyniscience;
        }
    }
    if (worldSchemaVersion < 2) {
        if (actor.type === "acolyte" || actor.type === "npc") {

            let characteristic = actor.data.characteristics.intelligence.base
            let advance = -20
            let total = characteristic.total + advance

            actor.data.skills.forbiddenLore.specialities.officioAssassinorum = {
                "label": "Officio Assassinorum",
                "isKnown": false,
                "advance": advance,
                "total": total,
                "cost": 0
            }
            actor.data.skills.forbiddenLore.specialities.pirates = {
                "label": "Pirates",
                "isKnown": false,
                "advance": advance,
                "total": total,
                "cost": 0
            }
            actor.data.skills.forbiddenLore.specialities.psykers = {
                "label": "Psykers",
                "isKnown": false,
                "advance": advance,
                "total": total,
                "cost": 0
            }
            actor.data.skills.forbiddenLore.specialities.theWarp = {
                "label": "The Warp",
                "isKnown": false,
                "advance": advance,
                "total": total,
                "cost": 0
            }
            actor.data.skills.forbiddenLore.specialities.xenos = {
                "label": "Xenos",
                "isKnown": false,
                "advance": advance,
                "total": total,
                "cost": 0
            }
            update["data.skills.forbiddenLore"] = actor.data.skills.forbiddenLore;
        }
    }
    return update;
};

export const migrateCompendium = async function (pack, worldSchemaVersion) {
    const entity = pack.metadata.entity;

    await pack.migrate();
    const content = await pack.getContent();

    for (let ent of content) {
        let updateData = {};
        if (entity === "Actor") {
            updateData = migrateActorData(ent.data, worldSchemaVersion);
        }
        if (!isObjectEmpty(updateData)) {
            expandObject(updateData);
            updateData["_id"] = ent._id;
            await pack.updateEntity(updateData);
        }
    }
};