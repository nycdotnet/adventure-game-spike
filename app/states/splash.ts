namespace Shortbow {

    export class Splash {
        private loadingText: Phaser.Text;
        
        preload() {
            this.loadingText = game.add.text(0, 0,
                "Loading assets...",
                {font: "20px Arial, Helvetica, sans-serif",
                fill: "#ffffff",
                boundsAlignH: "center",
                boundsAlignV: "middle"});
            this.loadingText.setTextBounds(0, 0, game.stage.width, game.stage.height);

            game.load.spritesheet('linkRunning', 'images/LinkRunning.png', 24, 28);
            game.load.spritesheet('arrow', 'images/Arrow.png', 20, 9);
            game.load.spritesheet('princessZelda', 'images/PrincessZelda.png', 16, 23);
            game.load.spritesheet('enemies', 'images/Enemies.png', 18, 33);
            game.load.image('grunt', 'images/grunt.png');
            game.load.script("GameMenu", "scripts/app/states/gamemenu.js");
        }

        create() {
            game.state.add("GameMenu", new GameMenu());
            game.state.start("GameMenu");
        }
    }
}