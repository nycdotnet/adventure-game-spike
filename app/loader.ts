namespace Shortbow {

    export class Loader {
        preload() {
            game.load.script("Splash", "scripts/app/states/splash.js");
        }
        create() {
            game.state.add("Splash", new Shortbow.Splash());
            const loadingDiv = document.getElementById("loading");
            if (loadingDiv) {
                loadingDiv.remove();
            }
            game.state.start("Splash");
        }
    }
    
    export const game = new Phaser.Game("100", "100", Phaser.AUTO, 'game-area');
    game.state.add("Loader", new Loader());
    game.state.start("Loader");
}
