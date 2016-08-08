const game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload, create, update });

let player: Phaser.Sprite;
let cursors: Phaser.CursorKeys;
let playerSpeed = 250, playerScale = 3;

function preload() {
    game.load.spritesheet('linkRunning', 'images/LinkRunning.gif', 24, 28);
}

function create() {
    player = game.add.sprite(40, 100, 'linkRunning');
    player.animations.add('runRight', [0,1,2,3,4,5,6,7], 30);
    player.scale.x = playerScale;
    player.scale.y = playerScale;
    player.anchor.x = 0.5;
    player.anchor.x = 0.5;
    game.physics.enable(player, Phaser.Physics.ARCADE);

    cursors = game.input.keyboard.createCursorKeys();
}


function update() {

  player.body.velocity.setTo(0, 0);

  if (cursors.left.isDown) {
    player.body.velocity.x -= playerSpeed;
    player.scale.x = -playerScale;
    player.animations.play('runRight');
  }
  if (cursors.right.isDown) {
    player.body.velocity.x += playerSpeed;
    player.scale.x = playerScale;
    player.animations.play('runRight');
  }
  if (cursors.up.isDown) {
    player.body.velocity.y -= playerSpeed;
    player.animations.play('runRight');
  }
  if (cursors.down.isDown) {
    player.body.velocity.y += playerSpeed;
    player.animations.play('runRight');
  }

  if (player.body.velocity.x === 0 && player.body.velocity.y === 0) {
    player.animations.stop();
    player.frame = 8;
  }

}
