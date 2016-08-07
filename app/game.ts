const game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload, create, update });
let linkSprite: Phaser.Sprite;

function preload() {
    game.load.spritesheet('linkRunning', 'images/LinkRunning.gif', 24, 28);
}

function create() {
    linkSprite = game.add.sprite(40, 100, 'linkRunning');
    linkSprite.animations.add('run', [0,1,2,3,4,5,6,7]);
    linkSprite.animations.play('run', 20, true);
    linkSprite.scale.x = 3;
    linkSprite.scale.y = 3;
    game.add.tween(linkSprite).to({x: game.width}, 5000, Phaser.Easing.Linear.None, true);
}


function update() {
  if (linkSprite.x >= game.width)
   {
       linkSprite.x = -24;
       game.add.tween(linkSprite).to({x: game.width}, 5000, Phaser.Easing.Linear.None, true);
   }
}
