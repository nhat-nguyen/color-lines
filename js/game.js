const NUM_BALLS = 6, BALL_HEIGHT = 50;
const SIDEBAR_WIDTH = 200;
const NUM_ROWS = 9;

var game = new Phaser.Game(NUM_ROWS * BALL_HEIGHT + SIDEBAR_WIDTH, NUM_ROWS * BALL_HEIGHT, 
						   Phaser.CANVAS, 'lines-color',
						   {preload:preload, create:create});

var score = new ScoreBoard(0, localStorage['highscore'], 15, color='#ffffff');

var manager = new BallManager(NUM_ROWS, NUM_ROWS, NUM_BALLS, BALL_HEIGHT, 'balls');

function preload () {
	game.load.image('board', './res/tile.png');
	game.load.image('sidebar', './res/sidebar.png');
	game.load.image('shadow', './res/shadow.png');
	game.load.image('restart', './res/restart.png');
	game.load.spritesheet('balls', './res/balls.png', BALL_HEIGHT, BALL_HEIGHT);
	game.stage.backgroundColor = '#607D8B';
}

function create() {
    initBoard();
    // EasyStar.js initialization
    easystar = new EasyStar.js();
    easystar.setGrid(manager.board.values);
    easystar.setAcceptableTiles([0]);

    // Sidebar and score management initialization
    game.add.sprite(NUM_ROWS * BALL_HEIGHT, 0, 'sidebar');

    score.renderScore(BALL_HEIGHT * NUM_ROWS + 80, game.world.centerY + 5);
    score.renderHighScore(BALL_HEIGHT * NUM_ROWS + 80, game.world.centerY + 5 - 70);
    
    restartGame = game.add.sprite(game.width - 125, game.height - 30, 'restart');
    restartGame.inputEnabled = 1;
    restartGame.events.onInputDown.add(function() {
    	manager.reset();
    	score.reset();
    	randBallGroup();
    });

    // Initial ball group
    randBallGroup();
}

function ballListener(sprite, pointer) {
	// If a ball has been selected, remove that ball's shadow
	if (manager.getSelectedBall() !== null) {
		BallManager.Effects.removeShadow(manager.getSelectedBall());
	}
	manager.setSelectedBall(sprite); // Set selected ball to the new one
	if (!sprite.isMoving) {
		BallManager.Effects.addShadow(sprite, 'shadow');
	}
}

function cellListener(sprite, pointer) {
	var dest = manager.atWhichCell(sprite.x, sprite.y);
	var current = manager.selectedBall;

	if (current !== null && !current.isMoving && !manager.board.at(dest.x, dest.y)) {
		var ball = manager.atWhichCell(current.x, current.y);

		easystar.findPath(ball.x, ball.y, dest.x, dest.y, function(path) {
		    if (path !== null) {
		        manager.move(current, path, matchAndScore, [dest.x, dest.y]);
		    } else {
		    	console.log('No path was found.');
		    }
		    manager.setSelectedBall(null);
		});
		BallManager.Effects.removeShadow(current);
		easystar.calculate();
	}
}

function initBoard() {
	var i, j, cell;
	for (i = 0; i < NUM_ROWS; i++) {
		for (j = 0; j < NUM_ROWS; j++) {
			cell = game.add.sprite(i * BALL_HEIGHT, j * BALL_HEIGHT, 'board');
			cell.inputEnabled = 1;
			cell.events.onInputDown.add(cellListener, this);
		}
	}
}

// The ball has arrived at cell (x, y), do something with it
function matchAndScore(x, y) {
	var earnedScore = manager.removeMatch(x, y);
	if (earnedScore > 0) {
		score.update(earnedScore);
	} else {
		randBallGroup();
	}
}

function randBallGroup() {
	var upcoming = manager.renderUpcoming(ballListener);
	for (var i = 0; i < upcoming.length; i++) {
		BallManager.Effects.fadeIn(upcoming[i]);
	}
	manager.renderPreviews(BALL_HEIGHT * NUM_ROWS + 80, game.height / 2 + 70, 0.5, null);
}