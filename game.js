
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

class Player {
	constructor( posX, posY ) {
		this.posX = posX; // horizontal center of image
		this.posY = posY; // top of image
		this.img = new Image();
		this.img.src = 'assets/player.png';
	}

	draw( context ) {
		context.drawImage( this.img, this.posX - this.img.width / 2, this.posY );
	}
}

class Enemy {
	constructor( posX, posY ) {
		this.posX = posX; // horizontal center of image
		this.posY = posY; // bottom of image
		this.img = new Image();
		this.img.src = 'assets/enemy.png';
	}

	draw( context ) {
		context.drawImage( this.img, this.posX - this.img.width / 2, this.posY - this.img.height );
	}
}


function animateBackground() {
	// clear main canvas
	background.fillStyle = '#000';
	background.fillRect( 0, 0, canvasBg.width, canvasBg.height );

	// animate parallax layers
	parallax.forEach( layer => layer.scroll( background ) );
}

function drawTitle() {

	if ( ! attractMode )
		return;

	let posX = canvas.width / 2;
	let posY = canvas.height * .4;

	background.save();
	background.fillStyle = '#fff';
	background.font = '180px impact,sans-serif';
	background.textAlign = 'center';
	background.fillText( 'Space Game', posX, posY  );

	background.font = 'bold 200px impact,sans-serif';
	background.fillText( '101', posX, posY + 150 );
	background.strokeStyle = '#000';
	background.lineWidth = 6;
	background.strokeText( '101', posX, posY + 150 );

	// 'insert coin' blinks on every other second
	if ( ( performance.now() / 1000 | 0 ) % 2 ) {
		background.font = '20px sans-serif';
		background.fillText( 'I N S E R T   C O I N', posX, canvas.height * .7 );
	}

	background.restore();
}

function readPlayerInput() {
	/* TODO:
	   - read player input (keyboard, mouse, touch)
	*/
}

function updatePlayer() {
	/* TODO:
	   - move player coordinates
	   - add / update shots
	   - check collisions
	*/
	player.draw( background );
}

function updateEnemy() {
	/* TODO:
	   - logic for enemy movement
	   - add / update shots
	   - check collisions
	*/
	enemy.draw( background );
}

function gameLoop() {

	animateBackground();
	readPlayerInput();
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

let canvasBg   = document.getElementById('canvas');
let	background = canvasBg.getContext('2d');

canvasBg.width = 1280;
canvasBg.height = 800;

let	parallax = [
		new Starfield( canvasBg.width, canvasBg.height, { stars: 80, speed: .6, maxSize: 4 } ),
		new Starfield( canvasBg.width, canvasBg.height, { speed: .2 } ),
		new Starfield( canvasBg.width, canvasBg.height, { stars: 300, speed: .05, maxSize: 2 } ),
	];

let player = new Player( canvasBg.width / 2, canvasBg.height * .75 );
let enemy  = new Enemy( canvasBg.width / 2, canvasBg.height * .2 );

// start game loop

let attractMode = true;

window.requestAnimationFrame( gameLoop );

