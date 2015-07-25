/*******************************************************************************
* ~ BallManager: a class used for interacting and manipulating ball objects
* 	  - Public methods (intended for external uses):
*		 - render(x, y, color, listener):
*		    . render a ball with the provided color at the 
*		 	specified x, y coordinates
*		 	. return: the newly rendered ball object
*		 	
*		 	+ x, y: coordinates of the cell
*		 	+ color: color code of the ball
*		 	+ listener: a function to be used to act on the ball object
*-------------------------------------------------------------------------------
* 		 - renderPreviews(x, y, scaled):
* 		 	. render 3 scaled versions of the upcoming balls
* 		 	. return: none
* 		 		
* 		 	+ x, y: coordinates of the cell
* 		 	+ scaled: scale values of the preview (0 < scaled <= 1)
*-------------------------------------------------------------------------------
* 		 - renderUpcomings():
* 		 	. render 3 new balls whose colors are pulled from the preview
* 		 	  array at random locations
* 		 	. return: an array of 3 newly created balls
*-------------------------------------------------------------------------------
* 		 - getSelectedBall():
* 		 	. returns the currently selected ball, can be null
* 		 	  if none is selected
* 		 	. return: the ball object
*-------------------------------------------------------------------------------		 		    
* 		 - setSelectedBall(newBall): 
* 		 	. set the currently selected ball to the input one
* 		 	. return: none	
* 		 	
* 		    + newBall: the new ball to be set to	
*-------------------------------------------------------------------------------		 		    
*		 - move(ball, path, callback, params):
*		    . move the ball according to the provided path
*		    . return: none
*		    
*		    + ball: a sprite object
*		    + path: an array containing step-by-step location of the ball
*		    + callback: a function to be used when the object has finished moving
*		    + params: an array of parameters to be used with the callback
*-------------------------------------------------------------------------------		    
* 		 - remove(ball):
* 			. remove the input ball from the manager
* 			. return: none
* 			
* 			+ ball: the ball object to be removed
*-------------------------------------------------------------------------------
*        - removeMatch(x, y):
*           . remove all the matching ball (horizontal, vertical, diagonally)
*             starting at the specified location
*           . return: none
*           
*           + x, y: the coordinate to be checked
*-------------------------------------------------------------------------------          
* 		 - reset(): 
* 		 	. reset all the values of the manager
* 		 	. return: none
********************************************************************************/

function BallManager(width, height, numColors, ballSize, spriteName) {
	this.size = ballSize;
	this.nColors = numColors;
	this.sprite = spriteName;

	this.width = width;
	this.height = height;
	this.board = new Board(9, 9, 0);

	this.selectedBall = null;

	this.balls = {};
	this.upcomingColors = [randInt(0, this.nColors), randInt(0, this.nColors), randInt(0, this.nColors)];
	this.ballPreview = [];
}

BallManager.prototype.render = function(x, y, color, onInputDownListener) {
	// Create a new sprite object in the game and set suitable settings for it
	var newBall = game.add.sprite(x * this.size, y * this.size, this.sprite, color);
	newBall.inputEnabled = 1;
	newBall.color = color;
	newBall.isMoving = false;
	newBall.events.onInputDown.add(onInputDownListener, this);

	this.board.add(x, y, 1);
	this.balls[this.getName(x, y)] = newBall;

	return newBall;
};

// Returns a scaled copy of the upcoming balls
BallManager.prototype.renderPreviews = function(x, y, scale, onInputDownListener) {
	this.clearPreviews();
	for (var i = 0; i < 3; i++) {
		var color = this.upcomingColors[i];
		this.ballPreview[i] = game.add.sprite(x + 25 * i, y, this.sprite, color);
		this.ballPreview[i].color = color;
		this.ballPreview[i].scale.setTo(scale, scale);
	}
};

BallManager.prototype.renderUpcoming = function(onInputDownListener) {
	var upcomingBalls = [];
	for (var i = 0; i < 3; i++) {
		var location = this.randLocation();
		upcomingBalls.push(this.render(location.x, location.y, this.upcomingColors.pop(), onInputDownListener));
		this.removeMatch(location.x, location.y);
	}
	this.newUpcomingColors();
	return upcomingBalls;
};

BallManager.prototype.getSelectedBall = function() {
	return this.selectedBall;
};

BallManager.prototype.setSelectedBall = function(ball) {
	return this.selectedBall = ball;
};

BallManager.prototype.move = function(sprite, path, callback, params) {
	// Adjust the tracking board and balls object accordingly
	var finish = path.length - 1;
	var original = this.getName(path[0].x, path[0].y);
	var moved = this.getName(path[finish].x, path[finish].y);

	this.board.remove(path[0].x, path[0].y);
	this.board.add(path[finish].x, path[finish].y, 1);
	this.balls[moved] = this.balls[original];
	delete this.balls[original];

	sprite.isMoving = true;

	// Add a chained tween to the sprite object
	var movingTween = game.add.tween(sprite);
	for (var i = 0; i < path.length; i++) {
		movingTween.to({x: path[i].x * this.size, y: path[i].y * this.size}, 50, Phaser.Easing.Linear.None);
	}
	movingTween.start();
	movingTween.onComplete.add(function(){
		sprite.isMoving = false;
		if (callback !== null && typeof callback === 'function') {
			callback.apply(this, params);
		}
	});
};

BallManager.prototype.remove = function(ball) {
	if (ball === null || ball === undefined) return;

	var location = this.atWhichCell(ball.x, ball.y);
	delete this.balls[this.getName(location.x, location.y)];
	this.board.remove(location.x, location.y);

	BallManager.Effects.fadeOut(ball, ball.kill);
};

BallManager.prototype.horizontalMatch = function (x, y, color) {
	var matchHorizontal = 1;
	var rightBound = x + 1, leftBound = x - 1;

	while (rightBound < NUM_ROWS &&
		   this.board.at(rightBound, y) === 1 &&
		   this.balls[this.getName(rightBound, y)].color === color) {
		
		matchHorizontal++;
		rightBound++;
	}
	while (leftBound >= 0 &&
		   this.board.at(leftBound, y) === 1 &&
		   this.balls[this.getName(leftBound, y)].color === color) {

		matchHorizontal++;
		leftBound--;
	}

	if (matchHorizontal >= 5) {
		for (var i = leftBound + 1; i < rightBound; i++) {
			this.remove(this.balls[this.getName(i, y)]);
		}
		return matchHorizontal;
	}
	return 0;
};

BallManager.prototype.verticalMatch = function (x, y, color) {
	var matchVertical = 1;
	var upperBound = y - 1, lowerBound = y + 1;

	while (lowerBound < NUM_ROWS &&
		   this.board.at(x, lowerBound) === 1 &&
		   this.balls[this.getName(x, lowerBound)].color === color) {
		
		matchVertical++;
		lowerBound++;
	}
	while (upperBound >= 0 &&
		   this.board.at(x, upperBound) === 1 &&
		   this.balls[this.getName(x, upperBound)].color === color) {
		
		matchVertical++;
		upperBound--;
	}

	if (matchVertical >= 5) {
		for (var i = upperBound + 1; i < lowerBound; i++) {
			this.remove(this.balls[this.getName(x, i)]);
		}
		return matchVertical;
	}
	return 0;
};

BallManager.prototype.mainDiagonalMatch = function(x, y, color) {
	var matchMainDiagonal = 1;
	var upperRightBoundX = x + 1, upperRightBoundY = y - 1;
	var lowerLeftBoundX = x - 1, lowerLeftBoundY = y + 1;

	while (upperRightBoundX < NUM_ROWS && upperRightBoundY >= 0 &&
		   this.board.at(upperRightBoundX, upperRightBoundY) === 1 &&
		   this.balls[this.getName(upperRightBoundX, upperRightBoundY)].color === color) {

		matchMainDiagonal++;
		upperRightBoundX++;
		upperRightBoundY--;
	}
	while (lowerLeftBoundX >= 0 && lowerLeftBoundY < NUM_ROWS &&
		   this.board.at(lowerLeftBoundX, lowerLeftBoundY) === 1 &&
		   this.balls[this.getName(lowerLeftBoundX, lowerLeftBoundY)].color === color) {

		matchMainDiagonal++;
		lowerLeftBoundX--;
		lowerLeftBoundY++;
	}

	if (matchMainDiagonal >= 5) {
		var i = lowerLeftBoundX + 1;
		var j = lowerLeftBoundY - 1;
		while (i < upperRightBoundX && j > upperRightBoundY) {
			this.remove(this.balls[this.getName(i, j)]);
			i++;
			j--;
		}
		return matchMainDiagonal;
	}
	return 0;
};

BallManager.prototype.antiDiagonalMatch = function(x, y, color) {
	var matchAntiDiagonal = 1;
	var upperLeftBoundX = x - 1, upperLeftBoundY = y - 1;
	var lowerRightBoundX = x + 1, lowerRightBoundY = y + 1;

	while (upperLeftBoundX >= 0 && upperLeftBoundY >= 0 &&
		   this.board.at(upperLeftBoundX, upperLeftBoundY) === 1 &&
		   this.balls[this.getName(upperLeftBoundX, upperLeftBoundY)].color === color) {

		matchAntiDiagonal++;
		upperLeftBoundX--;
		upperLeftBoundY--;
	}
	while (lowerRightBoundX < NUM_ROWS && lowerRightBoundY < NUM_ROWS &&
		   this.board.at(lowerRightBoundX, lowerRightBoundY) === 1 &&
		   this.balls[this.getName(lowerRightBoundX, lowerRightBoundY)].color === color) {

		matchAntiDiagonal++;
		lowerRightBoundX++;
		lowerRightBoundY++;
	}

	if (matchAntiDiagonal >= 5) {
		var i = lowerRightBoundX - 1;
		var j = lowerRightBoundY - 1;
		while (i > upperLeftBoundX && j > upperLeftBoundY) {
			this.remove(this.balls[this.getName(i, j)]);
			i--;
			j--;
		}
		return matchAntiDiagonal;
	}
	return 0;
};

BallManager.prototype.removeMatch = function(x, y) {
	var color = this.balls[this.getName(x, y)].color;

	return this.horizontalMatch(x, y, color) + this.verticalMatch(x, y, color) +
		   this.mainDiagonalMatch(x, y, color) + this.antiDiagonalMatch(x, y, color);
};

BallManager.prototype.reset = function() {
	for (var i = 0; i < this.ballPreview.length; i++) {
		this.ballPreview[i].kill();
	}
	if (this.getSelectedBall() !== null) {
		BallManager.Effects.removeShadow(this.getSelectedBall());
		this.setSelectedBall(null);
	}
	for (var id in this.balls) {
		this.balls[id].kill();
		delete this.balls[id];
	}

	this.ballPreview = [];
	this.board.reset();
	this.newUpcomingColors();
};

BallManager.prototype.randLocation = function() {
	var x = 0, y = 0;

	do {
		x = randInt(0, 9);
		y = randInt(0, 9);
	} while (this.board.at(x, y) === 1 && !this.board.isFull());

	return {
		x: x,
		y: y,
	};
};

BallManager.prototype.newUpcomingColors = function() {
	for (var i = 0; i < 3; i++) {
		this.upcomingColors[i] = randInt(0, this.nColors);
	}
};

BallManager.prototype.getBoard = function() {
	return this.board.getValues();
}


BallManager.prototype.isMoving = function(sprite) {
	if (sprite === null || sprite === undefined) return false;
	return sprite.isMoving;
};

BallManager.prototype.atWhichCell = function(x, y) {
	return {
		x: Math.floor(x / this.size),
		y: Math.floor(y / this.size),
	};
};

BallManager.prototype.getName = function(x, y) {
	return x + ', ' + y;
};

BallManager.prototype.clearPreviews = function() {
	for (var i = 0; i < this.ballPreview.length; i++) {
		this.ballPreview[i].kill();
		this.ballPreview[i] = null;
	}
}

BallManager.prototype.getColor = function(code) {
	switch(code) {
		case 0: return "RED";
		case 1: return "ORANGE";
		case 2: return "GREEN";
		case 3: return "BLUE";
		case 4: return "GREY";
		case 5: return "BROWN";
		case 6: return "LIME";
	}
};

/*******************************************************************************
*  ~ Effects: containing various methods for interacting and adding visual effects
*  to any sprite.
*  ~ Methods:    
*  		- fadeIn(sprite, callback),
*  		- fadeOut(sprite, callback)
*  			+ sprite:     a sprite game object
*			+ callback:   a function to be called when the effects are finished
*			
*		- addShadow(sprite, spriteName),
*		- removeShadow(sprite, spriteName)
*			+ sprite:     a sprite game object where the new shadow object
*					      will be attached to
*			+ spriteName: a string value of the shadow's sprite name
********************************************************************************/

BallManager.Effects = function() {}

BallManager.Effects.fadeIn = function(sprite, callback) {
	sprite.alpha = 0;
	var fade = game.add.tween(sprite).to( { alpha: 1 }, 1000, Phaser.Easing.Linear.None, true);
	fade.onComplete.add(function() {
		if (callback !== null && callback !== undefined && typeof callback === 'function') {
			callback();
		}
	});
};

BallManager.Effects.fadeOut = function(sprite, callback) {
	var fade = game.add.tween(sprite).to( { alpha: 0 }, 500, Phaser.Easing.Linear.None, true);
	fade.onComplete.add(function() {
		if (callback !== null && callback !== undefined && typeof callback === 'function') {
			callback();
			sprite.kill();
		}
	});
};

BallManager.Effects.addShadow = function(sprite, shadowSpriteName) {
	if (sprite === null) return;

	var shadow = game.add.sprite(sprite.x, sprite.y, shadowSpriteName);
	shadow.alpha = 0;
	game.add.tween(shadow).to( { alpha: 1 }, 100, Phaser.Easing.Linear.None, true);
	sprite.shadow = shadow;
};

BallManager.Effects.removeShadow = function(sprite) {
	if (sprite === null || sprite.shadow === null) return;

	sprite.shadow.kill();
	sprite.shadow = null;
};
