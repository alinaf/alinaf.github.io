const playerMap = {};
var Game = {};
var name = "";

Game.addNewPlayer = function(id, x, y) {
	console.log('add player')
};

Game.removePlayer = function(id) {
	console.log('remove');
};

Game.print = function(data) {
	var displayName = name ? name : "Player " + data.id;
	var points = data.score == 1 ? " point!" : " points!";
	bonusText.setText(displayName + " played " + data.word + " for " + data.score + points);
};

Game.setTileBag = function(data) {
	start.destroy();
	letterBag = data;
	addTiles();
};

// dimensions
const w = window.innerWidth;
const h = window.innerHeight;
// const topThird = h/3;

var p1 = false;
var letterBag;
const brightBlue = "#459ac4";
var currentWord = "";
var wordStrings = [];
var letterMap = new Map();
var squareToTextBox = new Map();
var currentSquares = [];
var squareToLocation = new Map();

var pos = 0; // no queue in JS apparently so just use this
var plurals = new Set(); // doesn't actually work because each word needs its own memory
// put "s" in (hacky), lots of complexities i'm skimming over
const dictString = readTextFile("assets/words_alpha.txt").split("\n");

const validWords = new Set(dictString);

var currHeight = 200;
var left = true;
var config = {
	type: Phaser.WEBGL,
	width: window.innerWidth - 20,
	height: window.innerHeight - 20,
	parent: 'game',
	backgroundColor: "#FEEDE8",
	scene: {
		preload: preload,
		create: create,
        // update: update,
    }
};

var context;
var game = new Phaser.Game(config);
var bagSquares = [];
var currentWordText;
var camera;
var score = 0;
var scoreText;
var showingMessage = false;
var bonusText;
var instructions;
var instructionsShowing = false;
var start;

function preload() {
	this.load.image('square', 'assets/square.png');
	this.load.image('tile', 'assets/tile.png');
	this.load.image('controls', 'assets/controls.png');
	this.load.image('ranout', 'assets/ranout.png');
	this.load.image('excellent', 'assets/excellent.png');
	this.load.image('nice', 'assets/nice.png');
	this.load.image('submit', 'assets/submit.png');
}

function create() {
	// waste another hour on this line later please
	var line = this.add.line(w/2, h/2 + 50, 0, 0, 0, 3*h/4, 0xE6AC8E);
	line.setLineWidth(5);
	bonusText = this.add.text(w/2, 15, "", {
		font: "20px Karla",
		fill: '#000000'
	});
	bonusText.setOrigin(0.5);
	Client.askNewPlayer();
	context = this;
	camera = this.cameras.main;
	currentWordText = this.add.text(w/2, h - 200, "", {
		font: "70px Merriweather",
		fill: '#054f4a'
	});
	currentWordText.setOrigin(0.5);
	scoreText = this.add.text(w/2, h - 100, "score: 0", {
		font: "55px Karla",
		fill: '#000000'
	});
	scoreText.setOrigin(0.5);
	this.input.keyboard.on('keydown_ENTER', submitWord);
	this.input.keyboard.on('keydown_BACKSPACE', deleteLetter);
	this.input.keyboard.on('keydown_SPACE', drawTile);
	start = this.add.sprite(700, 300, 'submit');
	start.setInteractive();
	start.on('pointerup', function(pointer) {
		Client.startGame(getTileBag())
		p1 = true; // started game
		this.destroy();
	});
}

function getTileBag() {
	var unshuffledLetterBag = new Array();
	var scrabbleDist = [9, 2, 2, 4, 12, 2, 3, 2, 9, 1, 1, 4, 2, 6, 8, 2, 1, 6, 4, 6, 4, 2, 2, 1, 2, 1];

	for (let i = 0; i < scrabbleDist.length; i++) {
		for (let j = 0; j < scrabbleDist[i]; j++) {
			unshuffledLetterBag.push(String.fromCharCode(97 + i));
		}
	}

	return Phaser.Utils.Array.Shuffle(unshuffledLetterBag);
}

function addTiles() {
    // make grid
    var width = 0;
    for (i = 0; i < 15; i++) { // change this!!
    	width += 85;
    	const square = context.add.sprite(width, 75, 'tile');
    	square.tint = 0xE6AC8E;
    	text = context.add.text(square.x - 18, square.y - 33, letterBag[i], {
    		font: "60px Merriweather",
    		fill: '#FFFFFF'
    	});
    	square.setInteractive();
    	text.visible = false;
    	square.visible = false;
    	letterMap.set(square, letterBag[i]);
    	squareToTextBox.set(square, text);
    	square.on('pointerover', function(pointer) {
    		this.setTint(0xE5381B);
    	});
    	square.on('pointerout', function(pointer) {
    		this.setTint(0xE6AC8E);
    	});
    	square.on('pointerup', function(pointer) {
    		updateString(this, letterMap.get(this));
    	});
    	bagSquares.push(square);
    }
    drawTile();
}

async function submitWord() {
	if (currentWord.length < 3) return;
	console.log(currentWord);
	const errorMessage = validWord(currentWord);
	if (errorMessage != "") {
		camera.shake(700, 0.003);
		currentSquares = [];
		currentWordText.setText(errorMessage);
		await sleep(1000);
		currentWord = "";
		currentWordText.setText(currentWord);
		return;
	}
	plurals.add(currentWord + "s");
	var bonus = calculateScore(currentWord);
	score += bonus;
	Client.submitWord(currentWord, bonus);
	var points = bonus == 1 ? " point!" : " points!";
	bonusText.setText("You played " + currentWord + " for " + bonus + points);
	scoreText.setText("score: " + score);
	//const dimensions = canRearrange();
	//
	addWord(context, currentWord);
	//}
	currentWord = "";
	currentWordText.setText(currentWord);
	var bonusImage;
	if (bonus > 10) {
		bonusImage = context.add.sprite(700, 300, 'excellent');
		bonusImage.alpha = 0.9;
	} else if (bonus > 4) {
		bonusImage = context.add.sprite(700, 300, 'nice');
		bonusImage.alpha = 0.9;
	}
	for (i = 0; i < currentSquares.length; i++) {
		squareToTextBox.get(currentSquares[i]).destroy();
		currentSquares[i].destroy();
	}
	currentSquares = [];
	if (bonusImage) {
		await sleep(1000);
		bonusImage.destroy();
	}
}

function readTextFile(file) {
	var rawFile = new XMLHttpRequest();
	var allText;
	rawFile.open("GET", file, false);
	rawFile.onreadystatechange = function() {
		allText = rawFile.responseText;
	}
	rawFile.send(null);
	return allText;
}

function validWord(currentWord) {

	if (!validWords.has(currentWord)) {
		return "invalid word!";
	}
	if (plurals.has(currentWord)) {
		return "no plurals!";
	}


	var rearranging = false;
	var dimensions;

    // can only pick from one word (well you can pick two if you use all the letters)
    for (i = 0; i < currentSquares.length; i++) {
    	if (squareToLocation.has(currentSquares[i])) {
    		const loc = squareToLocation.get(currentSquares[i]);
    		if (rearranging && loc.width != dimensions.width) {
    			return "must use all letters!"
    		}
    		if (!rearranging) {
    			rearranging = true;
    			dimensions = loc;
    		}
    	}
    }
    // must rearrange the whole word
    return "";
}

function deleteLetter() {
	if (!currentWord.length) return;
	currentWord = currentWord.slice(0, -1);
	currentWordText.setText(currentWord);
	console.log(currentSquares);
	currentSquares.pop();
	console.log(currentSquares);
}

function updateString(square, letter) {
	if (currentSquares.includes(square)) {
		camera.shake(500, 0.003);
		return;
	}
	currentSquares.push(square);
	currentWord += letter;
	currentWordText.setText(currentWord);
    // only use one letter once
    // only use letters from one word and/or center tiles
}

function drawTile() {
	if (instructionsShowing) instructions.destroy();
	if (pos == letterBag.length) {
		if (!showingMessage) {
			const ranout = context.add.sprite(700, 300, 'ranout');
			ranout.setInteractive();
			showingMessage = true;
			ranout.on('pointerup', function(pointer) {
				this.destroy();
				showingMessage = false;
			});
		}
		return;
	}
	bagSquares[pos].visible = true;
	squareToTextBox.get(bagSquares[pos]).visible = true;
	pos++;
}

// function canRearrange(word) {
// 	for (i = 0; i < currentSquares.length; i++) {
// 		if (squareToLocation.has(currentSquares[i])) {
// 			const loc = squareToLocation.get(currentSquares[i]);
// 			return {
// 				width: loc.width,
// 				height: loc.height
// 			};
// 		}
// 	}
// 	return false;
// }

// function rearrange(context, word, width, height) {
// 	const startWidth = width;
// 	for (i = 0; i < word.length; i++) {
// 		width += 75;

// 		const square = context.add.sprite(width, height, 'square');
// 		squareToLocation.set(square, {
// 			height: currHeight,
// 			width: startWidth,
// 			length: word.length
// 		});
// 		square.tint = 0xE6AC8E;
// 		square.on('pointerover', function(pointer) {
// 			this.setTint(0xE5381B);
// 		});
// 		square.on('pointerout', function(pointer) {
// 			this.setTint(0xE6AC8E);
// 		});
// 		square.on('pointerup', function(pointer) {
// 			updateString(this, letterMap.get(this));
// 		});
// 		text = context.add.text(square.x - 18, square.y - 33, word[i], {
// 			font: "50px Merriweather",
// 			fill: '#FFFFFF'
// 		});
// 		square.setInteractive();
// 		letterMap.set(square, word[i]);
// 		squareToTextBox.set(square, text);
// 	}
// }

function addWord(context, word) {
	var width = p1 ? 0 : w/2;
	const startWidth = width;
	for (i = 0; i < word.length; i++) {
		width += 75;
		const square = context.add.sprite(width, currHeight, 'square');
		squareToLocation.set(square, {
			height: currHeight,
			width: startWidth,
			length: word.length
		});
		square.tint = 0xE6AC8E;
		square.on('pointerover', function(pointer) {
			this.setTint(0xE5381B);
		});
		square.on('pointerout', function(pointer) {
			this.setTint(0xE6AC8E);
		});
		square.on('pointerup', function(pointer) {
			updateString(this, letterMap.get(this));
		});
		text = context.add.text(square.x - 18, square.y - 33, word[i], {
			font: "50px Merriweather",
			fill: '#FFFFFF'
		});
		square.setInteractive();
		letterMap.set(square, word[i]);
		squareToTextBox.set(square, text);
	}
    currHeight += 85;
}

function calculateScore(word) {
	if (word.length == 3) {
		return 1;
	}
	if (word.length < 7) return word.length;
	return word.length * 2;
}

WebFontConfig = {
	google: {
		families: ["Karla", "Merriweather"]
	}
};

(function() {
	var wf = document.createElement('script');
	wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
	'://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
	wf.type = 'text/javascript';
	wf.async = 'true';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(wf, s);
})();

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}