
class Starfield {
	constructor( width, height, options = {} ) {
		// set object properties
		this.width  = width;
		this.height = height;
		this.speed  = options.speed || .1; // scroll speed in pixels per frame
		this.posY   = height;

		// create the canvas
		this.canvas = document.createElement('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.canvas.width = this.width;
		this.canvas.height = this.height * 2; // canvas height is doubled for seamless scrolling

		// generate a random starfield

		let stars   = options.stars || 200;
		let maxSize = options.maxSize || 3;

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

	scroll( context ) {
		// decrement the current Y coordinate and wrap around if necessary
		this.posY -= this.speed;
		if ( this.posY < 0 )
			this.posY = this.height;

		// draw the starfield over the background canvas
		context.drawImage( this.canvas, 0, this.posY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height );
	}
}

class Shot {
	constructor( posX, posY, width, height, speed, color ) {
		this.posX = ( posX - width / 2 ) | 0;
		this.posY = posY - ( speed < 0 ? height : -height );
		this.width = width;
		this.height = height;
		this.speed = speed;
		this.color = color;
	}

	/**
	 * Update shot position and draws it on canvas
	 * Returns false if shot went off-screen
	 */
	draw( canvas, context ) {
		this.posY += this.speed;
		context.fillStyle = this.color;
		context.fillRect( this.posX, this.posY, this.width, this.height );
		return this.posY >= -this.height && this.posY <= canvas.height;
	}
}

class Player {
	constructor( posX, posY ) {
		this.ship = new Image();
		this.ship.src = 'assets/player-sprites.png';
		this.thruster = new Image();
		this.thruster.src = 'assets/thruster-sprites.png';
		this.maxBullets = 3; // maximum number of concurrent bullets on screen
		this.speed = 2; // horizontal speed (pixels per frame)
		this.reset( posX, posY );
	}

	addShot() {
		if ( this.shots.length < this.maxBullets )
			this.shots.push( new Shot( this.posX, this.posY, 4, 20, -4, '#ff0' ) );
	}

	draw( canvas, context ) {
		// update horizontal position
		this.posX += this.speed * this.direction;
		if ( this.posX > canvas.width )
			this.posX = canvas.width;
		else if ( this.posX < 0 )
			this.posX = 0;

		if ( this.frame < 6 )
			this.frame++;
		else
			this.frame = 0;
		let i = this.frame / 2 | 0;

		// draw ship and thruster
		context.drawImage( this.ship, 64 * this.direction + 64, 0, 64, 64, this.posX - 16, this.posY, 32, 32 );
		context.drawImage( this.thruster, 64 * i, 0, 64, 64, this.posX - 16, this.posY + 32, 32, 32 );
	}

	move( x, y ) {
		this.posX = x;
		this.posY = y;
	}

	reset( posX, posY ) {
		this.posX = posX; // horizontal center of image
		this.posY = posY; // top of image
		this.shots = [];
		this.frame = 0;
		this.direction = 0;
	}
}

class Enemy {
	constructor( posX, posY ) {
		this.posX = posX; // horizontal center of image
		this.posY = posY; // bottom of image
		this.img = new Image();
		this.img.src = 'assets/mother-ship.png';
		this.shots = [];
		this.maxBullets = 10;
	}

	addShot() {
		if ( this.shots.length < this.maxBullets )
			this.shots.push( new Shot( this.posX, this.posY, 6, 12, 2, '#f00' ) );
	}

	draw( context ) {
		context.drawImage( this.img, 0, 0, 144, 64, this.posX - 72, this.posY - 64, 144, 64 );
	}

	move( x, y ) {
		this.posX = x;
		this.posY = y;
	}
}


function animateBackground() {
	// clear main canvas
	background.fillStyle = '#000';
	background.fillRect( 0, 0, canvas.width, canvas.height );

	// animate parallax layers
	parallax.forEach( layer => layer.scroll( background ) );
}

function drawTitle() {

	if ( ! attractMode )
		return;

	let posX = canvas.width / 2;
	let posY = canvas.height * .4;

	background.save();
	background.fillStyle = '#999';
	background.font = 'bold 180px "Russo One",sans-serif';
	background.textAlign = 'center';
	background.fillText( 'Space Game', posX, posY  );

	background.fillStyle = '#fff';
	background.font = 'bold 200px "Russo One",sans-serif';
	background.fillText( '101', posX, posY + 130 );
	background.strokeStyle = '#000';
	background.lineWidth = 6;
	background.strokeText( '101', posX, posY + 130 );

	// 'insert coin' blinks on every other second
	if ( ( time / 1000 | 0 ) % 2 ) {
		background.font = '18px "Russo One",sans-serif';
		background.fillText( 'PRESS ANY KEY TO START', posX, canvas.height * .7 );
	}

	background.restore();
}

function readPlayerInput( event ) {
	/* TODO:
	   - add touch support
	*/
	// reset player and exit attract mode on keypress
	if ( attractMode && event.type == 'keyup' ) {
		player.reset( canvas.width / 2, canvas.height * .75 );
		attractMode = false;
		return;
	}

	// set direction on key pressed; stop movement on key released
	if ( event.code == 'ArrowLeft' || event.code == 'ArrowRight' )
		player.direction = ( event.type == 'keydown' && ( event.code == 'ArrowLeft' ) * -1 + ( event.code == 'ArrowRight' ) ) | 0;

	// fire
	if ( event.code == 'Space' && event.type == 'keyup' )
		player.addShot();
}

function updatePlayer() {
	/* TODO:
	   - move player coordinates
	   - check collisions
	*/

	// emulate player controls while in attract mode
	if ( attractMode ) {
		if ( Math.random() > .9 )
			player.direction = ( Math.random() * 3 | 0 ) - 1;

		// fire randomly
		if ( Math.random() > .96 )
			player.addShot();
	}

	player.draw( canvas, background );

	// draw shots and remove those that went off-screen
	player.shots = player.shots.filter( shot => {
		return shot.draw( canvas, background );
	});
}

function updateEnemy() {
	/* TODO:
	   - improve enemy movement logic
	   - check collisions
	*/
	let rangeX = canvas.width / 2;
	let rangeY = 50;

	// use the timestamp and some trigonometry to create a cyclic ∞-shaped movement path
	let angle = time / 1000 % ( Math.PI * 2 );
	let posX = rangeX + Math.cos( angle ) * rangeX;
	let posY = canvas.height * .3 + Math.sin( angle*2 ) * rangeY;

	// update enemy's position and display it
	enemy.move( posX, posY );
	enemy.draw( background );

	// add a new shot randomly
	if ( Math.random() > .96 )
		enemy.addShot();

	// draw shots and remove those that went off-screen
	enemy.shots = enemy.shots.filter( shot => {
		return shot.draw( canvas, background );
	});

}

function gameLoop() {

	// get current timestamp
	time = performance.now();

	animateBackground();
	drawTitle();
	updatePlayer();
	updateEnemy();

	// schedule next animation frame
	window.requestAnimationFrame( gameLoop );

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
	new Starfield( canvas.width, canvas.height, { stars: 80, speed: .6, maxSize: 4 } ),
	new Starfield( canvas.width, canvas.height, { speed: .2 } ),
	new Starfield( canvas.width, canvas.height, { stars: 300, speed: .05, maxSize: 2 } ),
];

const player = new Player( canvas.width / 2, canvas.height * .75 );
const enemy  = new Enemy( canvas.width / 2, canvas.height * .2 );

let time;

// listen for keyboard events

window.addEventListener( 'keydown', readPlayerInput );
window.addEventListener( 'keyup', readPlayerInput );

// set "attract" mode

let attractMode = true;

// start game loop

window.requestAnimationFrame( gameLoop );
