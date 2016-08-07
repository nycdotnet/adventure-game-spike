const game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload, create });

function preload() {
    game.load.image('adventurer', 'images/Link-LTTP.gif');
}

function create() {

    game.add.sprite(100, 100, 'adventurer');

}
