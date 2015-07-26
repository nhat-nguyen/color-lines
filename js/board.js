function Board(width, height, value) {
	this.width = width;
	this.height = height;

	this.size = 0;
	this.capacity = width * height;

	this.default = value;
	this.values = this.init(width, height, value);
}

Board.prototype.init = function(row, col, val) {
	var arr = [],
		i, j;

	for (i = 0; i < row; i++) {
		arr.push([]);
		for (j = 0; j < col; j++) {
			arr[i].push(val);
		}
	}

	return arr;
}

Board.prototype.print = function() {
	var out = '';
	for (var i = 0; i < this.width; i++) {
		for (var j = 0; j < this.height; j++) {
			out += this.at(i, j) + ' ';
		}
		out += '\n';
	}
	console.log(out);
};

Board.prototype.getValues = function() {
	return this.values;
}

Board.prototype.at = function(i, j) {
	return this.values[j][i];
}

Board.prototype.add = function(i, j, value) {
	this.values[j][i] = value;
	this.size++;
}

Board.prototype.remove = function(i, j) {
	this.values[j][i] = this.default;
	this.size--;
}

Board.prototype.isFull = function() {
	return this.size >= this.capacity;
}

Board.prototype.reset = function() {
	var i, j;
	for (i = 0; i < this.width; i++) {
		for (j = 0; j < this.height; j++) {
			this.remove(i, j);
		}
	}

	this.size = 0;
}