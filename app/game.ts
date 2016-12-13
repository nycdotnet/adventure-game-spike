const game = new Phaser.Game(800, 600, Phaser.AUTO, 'game-area', {preload, create, update}, false, false );

let player: Phaser.Sprite;
let cursors: Phaser.CursorKeys;
let playerSpeed = 250, playerScale = 3;
let gamepadDebug: HTMLSpanElement;
let gamepads: Phaser.Gamepad;

function preload() {
    game.load.spritesheet('linkRunning', 'images/LinkRunning.gif', 24, 28);
    gamepadDebug = document.getElementById("gamepadDebug");
}

function create() {
    player = game.add.sprite(40, 100, 'linkRunning');
    player.animations.add('runRight', [0,1,2,3,4,5,6,7], 30);
    player.scale.x = playerScale;
    player.scale.y = playerScale;
    player.anchor.x = 0.5;
    player.anchor.x = 0.5;
    game.physics.enable(player, Phaser.Physics.ARCADE);

    gamepads = new Phaser.Gamepad(game);

    game.input.gamepad.addCallbacks(this, {
      onAxis: (pad: Phaser.SinglePad, axis: number, value: number) => {
        const axis0 = pad.axis(0);
        const axis1 = pad.axis(1);
        padStatus[pad.index] = `Pad ${pad.index} (${(<any>pad)._rawPad['id']}): Zero: ${axis0}, One: ${axis1}`;
        pad0mainstick = {x: axis0 || 0, y: axis1 || 0};
      } 
    })


    game.input.gamepad.start();

    cursors = game.input.keyboard.createCursorKeys();
}

var padStatus: string[] = [];
var pad0mainstick: {x: number, y: number} = undefined;


function update() {

  gamepadDebug.innerHTML = `gamepads supported: ${gamepads.supported}.  gamepads connected: ${gamepads.padsConnected}.  gamepad info: ${JSON.stringify(padStatus)}`;

  player.body.velocity.setTo(0, 0);

  if (pad0mainstick) {
    player.body.velocity.x = playerSpeed * pad0mainstick.x;
    player.body.velocity.y = playerSpeed * pad0mainstick.y;
    if (pad0mainstick.x > 0) {
      player.scale.x = playerScale;
    } else if (pad0mainstick.x < 0) {
      player.scale.x = -playerScale;
    }
    player.animations.play('runRight');
  }

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
