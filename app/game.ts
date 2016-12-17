let gameWidth = 800;
let gameHeight = 600;

function startPlaying() {}
function startMenu() {}
startPlaying.prototype = {
};
startMenu.prototype = {
  preload: function() {
    game.parent = document.getElementById('game-area');
    game.load.spritesheet('linkRunning', 'images/LinkRunning.png', 24, 28);
    game.load.spritesheet('arrow', 'images/Arrow.png', 20, 9);
    game.load.image('grunt', 'images/grunt.png');
    setupGamepadSupport();
    cursors = game.input.keyboard.createCursorKeys();
  },
  create: function() {
    gameStartText = game.add.text(0, 0, "Press a button on your gamepad to begin.\nMove with the left stick, fire in 360° with the right stick.",
      {font: "20px Arial", fill: "#ffffff", boundsAlignH: "center", boundsAlignV: "middle"});
    gameStartText.setTextBounds(0, 0, gameWidth, gameHeight);
  }
};

const game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, 'game-area'); //, {preload, create, update, render}, false, false 
game.state.add("playing", startPlaying, false);
game.state.add("menu", startMenu, false);
game.state.start("menu");

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
let gamepadText: Phaser.Text;
let scoreText: Phaser.Text;
let gameStartText: Phaser.Text;
let gameOverText: Phaser.Text;
const freeHeartEveryPoints = 35000;
let level = 0, score = 0, nextFreeHeart = freeHeartEveryPoints;


function create() {

    player = game.add.sprite(0, 0, 'linkRunning');
    player.animations.add('runRight', [0,1,2,3,4,5,6,7], 30);
    player.scale.setTo(playerScale, playerScale);
    player.anchor.setTo(0.5, 0.5);
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.updateBounds();
    player.health = 3;

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

    const plainWhiteTextStyle = { font: "12px Arial", fill: "#ffffff", align: "left" };
    gamepadText = game.add.text(10, 10, "", plainWhiteTextStyle);
    scoreText = game.add.text(gameWidth / 2, 10, "", plainWhiteTextStyle);
    gameOverText = game.add.text(0, 0, "GAME OVER", {font: "48px Arial", fill: "#ffffff", boundsAlignH: "center", boundsAlignV: "middle"});
    gameOverText.setTextBounds(0, 0, gameWidth, gameHeight);
    gameOverText.visible = false;

}

function movePlayerToCenter() {
    player.x = gameWidth / 2;
    player.y = gameHeight / 2;
}

function newLevel() {
    player.data.immune = true;
    movePlayerToCenter();
    weapon.killAll();
    level += 1;

    const gruntCount = level + 9;

    // Enemy boxes: the screen is divided up into four boxes that do not overlap each other or the player,
    //  with a slight margin from the edge and the player.
    // box 0 is the upper-left of the game area including above the player.
    // box 1 is the upper-right of the game area including to the right of the player.
    // box 2 is the lower-right of the game area including below the player.
    // box 3 is the lower-left of the game area including to the left of the player.
    
    const playerWidth = 24, playerHeight = 28;

    const cheesyPreventionRatio = 3,   // the higher this ratio, the further the monsters will spawn from the player.
      xMargin = Math.floor(game.width * 0.02),
      yMargin = Math.floor(game.height * 0.02),
      enemyBox0and2Width = (gameWidth / 2) + (playerWidth / 2 * playerScale * cheesyPreventionRatio) - xMargin,
      enemyBox1and3Width = gameWidth - enemyBox0and2Width - (xMargin * 2),
      enemyBox0and2Height = (gameHeight / 2) - (playerHeight / 2 * playerScale * cheesyPreventionRatio) - yMargin,
      enemyBox1and3Height = gameHeight - enemyBox0and2Height - (yMargin * 2);

    const enemyBoxes: PIXI.Rectangle[] = [
      new PIXI.Rectangle(xMargin, yMargin, enemyBox0and2Width, enemyBox0and2Height),
      new PIXI.Rectangle(enemyBox0and2Width + xMargin, yMargin, enemyBox1and3Width, enemyBox1and3Height),
      new PIXI.Rectangle(gameWidth - enemyBox0and2Width - xMargin, gameHeight - enemyBox0and2Height - yMargin, enemyBox0and2Width, enemyBox0and2Height),
      new PIXI.Rectangle(xMargin, gameHeight - enemyBox1and3Height - yMargin, enemyBox1and3Width, enemyBox1and3Height)
    ];

    //drawEnemyBoxesDebug(enemyBoxes);

    function randomCoordsInEnemyBox(boxIndex: number) {
      const enemyBox = enemyBoxes[boxIndex];
      return {
        x: game.rnd.integerInRange(enemyBox.x, enemyBox.x + enemyBox.width),
        y: game.rnd.integerInRange(enemyBox.y, enemyBox.y + enemyBox.height)
      };
    }

    while (grunts.length < gruntCount) {
      const coords = randomCoordsInEnemyBox(grunts.length % 4),
        grunt = grunts.create(coords.x, coords.y, 'grunt');
        grunt.anchor.setTo(0.5, 0.5);
        grunt.scale.set(1.2, 1.2);
    }

    for (let i = 0; i < grunts.children.length; i += 1) {
      const coords = randomCoordsInEnemyBox(i % 4),
        grunt: Phaser.Sprite = grunts.children[i] as Phaser.Sprite;
        grunt.body.position.setTo(coords.x, coords.y);
        grunt.revive();
    }

    player.data.immune = false;
 
}

function render() {
   //game.debug.body(player);
   //grunts.forEach((grunt: Phaser.Sprite) => { game.debug.body(grunt)}, this);
   //weapon.bullets.forEach((arrow: Phaser.Sprite) => { game.debug.body(arrow)}, this);
}

function update() {
  if (gamepads) {
    gamepadDebug.innerHTML = `${gamepads.supported ? "Your browser indicates that gamepads are supported" : "Your browser does not support the gamepad API"}.  Gamepads connected: ${gamepads.padsConnected}.  gamepad info: ${JSON.stringify(padStatus)}`;
  }

  if (player.data.immune) {
    player.data.immuneFrameCount += 1;
    if (player.data.immuneFrameCount === 3) {
      player.data.immuneFrameCount = 0;
      if (player.tint === 0xFF0000) {
        player.tint = 0x00FF00;
      } else if (player.tint === 0x00FF00) {
        player.tint = 0x0000FF;
      } else {
        player.tint = 0xFF0000;
      }
    }
  }

  scoreText.text = `Hearts: ${player.health} - Level ${level} - Score: ${score}`;
  
  player.body.velocity.setTo(0, 0);

  handleGamepadInput();
  //handleKeyboardInput();

  if (player.body.velocity.x === 0 && player.body.velocity.y === 0) {
    player.animations.stop();
    player.frame = 8;
  }

  for (let i = 0; i < grunts.children.length; i += 1) {
    if (pad0mainstick != undefined) {
      game.physics.arcade.moveToObject(grunts.children[i], player, 20 + (level * 1.2));
    } else {
      game.physics.arcade.moveToObject(grunts.children[i], player, 0);
    }
  }

  if (grunts) {
    game.physics.arcade.overlap(grunts, player, damagePlayer, null, this);
  }

  if (weapon && weapon.bullets) {
    game.physics.arcade.overlap(weapon.bullets, grunts, killGrunt, null, this);
  }


}

function damagePlayer(player: Phaser.Sprite, grunt: Phaser.Sprite) {
  if (player.alive && grunt.alive && !player.data.immune) {
    player.damage(1);
    if (player.alive) {
      player.data.immune = true;
      player.data.immuneFrameCount = 0;
      player.tint = 0xFF0000;
      game.time.events.add(Phaser.Timer.SECOND, () => {
        player.data.immune = false;
        player.data.immuneFrameCount = 0;
        player.tint = 0xFFFFFF;
      }, this);
    } else {
      movePlayerToCenter();
      gameOverText.visible = true;
    }
  }
}

function killGrunt(arrow: Phaser.Bullet, grunt: Phaser.Sprite) {
  if (arrow.alive && grunt.alive) {
    arrow.body.velocity.x = 0;
    arrow.body.velocity.y = 0;
    arrow.play("arrowHit", 10, false, true);
    grunt.kill();
    scorePoints(100);
  }

  if (grunts.countLiving() === 0) {
    newLevel();
  }
}

function scorePoints(points: number) {
  score += points;
  if (score >= nextFreeHeart) {
    nextFreeHeart += freeHeartEveryPoints;
    player.heal(1);
  }
}

function drawEnemyBoxesDebug(enemyBoxes: PIXI.Rectangle[]) {
    const g = game.add.graphics(0,0);
    g.lineStyle(2, 0x0000FF, 1);
    g.drawShape(enemyBoxes[0]);
        
    g.lineStyle(2, 0x00FF00, 1);
    g.drawShape(enemyBoxes[1]);

    g.lineStyle(2, 0xFF0000, 1);
    g.drawShape(enemyBoxes[2]);

    g.lineStyle(2, 0xFF00FF, 1);
    g.drawShape(enemyBoxes[3]);
  }

function handleKeyboardInput() {
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
}

  function handleGamepadInput() {
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
  }

  function setupGamepadSupport() {
    gamepads = new Phaser.Gamepad(game);

    gamepadDebug = document.getElementById("gamepadDebug");

    if (!gamepads.supported) {
      gameStartText.text = "Sorry - Gamepad API support is not implemented in this browser!\nPlease Try Edge, Chrome, or Firefox.";
    }

    game.input.gamepad.addCallbacks(this, {
      onAxis: (pad: Phaser.SinglePad, axis: number, value: number) => {
        const axis0 = pad.axis(0);
        const axis1 = pad.axis(1);
        const axis2 = pad.axis(2);
        const axis3 = pad.axis(3);
        padStatus[pad.index] = `Pad ${pad.index} (${(<any>pad)._rawPad['id']}): Zero: ${axis0}, One: ${axis1}, Two: ${axis2}, Three: ${axis3}`;
        if (pad0mainstick == undefined) {
          gameStartText.visible = false;
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

        gamepadText.text = result.join("  ");
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

        gamepadText.text = result.join("  ");
      }
    });

    game.input.gamepad.start();
}
