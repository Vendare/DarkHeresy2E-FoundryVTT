export const migrateWorld = async () => {
    const schemaVersion = 5;
    const worldSchemaVersion = Number(game.settings.get("dark-heresy", "worldSchemaVersion"));
    if (worldSchemaVersion !== schemaVersion && game.user.isGM) {
        ui.notifications.info("Upgrading the world, please wait...");
        for (let actor of game.actors.contents) {
            try {
                const update = migrateActorData(actor, worldSchemaVersion);
                if (!isObjectEmpty(update)) {
                    await actor.update(update, {enforceTypes: false});
                }
            } catch (e) {
                console.error(e);
            }
        }
        for (let pack of
            game.packs.filter((p) => p.metadata.package === "world" && ["Actor"].includes(p.metadata.entity))) {
            await migrateCompendium(pack, worldSchemaVersion);
        }
        game.settings.set("dark-heresy", "worldSchemaVersion", schemaVersion);
        ui.notifications.info("Upgrade complete!");
    }
};

const migrateActorData = (actor, worldSchemaVersion) => {
    const update = {};
    if (worldSchemaVersion < 1) {
        if (actor.data.type === "acolyte" || actor.data.type === "npc") {
            actor.data.skills.psyniscience.characteristics = ["Per", "WP"];
            update["system.skills.psyniscience"] = actor.data.data.skills.psyniscience;
        }
    }
    if (worldSchemaVersion < 2) {
        if (actor.data.type === "acolyte" || actor.data.type === "npc") {

            let characteristic = actor.data.characteristics.intelligence.base
            let advance = -20
            let total = characteristic.total + advance

            actor.data.data.skills.forbiddenLore.specialities.officioAssassinorum = {
                "label": "Officio Assassinorum",
                "isKnown": false,
                "advance": advance,
                "total": total,
                "cost": 0
            }
            actor.data.data.skills.forbiddenLore.specialities.pirates = {
                "label": "Pirates",
                "isKnown": false,
                "advance": advance,
                "total": total,
                "cost": 0
            }
            actor.data.data.skills.forbiddenLore.specialities.psykers = {
                "label": "Psykers",
                "isKnown": false,
                "advance": advance,
                "total": total,
                "cost": 0
            }
            actor.data.data.skills.forbiddenLore.specialities.theWarp = {
                "label": "The Warp",
                "isKnown": false,
                "advance": advance,
                "total": total,
                "cost": 0
            }
            actor.data.data.skills.forbiddenLore.specialities.xenos = {
                "label": "Xenos",
                "isKnown": false,
                "advance": advance,
                "total": total,
                "cost": 0
            }
            update["system.skills.forbiddenLore"] = actor.data.data.skills.forbiddenLore;
        }
    
    }

    // // migrate aptitudes
    if (worldSchemaVersion < 4) {
        if (actor.data.type === "acolyte" || actor.data.type === "npc") {

            let textAptitudes = actor.data.data?.aptitudes;

            if (textAptitudes !== null && textAptitudes !== undefined) {
                let aptitudeItemsData =
                    Object.values(textAptitudes)
                    // be extra careful and filter out bad data because the existing data is bugged
                    ?.filter(textAptitude =>
                        'id' in textAptitude
                        && textAptitude?.name !== null
                        && textAptitude?.name !== undefined
                        && typeof textAptitude?.name === 'string'
                        && 0 !== textAptitude?.name?.trim().length)
                    ?.map(textAptitude => {
                        return {
                            name: textAptitude.name,
                            type: "aptitude",
                            isAptitude: true,
                            img: "systems/dark-heresy/asset/icons/aptitudes/aptitude400.png",
                        }
                    })
                if (aptitudeItemsData !== null && aptitudeItemsData !== undefined) {
                    actor.createEmbeddedDocuments("Item", [aptitudeItemsData])
                }
            }
            update["system.-=aptitudes"] = null
        }
    }
    if (worldSchemaVersion < 3) {
         actor.prepareData();
         update["system.armour"] = actor.data.armour;
    }

    if(worldSchemaVersion < 5) {
        actor.prepareData();
        let  experience = actor.data.data?.experience;
        let value = experience?.value + experience?.totalspent;
        // In case of an Error in the calculation don't do anything loosing data is worse
        // than doing nothing in this case since the user can easily do this himself
        if(value !== NaN && value !== undefined) {
            update["system.experience.value"] = value;
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
            updateData = migrateActorData(ent, worldSchemaVersion);
        }
        if (!isObjectEmpty(updateData)) {
            expandObject(updateData);
            updateData["_id"] = ent.id;
            await pack.updateEntity(updateData);
        }
    }
};