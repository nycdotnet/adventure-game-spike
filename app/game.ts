
const game = new Phaser.Game(800, 600, Phaser.AUTO, 'game-area', {preload, create, update, render}, false, false );

let player: Phaser.Sprite;
let cursors: Phaser.CursorKeys;
let playerSpeed = 250, playerScale = 3;
let gamepadDebug: HTMLSpanElement;
let gamepads: Phaser.Gamepad;
let weapon: Phaser.Weapon;
//let weaponYOffset: number;
let grunts: Phaser.Group;
let padStatus: string[] = [];
let pad0mainstick: {x: number, y: number} = undefined;
let pad0secondstick: {x: number, y: number} = undefined;
let scoreText: Phaser.Text;

function preload() {
    game.load.spritesheet('linkRunning', 'images/LinkRunning.png', 24, 28);
    game.load.spritesheet('arrow', 'images/Arrow.png', 20, 20);
    game.load.image('bullet', 'images/bullet.png');
    game.load.image('grunt', 'images/grunt.png');
    gamepadDebug = document.getElementById("gamepadDebug");
}


function create() {

    player = game.add.sprite(40, 100, 'linkRunning');
    player.animations.add('runRight', [0,1,2,3,4,5,6,7], 30);
    player.scale.setTo(playerScale, playerScale);
    player.anchor.setTo(0.5, 0.5);
    game.physics.enable(player, Phaser.Physics.ARCADE);

    weapon = game.add.weapon(30, 'arrow', 5);
    weapon.bullets.forEach((b : Phaser.Bullet) => {
      b.animations.add("arrowHit", [0,1,2,3,4], 30, false);
      b.scale.setTo(playerScale, playerScale);
      b.body.updateBounds();
    }, this);
    weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
    weapon.bulletSpeed = 700;
    weapon.fireRate = 120;
    weapon.trackSprite(player);

    player.bringToTop();

    grunts = game.add.group();
    grunts.enableBody = true;
    grunts.physicsBodyType = Phaser.Physics.ARCADE;

    addGrunts();

    var style = { font: "12px Arial", fill: "#ffffff", align: "left" };
    scoreText = game.add.text(10, 10, "", style);

    gamepads = new Phaser.Gamepad(game);

    game.input.gamepad.addCallbacks(this, {
      onAxis: (pad: Phaser.SinglePad, axis: number, value: number) => {
        const axis0 = pad.axis(0);
        const axis1 = pad.axis(1);
        const axis2 = pad.axis(2);
        const axis3 = pad.axis(3);
        padStatus[pad.index] = `Pad ${pad.index} (${(<any>pad)._rawPad['id']}): Zero: ${axis0}, One: ${axis1}, Two: ${axis2}, Three: ${axis3}`;
        if (pad0mainstick == undefined) {
          pad0mainstick = {x: axis0 || 0, y: axis1 || 0};
        } else {
          pad0mainstick.x = axis0 || 0;
          pad0mainstick.y = axis1 || 0;
        }
        if (pad0secondstick == undefined) {
          pad0secondstick = {x: axis2 || 0, y: axis3 || 0};
        } else {
          pad0secondstick.x = axis2 || 0;
          pad0secondstick.y = axis3 || 0;
        }
      },
      onConnect: (pad) => {
        const result = [];
        if (gamepads.pad1.connected || pad === 0) {
          result.push("Pad 1 connected.");
        }
        if (gamepads.pad2.connected || pad === 1) {
          result.push("Pad 2 connected.");
        }
        if (gamepads.pad3.connected || pad === 2) {
          result.push("Pad 3 connected.");
        }
        if (gamepads.pad4.connected || pad === 3) {
          result.push("Pad 4 connected.");
        }

        scoreText.text = result.join("  ");
      },
      onDisconnect: (pad) => {
        const result = [];
        if (gamepads.pad1.connected && pad !== 0) {
          result.push("Pad 1 connected.");
        }
        if (gamepads.pad2.connected && pad !== 1) {
          result.push("Pad 2 connected.");
        }
        if (gamepads.pad3.connected && pad !== 2) {
          result.push("Pad 3 connected.");
        }
        if (gamepads.pad4.connected && pad !== 3) {
          result.push("Pad 4 connected.");
        }

        scoreText.text = result.join("  ");
      }
    });


    game.input.gamepad.start();

    cursors = game.input.keyboard.createCursorKeys();
}

function addGrunts(count: number = 10) {

    // this part is not currently working.
    var playerbounds = player.getBounds();
    playerbounds.x -= (playerbounds.width * 0.5);
    playerbounds.y -= (playerbounds.height * 0.5);
    playerbounds.height *= 2;
    playerbounds.width *= 2;
    
    var five_percent_x_in_pixels = Math.floor(game.width * 0.05);
    var five_percent_y_in_pixels = Math.floor(game.height * 0.05);

    for (let i = 0; i < count; i += 1) {
      do {
        var x = game.world.randomX;
        var y = game.world.randomY;

      } while (playerbounds.contains(x, y) || x < five_percent_x_in_pixels || x > (game.width - five_percent_x_in_pixels) || y < five_percent_y_in_pixels || y > (game.height - five_percent_y_in_pixels))

      var grunt = grunts.create(x, y, 'grunt');
      grunt.anchor.setTo(0.5, 0.5);
    }

}

function render() {
   game.debug.body(player);
   grunts.forEach((grunt: Phaser.Sprite) => { game.debug.body(grunt)}, this);
   weapon.bullets.forEach((arrow: Phaser.Sprite) => { game.debug.body(arrow)}, this);
}

function update() {
  if (gamepads) {
    gamepadDebug.innerHTML = `gamepads supported: ${gamepads.supported}.  gamepads connected: ${gamepads.padsConnected}.  gamepad info: ${JSON.stringify(padStatus)}`;
  }
  
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

  if (pad0secondstick) {
    if (pad0secondstick.x !== 0 || pad0secondstick.y !== 0) {
      //weapon.fireFrom.centerOn(player.worldPosition.x, player.worldPosition.y);
      weapon.fireAtXY(player.centerX + pad0secondstick.x, player.centerY + pad0secondstick.y);
    }
  }

  if (cursors) {
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
  }

  if (player.body.velocity.x === 0 && player.body.velocity.y === 0) {
    player.animations.stop();
    player.frame = 8;
  }

  if (weapon && weapon.bullets) {
    game.physics.arcade.overlap(weapon.bullets, grunts, killGrunt, null, this);
  }

}

function killGrunt(arrow: Phaser.Bullet, grunt: Phaser.Sprite) {
  arrow.position.x -= arrow.body.velocity.x / 100; 
  arrow.position.y -=  arrow.body.velocity.y / 100;
  arrow.body.velocity.x = 0;
  arrow.body.velocity.y = 0;
  arrow.play("arrowHit", 10, false, true);
  grunt.kill();

  if (grunts.countLiving() === 0) {
    addGrunts();
  }
}