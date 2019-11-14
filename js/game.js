const playerMap = {};
var Game = {};
var name = "";

Game.addNewPlayer = function (id, x, y) {
    console.log('add player')
};

Game.removePlayer = function (id) {
    console.log('remove');
};

Game.print = function (data) {
   // var displayName = name ? name : "Player " + data.id;
    var displayName = "They";
    var points = data.score == 1 ? " point!" : " points!";
    bonusText.setText(displayName + " played " + data.word + " for " + data.score + points);
    otherScoreText.setText("them: " + data.total);
    addWord(context, data.word, !p1);
    letterBagTiles = data.tiles;
    draw();
    if(data.dimensions) {
        var arr = data.dimensions.left ? leftWords : rightWords;
        var wordToDestroy = arr[data.dimensions.index];
        for(i = 0; i < wordToDestroy.length; i++) {
            wordToDestroy[i].square.destroy();
            wordToDestroy[i].text.destroy();
        }
    }
};

Game.setTileBag = function (data) {
    start.destroy();
    letterBag = data;
    line.visible = true; 
    if(p1) drawTile(true);
    var youWidth = p1 ? w/4 : 3*w/4;
    var themWidth = p1 ? 3*w/4 : w/4;


    scoreText = context.add.text(youWidth, h - 100, "you: 0", {
        font: "40px Karla",
        fill: '#000000'
    });
    otherScoreText = context.add.text(themWidth, h - 100, "them: 0", {
        font: "40px Karla",
        fill: '#000000'
    });
};

Game.newTile = function () {
    drawTile(false);
};

// dimensions
const w = window.innerWidth;
const h = window.innerHeight;
// const topThird = h/3;

var p1 = false;
var leftWords = [];
var leftWordCounter = 0;
var rightWords = [];
var rightWordCounter = 0;

var letterBag;
const brightBlue = "#459ac4";
var currentWord = "";
var wordStrings = [];
var letterMap = new Map();
var squareToTextBox = new Map();
var currentSquares = [];
var squareToLocation = new Map();
var squareToIndex = new Map();
var letterBagTiles = new Array(); // array of letters

var pos = 0; // no queue in JS apparently so just use this, position in letterbag
var plurals = new Set(); // doesn't actually work because each word needs its own memory
// put "s" in (hacky), lots of complexities i'm skimming over
const dictString = readTextFile("assets/words_alpha.txt").split(/\s+/);

const validWords = new Set(dictString);

var lpos = 200; // left current height
var rpos = 200; // right current height
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
var otherScoreText;
var showingMessage = false;
var bonusText;
var instructions;
var instructionsShowing = false;
var start;
var previousTiles = [];
var line;

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
    line = this.add.line(w / 2, h / 2 + 50, 0, 0, 0, 3 * h / 4, 0xE6AC8E);
    line.setLineWidth(5);
    line.visible = false; 
    bonusText = this.add.text(w / 2, 15, "", {
        font: "20px Karla",
        fill: '#000000'
    });
    bonusText.setOrigin(0.5);
    Client.askNewPlayer();
    context = this;
    camera = this.cameras.main;
    currentWordText = this.add.text(w / 2, h - 200, "", {
        font: "70px Merriweather",
        fill: '#142E28'
    });
    currentWordText.setOrigin(0.5);

    this.input.keyboard.on('keydown_ENTER', submitWord);
    this.input.keyboard.on('keydown_BACKSPACE', deleteLetter);
    this.input.keyboard.on('keydown_SPACE', function () {
    drawTile(true); 
});
    start = this.add.sprite(w/2, h/2, 'submit');
    start.setOrigin(0.5);
    start.setInteractive();
    start.on('pointerup', function (pointer) {
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

function draw() {
    if(previousTiles.length != 0) {
        // delete from map
        for(i = 0; i < previousTiles.length; i++) {
            previousTiles[i].letter.destroy();
            previousTiles[i].square.destroy();
        }
        previousTiles = [];
    }

    var width = 0;
    for (i = 0; i < letterBagTiles.length; i++) {
        width += 105;
        const square = context.add.sprite(width, 85, 'tile');
        square.tint = 0xE6AC8E;
        text = context.add.text(square.x - 18, square.y - 33, letterBagTiles[i], {
            font: "70px Merriweather",
            fill: '#FFFFFF'
        });
        square.setInteractive();
        letterMap.set(square, letterBagTiles[i]);
        squareToTextBox.set(square, text);
        squareToIndex.set(square, i);
        previousTiles.push({letter: text, square: square});
        square.on('pointerover', function (pointer) {
            this.setTint(0xE5381B);
        });
        square.on('pointerout', function (pointer) {
            if(!currentSquares.includes(this)) {
                this.setTint(0xE6AC8E);
            }
        });
        square.on('pointerup', function (pointer) {
            this.setTint(0xE5381B);
            updateString(this, letterMap.get(this));
        });
        bagSquares.push(square);
    }
}

async function submitWord() {
    if (currentWord.length < 4) return;
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
    var points = bonus == 1 ? " point!" : " points!";
    bonusText.setText("You played " + currentWord + " for " + bonus + points);
    scoreText.setText("score: " + score);
    const dimensions = canRearrange();    
    addWord(context, currentWord, p1);
    var bonusImage;
    if (bonus > 10) {
        bonusImage = context.add.sprite(700, 300, 'excellent');
        bonusImage.alpha = 0.9;
    } else if (bonus > 4) {
        bonusImage = context.add.sprite(700, 300, 'nice');
        bonusImage.alpha = 0.9;
    }
    var deleteIndices = [];
    for (i = 0; i < currentSquares.length; i++) {
        if(squareToIndex.get(currentSquares[i]) != null) {
            deleteIndices.push(squareToIndex.get(currentSquares[i]));
        }
        squareToTextBox.get(currentSquares[i]).destroy();
        currentSquares[i].destroy();
    }
    deleteIndices.sort(function(a,b){ return a - b; });
    for (var i = deleteIndices.length -1; i >= 0; i--){
        letterBagTiles.splice(deleteIndices[i],1);
    }
    Client.submitWord(currentWord, bonus, letterBagTiles, score, dimensions);
    currentWord = "";
    currentWordText.setText(currentWord);
    currentSquares = [];
    draw();
    if (bonusImage) {
        await sleep(1000);
        bonusImage.destroy();
    }
}

function readTextFile(file) {
    var rawFile = new XMLHttpRequest();
    var allText;
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
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
    currentSquares[currentSquares.length-1].setTint(0xE6AC8E);
    currentSquares.pop();
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

function drawTile(isSpacebar) {
   // if (instructionsShowing) instructions.destroy();
    // if (pos == letterBag.length) {
    //     if (!showingMessage) {
    //         const ranout = context.add.sprite(700, 300, 'ranout');
    //         ranout.setInteractive();
    //         showingMessage = true;
    //         ranout.on('pointerup', function (pointer) {
    //             this.destroy();
    //             showingMessage = false;
    //         });
    //     }
    //     return;
    // }
    //bagSquares[pos].visible = true;
    // squareToTextBox.get(bagSquares[pos]).visible = true;
    // pos++;
    letterBagTiles.push(letterBag[pos]);
    draw();
    pos++;
    if (isSpacebar) {
        Client.newTile();
    }
}

function canRearrange(word) {
	for (i = 0; i < currentSquares.length; i++) {
		if (squareToLocation.has(currentSquares[i])) {
			const loc = squareToLocation.get(currentSquares[i]);
			return {
				left: loc.left,
				index: loc.index,
                length: loc.length
			};
		}
	}
	return false;
}

function addWord(context, word, left) {
    var width = left ? 0 : w / 2;
    var currHeight = left ? lpos : rpos;
    const startWidth = width;
    var squares = [];
    var index = left ? leftWordCounter : rightWordCounter;
    for (i = 0; i < word.length; i++) {
        width += 75;
        const square = context.add.sprite(width, currHeight, 'square');
        squareToLocation.set(square, {
            left: left,
            index: index,
            length: word.length
        });
        square.tint = 0xE6AC8E;
          square.on('pointerover', function (pointer) {
            this.setTint(0xE5381B);
        });
        square.on('pointerout', function (pointer) {
            if(!currentSquares.includes(this)) {
                this.setTint(0xE6AC8E);
            }
        });
        square.on('pointerup', function (pointer) {
            this.setTint(0xE5381B);
            updateString(this, letterMap.get(this));
        });
        text = context.add.text(square.x - 18, square.y - 33, word[i], {
            font: "50px Merriweather",
            fill: '#FFFFFF'
        });
        square.setInteractive();
        letterMap.set(square, word[i]);
        squareToTextBox.set(square, text);
        squares.push({square: square, text: text});
    }
    if (left) {
        lpos += 85;
        leftWords[leftWordCounter] = squares;
        leftWordCounter++;
    }
    else {
        rpos += 85;
        rightWords[rightWordCounter] = squares;
        rightWordCounter++;
    }
}

function calculateScore(word) {
    if (word.length < 7) return word.length;
    return word.length * 2;
}

WebFontConfig = {
    google: {
        families: ["Karla", "Merriweather"]
    }
};

(function () {
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