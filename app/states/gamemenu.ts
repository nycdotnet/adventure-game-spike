namespace Shortbow {

    export class GameMenu {
        private gameTitle: Phaser.Text;
        
        preload() {
            this.gameTitle = game.add.text(0, 0,
                "Short Bow",
                {font: "60px Arial, Helvetica, sans-serif",
                fill: "#ffffff",
                boundsAlignH: "center",
                boundsAlignV: "middle"});
            this.gameTitle.setTextBounds(0, 0, game.stage.width, game.stage.height / 4);
        }
    }
}