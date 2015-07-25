function ScoreBoard(score, highscore, fontSize, color) {
	this.score = (score === undefined) ? 0: score;
	this.highscore = (highscore === undefined) ? 1: highscore;

	this.scoreText = null;
	this.highscoreText = null;

	this.fontSize = fontSize;
	this.color = color;
}

ScoreBoard.prototype.reset = function() {
	this.score = 0;
};

ScoreBoard.prototype.renderScore = function(x, y) {
	this.scoreText = game.add.text(x, y, this.score + '');
	this.scoreText.fontSize = this.fontSize;
	this.scoreText.fill = this.color;
	console.log(this.color);
}

ScoreBoard.prototype.renderHighScore = function(x, y) {
	this.highscoreText = game.add.text(x, y, this.highscore + '');
	this.highscoreText.fontSize = this.fontSize;
	this.highscoreText.fill = this.color;
}

ScoreBoard.prototype.update = function(earnedScore) {
	if (this.highscoreText != null && this.scoreText != null && earnedScore > 0) {
		this.score += earnedScore * 10;
		this.scoreText.text = this.score + '';
		if (this.score > this.highscore) {
			this.highscore = this.score;
			this.highscoreText.text = this.highscore + '';
			localStorage['highscore'] = this.highscore;
		}
	}

	return earnedScore > 0;
}