namespace Shortbow {

    export const game = new Phaser.Game("100", "100", Phaser.AUTO, 'game-area');

    const preload = () => {
        game.load.script("Splash", "scripts/app/states/splash.js");
    };

    const create = () => {
        game.state.add("Splash", Shortbow.Splash);
        const loadingDiv = document.getElementById("loading");
        if (loadingDiv) {
            loadingDiv.remove();
        }
        game.state.start("Splash");
    };

    const Loader = {preload, create};
    
    game.state.add("Loader", Loader);
    game.state.start("Loader");
}
