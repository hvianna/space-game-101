/**
 * Space Game 101
 * a bare-bones arcade game written in vanilla JavaScript (ES6+) for learning purposes
 *
 * https://github.com/hvianna/space-game-101
 * (c) 2020 Henrique Vianna / MIT Licensed
 */

class Starfield {
	constructor( originCanvas, options ) {
		// default option values
		const defaults = {
			speed  : .4,
			stars  : 200,
			maxSize: 3
		};

		// merge `options` argument with default values and
		// destructure the resulting object into local constants
		const { speed, stars, maxSize } = Object.assign( defaults, options );

		// set object properties
		this.origin = originCanvas.getContext('2d');
		this.width  = originCanvas.width;
		this.height = originCanvas.height;
		this.speed  = speed; // scroll speed in pixels per frame
		this.posY   = this.height;

		// create the canvas
		this.canvas = document.createElement('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.canvas.width = this.width;
		this.canvas.height = this.height * 2; // canvas height is doubled for seamless scrolling

		// generate a random starfield
		this.ctx.fillStyle = '#fff';
		for ( let i = 0; i < stars; i++ ) {
			let x = Math.random() * this.width | 0;
			let y = Math.random() * this.height | 0;
			let s = Math.random() * maxSize + 1 | 0;
			this.ctx.fillRect( x, y, s, s );
		}

		// duplicate the generated image vertically, for seamless scrolling
		this.ctx.drawImage( this.canvas, 0, 0, this.width, this.height, 0, this.height, this.width, this.height );
	}

	scroll() {
		// decrement the current Y coordinate and wrap around if necessary
		this.posY -= this.speed;
		if ( this.posY < 0 )
			this.posY = this.height;

		// draw the starfield over the background canvas
		this.origin.drawImage( this.canvas, 0, this.posY, this.width, this.height, 0, 0, this.width, this.height );
	}
}

class Bullet {
	constructor( canvas, posX, posY, options ) {
		// default option values
		const defaults = {
			width : 6,
			height: 12,
			speed : 4,
			color : 'red'
		};

		// merge options with defaults and destructure object into local constants
		const { width, height, speed, color } = Object.assign( defaults, options );

		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.posX = ( posX - width / 2 ) | 0;
		this.posY = posY;
		this.width = width;
		this.height = height;
		this.speed = speed;
		this.color = color;
	}

	/**
	 * Update bullet position and draws it on canvas
	 * Returns false if bullet went off-screen
	 */
	draw() {
		this.posY += this.speed;
		this.ctx.fillStyle = this.color;
		this.ctx.fillRect( this.posX, this.posY, this.width, this.height );
		return this.posY >= -this.height && this.posY <= this.canvas.height;
	}

	get hitbox() {
		return {
			left  : this.posX,
			top   : this.posY,
			right : this.posX + this.width - 1,
			bottom: this.posY + this.height - 1
		}
	}
}

class Ship {
	constructor( canvas ) {
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
	}

	moveTo( x, y ) {
		this.posX = x; // horizontal center of image
		this.posY = y; // top of image
		return this;   // return own object, so methods can be chained
	}

	reset() {
		this.bullets = [];
		this.direction = 0;
		this.frameThruster = 0;
		this.frameExplosion = 0;
		this.isExploding = false;
		this.isDead = false;
		return this;
	}

	updateBullets( hitbox, callback ) {
		// the bullets array is processed by a filter function to remove "used" bullets
		this.bullets = this.bullets.filter( bullet => {
			// check if bullet intersects the hitbox (when provided)
			if ( hitbox && intersect( bullet.hitbox, hitbox ) ) {
				callback( bullet ); // call callback function with bullet information
				return false; // remove this bullet from the array
			}
	 		// bullets that went off-screen return `false` and are removed
			return bullet.draw();
		});
	}
}

class Player extends Ship {
	constructor( canvas ) {
		super( canvas );
		this.ship = new Image();
		this.ship.src = 'assets/player-sprites.png';
		this.thruster = new Image();
		this.thruster.src = 'assets/thruster-sprites.png';
		this.explosion = new Image();
		this.explosion.src = 'assets/explosion-sprites.png';
		this.maxBullets = 3; // maximum number of concurrent bullets on screen
		this.speed = 4; // horizontal speed (pixels per frame)
		this.reset();
	}

	die() {
 		// start explosion animation
		this.frameExplosion = 0;
		this.isExploding = true;
	}

	draw() {
		if ( this.isDead )
			return;

		// update horizontal position
		this.posX += this.speed * this.direction;
		if ( this.posX > this.canvas.width )
			this.posX = this.canvas.width;
		else if ( this.posX < 0 )
			this.posX = 0;

		// increment frame of thruster animation (3 frames)
		this.frameThruster = this.frameThruster < 3 ? this.frameThruster + .5 : 0;

		let x = this.posX - 16;

		// draw ship and thruster, except on the last 2 frames of the explosion
		if ( ! this.isExploding || this.frameExplosion < 3 ) {
			this.ctx.drawImage( this.ship, 64 * this.direction + 64, 0, 64, 64, x, this.posY, 32, 32 );
			this.ctx.drawImage( this.thruster, 64 * ( this.frameThruster | 0 ), 0, 64, 64, x, this.posY + 32, 32, 32 );
		}

		// draw explosion
		if ( this.isExploding ) {
			this.frameExplosion += .25; // ~15 fps
			if ( this.frameExplosion < 5 )
				this.ctx.drawImage( this.explosion, 64 * ( this.frameExplosion | 0 ), 0, 64, 64, x, this.posY, 32, 32 );
			else {
				this.isExploding = false;
				this.isDead = true;
			}
		}

		// draw hitbox
		if ( showHitBox ) {
			let rect = this.hitbox;
			this.ctx.lineWidth = 1;
			this.ctx.strokeStyle = '#8f8';
			this.ctx.strokeRect( rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top );
		}
	}

	get hitbox() {
		return {
			left  : this.posX - 14,
			top   : this.posY + 1,
			right : this.posX + 14,
			bottom: this.posY + 29
		}
	}

	shoot() {
		// ignore if player is dead or exploding
		if ( this.isExploding || this.isDead )
			return;

		if ( this.bullets.length < this.maxBullets ) {
			const bullet = new Bullet( this.canvas, this.posX, this.posY, {
				width : 4,
				height: 20,
				speed : -8,
				color : 'gold'
			});

			this.bullets.push( bullet );
		}
	}
}

class Enemy extends Ship {
	constructor( canvas ) {
		super( canvas );
		this.img = new Image();
		this.img.src = 'assets/mother-ship.png';
		this.maxBullets = 10;
		this.reset();
	}

	draw() {
		this.ctx.drawImage( this.img, 0, 0, 144, 64, this.posX - 72, this.posY - 64, 144, 64 );

		if ( showHitBox ) {
			let rect = this.hitbox;
			this.ctx.lineWidth = 1;
			this.ctx.strokeStyle = '#8f8';
			this.ctx.strokeRect( rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top );
		}
	}

	get hitbox() {
		return {
			left  : this.posX - 56,
			top   : this.posY - 55,
			right : this.posX + 56,
			bottom: this.posY - 8
		}
	}

	shoot() {
		if ( this.bullets.length < this.maxBullets )
			this.bullets.push( new Bullet( this.canvas, this.posX, this.posY ) );
	}
}

class ScoreHint {
	constructor( canvas, bullet, value ) {
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.posX = bullet.posX;
		this.posY = bullet.posY;
		this.color = bullet.color;
		this.value = value;
		this.ttl = 60; // time to live (frames)
	}

	update() {
		const alpha = this.ttl / 60;
		this.ctx.save();
		this.ctx.font = '20px "Russo One",sans-serif';
		this.ctx.fillStyle = this.color;
		this.ctx.globalAlpha = alpha;
		this.ctx.fillText( this.value, this.posX, this.posY );
		this.ctx.restore();
		this.posY -= 4 * alpha; // progressively decrease vertical speed
		this.ttl--;
		return ( this.ttl > 0 );
	}
}

/**
 * Gameplay functions
 */

function animateBackground() {
	// clear main canvas
	background.fillStyle = '#000';
	background.fillRect( 0, 0, canvas.width, canvas.height );

	// animate parallax layers
	parallax.forEach( layer => layer.scroll() );
}

function displayScoreboard() {
	background.fillStyle = '#fff';
	background.font = '24px "Russo One",sans-serif';
	background.textAlign = 'right';
	background.fillText( score, canvas.width * .95, 50 );
}

function displayTitle() {

	if ( ! attractMode && ! player.isDead )
		return;

	let posX = canvas.width / 2;
	let posY = canvas.height * .4;

	background.fillStyle = '#999';
	background.font = 'bold 180px "Russo One",sans-serif';
	background.textAlign = 'center';

	if ( player.isDead ) {
		background.fillText( 'GAME OVER', posX, posY );
		background.fillStyle = '#fff';
		background.font = '18px "Russo One",sans-serif';
		background.fillText( 'PRESS SPACE TO RESTART', posX, canvas.height * .7 );
	}
	else {
		background.fillText( 'Space Game', posX, posY );

		background.font = 'bold 200px "Russo One",sans-serif';
		background.strokeStyle = '#000';
		background.lineWidth = 10;
		background.strokeText( '101', posX, posY + 140 );
		background.fillStyle = '#fff';
		background.fillText( '101', posX, posY + 140 );

		// 'press any key' blinks on every other second
		if ( ( time / 1000 | 0 ) % 2 ) {
			background.font = '18px "Russo One",sans-serif';
			background.fillText( 'PRESS ANY KEY TO START', posX, canvas.height * .7 );
		}
	}
}

/**
 * Detect intersection between two rectangles
 * props to https://stackoverflow.com/a/2752369/2370385
 */
function intersect( a, b ) {
	return ( a.left <= b.right  &&
	         b.left <= a.right  &&
	         a.top  <= b.bottom &&
	         b.top  <= a.bottom    );
}

function readPlayerInput( event ) {
	/* TODO:
	   - add touch support
	*/

	// during "game over" screen any keypress enters attract mode
	if ( player.isDead ) {
		if ( event.code == 'Space' && event.type == 'keyup' ) {
			player.reset().moveTo( canvas.width / 2, canvas.height * .75 );
			attractMode = true;
		}
		return;
	}

	// during attract mode any keypress starts the game
	if ( attractMode && event.type == 'keyup' ) {
		resetGame();
		return;
	}

	// set direction on key pressed; stop movement on key released
	if ( event.code == 'ArrowLeft' || event.code == 'ArrowRight' )
		player.direction = ( event.type == 'keydown' && ( event.code == 'ArrowLeft' ) * -1 + ( event.code == 'ArrowRight' ) ) | 0;

	// fire on space bar released
	if ( event.code == 'Space' && event.type == 'keyup' )
		player.shoot();
}

function updatePlayer() {
	// emulate player controls during attract mode
	if ( attractMode ) {
		if ( Math.random() > .9 )
			player.direction = ( Math.random() * 3 | 0 ) - 1;

		// fire randomly
		if ( Math.random() > .96 )
			player.shoot();
	}

	player.draw();

	// update player bullets
	player.updateBullets( attractMode ? null : enemy.hitbox, ( bullet ) => {
		score += 10;
		scoredPoints.push( new ScoreHint( canvas, bullet, 10 ) );
	});

	// update visual score hints
	scoredPoints = scoredPoints.filter( item => item.update() );
}

function updateEnemy() {
	/* TODO:
	   - improve enemy movement logic
	*/
	let rangeX = canvas.width / 2;
	let rangeY = 50;

	// use the timestamp and some trigonometry to create a cyclic ∞-shaped movement path
	let angle = time / 1000 % ( Math.PI * 2 );
	let posX = rangeX + Math.cos( angle ) * rangeX;
	let posY = canvas.height * .3 + Math.sin( angle*2 ) * rangeY;

	// update enemy's position and display it
	enemy.moveTo( posX, posY ).draw();

	// fire new bullet randomly
	if ( Math.random() > .96 && ! player.isDead )
		enemy.shoot();

	// update enemy bullets
	// check collisions with the player ship when not in attract mode
	enemy.updateBullets( attractMode ? null : player.hitbox, () => player.die() );
}

function gameLoop() {
	// get current timestamp
	time = performance.now();

	animateBackground();
	displayTitle();
	displayScoreboard();
	updatePlayer();
	updateEnemy();

	// schedule next animation frame
	window.requestAnimationFrame( gameLoop );
}

function resetGame() {
	score = 0;
	enemy.reset();
	player.reset().moveTo( canvas.width / 2, canvas.height * .75 );
	attractMode = false;
}

/**
 * Initialization
 */

// globals

const canvas     = document.getElementById('canvas');
const background = canvas.getContext('2d');

canvas.width  = 1280;
canvas.height = 800;

const parallax = [
	new Starfield( canvas, { stars: 80, speed: 1, maxSize: 4 } ),
	new Starfield( canvas ),
	new Starfield( canvas, { stars: 300, speed: .1, maxSize: 2 } ),
];

const player = new Player( canvas ).moveTo( canvas.width / 2, canvas.height * .75 );
const enemy  = new Enemy( canvas ).moveTo( canvas.width / 2, canvas.height * .2 );

let time;

let score = 0;
let scoredPoints = [];

let showHitBox = false; // set to `true` to visualize the hitboxes used for collision detection

// listen for keyboard events

window.addEventListener( 'keydown', readPlayerInput );
window.addEventListener( 'keyup', readPlayerInput );

// set "attract" mode

let attractMode = true;

// start game loop

window.requestAnimationFrame( gameLoop );
