let gameWidth = 800;
let gameHeight = 600;

const game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, 'game-area', {preload, create, update, render}, false, false );

let player: Phaser.Sprite;
let cursors: Phaser.CursorKeys;
let playerSpeed = 250, playerScale = 3;
let gamepadDebug: HTMLSpanElement;
let gamepads: Phaser.Gamepad;
let weapon: Phaser.Weapon;
let grunts: Phaser.Group;
let padStatus: string[] = [];
let pad0mainstick: {x: number, y: number} = undefined;
let pad0secondstick: {x: number, y: number} = undefined;
let scoreText: Phaser.Text;

function preload() {
    game.load.spritesheet('linkRunning', 'images/LinkRunning.png', 24, 28);
    game.load.spritesheet('arrow', 'images/Arrow.png', 20, 9);
    game.load.image('grunt', 'images/grunt.png');
    gamepadDebug = document.getElementById("gamepadDebug");
}


function create() {

    player = game.add.sprite(0, 0, 'linkRunning');
    player.animations.add('runRight', [0,1,2,3,4,5,6,7], 30);
    player.scale.setTo(playerScale, playerScale);
    player.anchor.setTo(0.5, 0.5);
    game.physics.enable(player, Phaser.Physics.ARCADE);

    weapon = game.add.weapon(30, 'arrow', 5);
    weapon.bullets.forEach((b : Phaser.Bullet) => {
      const body = b.body as Phaser.Physics.Arcade.Body;
      b.animations.add("arrowHit", [0,1,2,3,4], 30, false);
      b.scale.setTo(playerScale, playerScale);
      body.updateBounds();
    }, this);

    weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
    weapon.bulletSpeed = 700;
    weapon.fireRate = 120;
    weapon.trackSprite(player);
    weapon.onFire.add((b: Phaser.Bullet) => {
      b.frame = 5;
      // trying to get the hitbox to not be wide when firing up or down.
      // this can be improved in the future with some trigonometry.
      // see here: http://www.html5gamedevs.com/topic/27095-bullet-scaling/
      const body = b.body as Phaser.Physics.Arcade.Body;
      const rotationInRadians = Math.abs(b.rotation);
      if (rotationInRadians > 0.78 && rotationInRadians < 2.3) {
        body.setSize(9, 9, 5, 0);
      } else {
        body.setSize(20, 9, 0, 0);
      }
    });

    player.bringToTop();

    grunts = game.add.group();
    grunts.enableBody = true;
    grunts.physicsBodyType = Phaser.Physics.ARCADE;

    newLevel();

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

function movePlayerToCenter() {
    player.x = gameWidth / 2;
    player.y = gameHeight / 2;
}

function newLevel(gruntCount: number = 10) {

    movePlayerToCenter();

    // Enemy boxes: the screen is divided up into four boxes that do not overlap each other or the player,
    //  with a slight margin from the edge and the player.
    // box 0 is the upper-left of the game area including above the player.
    // box 1 is the upper-right of the game area including to the right of the player.
    // box 2 is the lower-right of the game area including below the player.
    // box 3 is the lower-left of the game area including to the left of the player.
    
    const cheesyDifficultyRatio = 1.8; // the higher this ratio, the further the monsters will spawn from the player.
    const playerBounds = player.getBounds();
    const enemyBox0and2Width = (gameWidth / 2) + (playerBounds.width / 2 * playerScale * cheesyDifficultyRatio);
    const enemyBox1and3Width = gameWidth - enemyBox0and2Width;
    const enemyBox0and2Height = (gameHeight / 2) - (playerBounds.height / 2 * playerScale * cheesyDifficultyRatio);
    const enemyBox1and3Height = gameHeight - enemyBox0and2Height;

    const g = game.add.graphics(0,0),
      enemyBoxes: PIXI.Rectangle[] = Array(3),
      xMargin = Math.floor(game.width * 0.05),
      yMargin = Math.floor(game.height * 0.05);

    enemyBoxes[0] = new PIXI.Rectangle(0,0, enemyBox0and2Width, enemyBox0and2Height);
    enemyBoxes[1] = new PIXI.Rectangle(enemyBox0and2Width, 0, enemyBox1and3Width, enemyBox1and3Height);
    enemyBoxes[2] = new PIXI.Rectangle(gameWidth - enemyBox0and2Width, gameHeight - enemyBox0and2Height, enemyBox0and2Width, enemyBox0and2Height);
    enemyBoxes[3] = new PIXI.Rectangle(0, gameHeight - enemyBox1and3Height, enemyBox1and3Width, enemyBox1and3Height);

    g.lineStyle(2, 0x0000FF, 1);
    g.drawShape(enemyBoxes[0]);
        
    g.lineStyle(2, 0x00FF00, 1);
    g.drawShape(enemyBoxes[1]);

    g.lineStyle(2, 0xFF0000, 1);
    g.drawShape(enemyBoxes[2]);

    g.lineStyle(2, 0xFF00FF, 1);
    g.drawShape(enemyBoxes[3]);
    
    for (let i = 0; i < gruntCount; i += 1) {
      const enemyBox = enemyBoxes[i % 4],
      x = game.rnd.integerInRange(enemyBox.x, enemyBox.x + enemyBox.width),
      y = game.rnd.integerInRange(enemyBox.y, enemyBox.y + enemyBox.height),
      grunt = grunts.create(x, y, 'grunt');

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
      weapon.fireAtXY(player.centerX + (pad0secondstick.x * 10), player.centerY + (pad0secondstick.y * 10));
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
  if (arrow.alive && grunt.alive) {
    arrow.body.velocity.x = 0;
    arrow.body.velocity.y = 0;
    arrow.play("arrowHit", 10, false, true);
    grunt.kill();
  }

  if (grunts.countLiving() === 0) {
    newLevel();
  }
}