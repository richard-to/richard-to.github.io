const LEVEL_HEIGHT = 3900;
const LEVEL_WIDTH = 2600;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1420,
  height: 800,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
});

var player;

function preload() {
  this.load.image('sky', 'assets/sky.png');
  this.load.image('tiles', 'assets/platforms.png');
  this.load.tilemapTiledJSON('map', 'assets/level-1.json');
  this.load.multiatlas('redGuy', 'assets/redGuy.json', 'assets');
}

function create() {
  this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
  this.add.sprite(LEVEL_WIDTH / 2, LEVEL_HEIGHT / 2, 'sky').setDisplaySize(LEVEL_WIDTH, LEVEL_HEIGHT);

  const levelMap = this.make.tilemap({ key: 'map' });
  const tiles = levelMap.addTilesetImage('platforms', 'tiles');
  const worldLayer = levelMap.createDynamicLayer('Level 1', tiles);
  worldLayer.setCollisionByProperty({ collides: true });

  player = this.physics.add.sprite(64, 3400, 'redGuy', 'c5.png');
  player.setBounce(0.2);
  player.body.setGravityY(300);
  player.setCollideWorldBounds(false);

  this.cameras.main.startFollow(player, true);
  this.cameras.main.setZoom(0.75);

  this.physics.add.collider(player, worldLayer);

  const frameNames = [
    { key: 'redGuy', frame: 'c5.png' },
    { key: 'redGuy', frame: 'c1.png' },
    { key: 'redGuy', frame: 'c2.png' },
    { key: 'redGuy', frame: 'c3.png' },
    { key: 'redGuy', frame: 'c4.png' },
    { key: 'redGuy', frame: 'c5.png' },
  ]
  this.anims.create({ key: 'walk', frames: frameNames, frameRate: 20 });
}

function update() {
  cursors = this.input.keyboard.createCursorKeys();
  if (cursors.left.isDown) {
    player.setFlipX(true);
    player.setVelocityX(-200);
    player.anims.play('walk', true);

  }
  else if (cursors.right.isDown) {
    player.setFlipX(false);
    player.setVelocityX(200);
    player.anims.play('walk', true);
  }
  else {
    player.setVelocityX(0);
  }

  if (cursors.up.isDown && player.body.blocked.down) {
    player.setVelocityY(-730);
  }
}
