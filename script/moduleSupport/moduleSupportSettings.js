export const registerAdditionalModuleSettings = function() {

    if (game.modules.get("autoanimations")?.active) {
        game.settings.register("autoanimations", "criticalAnimation", {
            name: "Righteous Fury Effect",
            hint: "This will play an effect on the token that scores a righteous fury",
            scope: "world",
            config: true,
            type: String
        });
    }

}
