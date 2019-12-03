const playerMap = {};
var Game = {};
var name = "";
var gameStarted = false;
const max = 32;

// colors
const backgroundColor = 0xFFFFFF;
const mainColor = 0xE6AC8E;
const hoverColor = 0xE5381B;
const gray = 0x787878;
const levelColor = 0xFEEDE8;
const accentColor = "#142E28"; // timer, curr word
const textColor = 0x000000;
const letterColor = "#FFFFFF";

Game.addNewPlayer = function (id, x, y) {
    console.log('add player')
};

Game.removePlayer = function (id) {
    console.log('remove');
};

Game.startTimer = function () {
    gameStarted = true;
};

Game.print = function (data) {
    // var displayName = name ? name : "Player " + data.id;
    var displayName = "They";
    var points = data.score == 1 ? " point!" : " points!";
    theirScore += data.score;

    if(theirScore >= max) {
        gameOver(false);
        return;
    }
    if (p1) {
        // change right
        rightScore = new Phaser.Geom.Rectangle(w / 2, h, w, -1 * (theirScore / 32 * (h - 370)));
        rightGraphics.fillRectShape(rightScore);
    } else {
        // change left
        leftScore = new Phaser.Geom.Rectangle(0, h, w / 2, -1 * (theirScore / 32 * (h - 370)));
        leftGraphics.fillRectShape(leftScore);
    }
    //otherScoreText.setText("them: " + data.total);
    madeWords.add(data.word);
    addWord(context, data.word, !p1);
    letterBagTiles = data.tiles;
    draw();
    if (data.dimensions) {
        var arr = data.dimensions.left ? leftWords : rightWords;
        var wordToDestroy = arr[data.dimensions.index];
        for (i = 0; i < wordToDestroy.length; i++) {
            wordToDestroy[i].square.setTint(gray);
            wordToDestroy[i].square.disableInteractive();
        }
        if (data.dimensions.stolen) {
            bonusText.setText("GRABBLE! " + displayName + " turned " + data.word + " into " + data.dimensions.before + " for " + data.score + points + "!");
            score -= data.dimensions.length;
            //scoreText.setText("you: " + score);
            if (p1) {
                // change left
                leftGraphics.clear();
                leftScore = new Phaser.Geom.Rectangle(0, h, w / 2, -1 * (score / 32 * (h - 370)));
                leftGraphics.fillRectShape(leftScore);
            } else {
                // change right
                rightGraphics.clear();
                rightScore = new Phaser.Geom.Rectangle(w / 2, h, w, -1 * (score / 32 * (h - 370)));
                rightGraphics.fillRectShape(rightScore);
            }
        }
    }
    else {
        bonusText.setText(displayName + " played " + data.word + " for " + data.score + points);
    }
};

Game.setTileBag = function (data) {
    divider.visible = true;
    line.visible = true;

    start.destroy();
    letterBag = data;
    line.visible = true;
    if (p1) {
        drawTile(true);
        drawTile(true);
        drawTile(true);
        drawTile(true);
        drawTile(true);
    }
    var youWidth = p1 ? w / 4 : 3 * w / 4;
    var themWidth = p1 ? 3 * w / 4 : w / 4;

    const scoreText = context.add.text(youWidth, h - 100, "yours", {
        font: "bold 100px Karla",
        fill: textColor
    });
    scoreText.setOrigin(0.5);
    const otherScoreText = context.add.text(themWidth, h - 100, "theirs", {
        font: "bold 100px Karla",
        fill: textColor
    });
    otherScoreText.setOrigin(0.5);
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

var lastWidth = 0;
var letterBag;
var currentWord = "";
var letterMap = new Map();
var squareToTextBox = new Map();
var currentSquares = [];
var squareToLocation = new Map();
var squareToIndex = new Map();
var letterBagTiles = new Array(); // array of letters

var pos = 0; // no queue in JS apparently so just use this, position in letterbag
var madeWords = new Set();
var deadLetters = new Set();
var plurals = new Set(); // doesn't actually work because each word needs its own memory
// put "s" in (hacky), lots of complexities i'm skimming over
const dictString = readTextFile("assets/words_alpha.txt").split(/\s+/);

const validWords = new Set(dictString);

var lpos = 450; // left current height
var rpos = 450; // right current height
var left = true;
var config = {
    type: Phaser.WEBGL,
    width: window.innerWidth - 20,
    height: window.innerHeight - 20,
    parent: 'game',
    backgroundColor: backgroundColor,
    scene: {
        preload: preload,
        create: create,
        // update: update,
    }
};

// timer stuff
var timerText;
var timedEvent;

var context;
var game = new Phaser.Game(config);
var bagSquares = [];
var currentWordText;
var camera;
var score = 0;
var theirScore = 0;
var showingMessage = false;
var bonusText;
var otherBonusText;
var instructions;
var instructionsShowing = false;
var start;
var previousTiles = [];

// borders
var line;
var divider;
var leftScore;
var rightScore;
var leftGraphics;
var rightGraphics;

function gameOver(win) {
    var endGameImage;
    if(win) {
        console.log('You win!');
        endGameImage = context.add.sprite(w/2, h/2, 'win');
        endGameImage.alpha = 0.9;

    }
    else {
        console.log('You lose!');
        endGameImage = context.add.sprite(w/2, h/2, 'lose');
        endGameImage.alpha = 0.9;
    }
}

function preload() {
    this.load.image('square', 'assets/square.png');
    this.load.image('tile', 'assets/tile.png');
    this.load.image('controls', 'assets/controls.png');
    this.load.image('ranout', 'assets/ranout.png');
    this.load.image('excellent', 'assets/excellent.png');
    this.load.image('nice', 'assets/nice.png');
    this.load.image('submit', 'assets/submit.png');
    this.load.image('win', 'assets/win.png');
    this.load.image('lose', 'assets/lose.png');
}

function create() {

    bonusText = this.add.text(w/2, 30, "", {
        font: "bold 60px Karla",
        fill: textColor
    });
    bonusText.setOrigin(0.5);

    leftScore = new Phaser.Geom.Rectangle(0, h, w / 2, 0);
    rightScore = new Phaser.Geom.Rectangle(w / 2, h, w, h / 2);
    leftGraphics = this.add.graphics({
        fillStyle: {
            color: levelColor
        }
    });
    rightGraphics = this.add.graphics({
        fillStyle: {
            color: levelColor
        }
    });
    leftGraphics.fillRectShape(leftScore);
    rightGraphics.fillRectShape(rightScore);

    line = this.add.line(w / 2, h / 2 + 175, 0, 0, 0, 3 * h / 4, mainColor);
    line.setLineWidth(6);
    line.visible = false;
    divider = this.add.line(w / 2, 370, 0, 0, w, 0, mainColor);
    divider.setLineWidth(6);
    divider.visible = false;

    this.initialTime = 150;
    timerText = this.add.text(w / 2, 135, formatTime(this.initialTime), {
        font: "bold 130px Karla",
        fill: accentColor,
    });
    timerText.setOrigin(0.5);
    //Each 1000 ms call onEvent
    timedEvent = this.time.addEvent({
        delay: 1000,
        callback: onEvent,
        callbackScope: this,
        loop: true
    });

    Client.askNewPlayer();
    context = this;
    camera = this.cameras.main;
    currentWordText = this.add.text(w / 2, h - 200, "", {
        font: "100px Merriweather",
        fill: accentColor,
    });
    currentWordText.setOrigin(0.5);

    this.input.keyboard.on('keydown_ENTER', submitWord);
    this.input.keyboard.on('keydown_BACKSPACE', deleteLetter);
    /*this.input.keyboard.on('keydown_SPACE', function () {
        drawTile(true);
    });*/
    start = this.add.sprite(w / 2, h / 2, 'submit');
    start.setOrigin(0.5);
    start.setInteractive();
    start.on('pointerup', function (pointer) {
        Client.startGame(getTileBag())
        p1 = true; // started game
        this.destroy();
        divider.visible = true;
        line.visible = true;
    });
}

function formatTime(seconds) {
    // Minutes
    var minutes = Math.floor(seconds / 60);
    // Seconds
    var partInSeconds = seconds % 60;
    // Adds left zeros to seconds
    partInSeconds = partInSeconds.toString().padStart(2, '0');
    // Returns formated time
    return `${minutes}:${partInSeconds}`;
}

function onEvent() {
    if ((p1 || gameStarted) && this.initialTime > 0) {
        this.initialTime -= 1; // One second
        timerText.setText(formatTime(this.initialTime));
        if (this.initialTime % 5 == 0) {
            drawTile(true);
        }
    }
    if (this.initialTime == 0) {
        console.log("Game over!");
        gameOver(score > theirScore);
    }
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
    if (previousTiles.length != 0) {
        // delete from map
        for (i = 0; i < previousTiles.length; i++) {
            previousTiles[i].letter.destroy();
            previousTiles[i].square.destroy();
        }
        previousTiles = [];
    }

    var width = 0;
    for (i = 0; i < letterBagTiles.length; i++) {
        width += 150;
        lastWidth = width;
        const square = context.add.sprite(width, 275, 'tile');
        square.tint = mainColor;
        text = context.add.text(square.x, square.y, letterBagTiles[i], {
            font: "100px Merriweather",
            fill: letterColor,
        });
        text.setOrigin(0.5)
        square.setInteractive();
        letterMap.set(square, letterBagTiles[i]);
        squareToTextBox.set(square, text);
        squareToIndex.set(square, i);
        previousTiles.push({
            letter: text,
            square: square
        });
        square.on('pointerover', function (pointer) {
            this.setTint(hoverColor);
        });
        square.on('pointerout', function (pointer) {
            if (!currentSquares.includes(this)) {
                this.setTint(mainColor);
            }
        });
        square.on('pointerup', function (pointer) {
            this.setTint(hoverColor);
            updateString(this, letterMap.get(this));
        });
        bagSquares.push(square);
    }
}

function addTile() {
        width = lastWidth + 150;
        const square = context.add.sprite(width, 275, 'tile');
        square.tint = mainColor;
        text = context.add.text(square.x, square.y, letterBagTiles[letterBagTiles.length - 1], {
            font: "100px Merriweather",
            fill: letterColor,
        });
        text.setOrigin(0.5)
        square.setInteractive();
        letterMap.set(square, letterBagTiles[letterBagTiles.length - 1]);
        squareToTextBox.set(square, text);
        squareToIndex.set(square, letterBagTiles.length - 1);
        previousTiles.push({
            letter: text,
            square: square
        });
        square.on('pointerover', function (pointer) {
            this.setTint(hoverColor);
        });
        square.on('pointerout', function (pointer) {
            if (!currentSquares.includes(this)) {
                this.setTint(mainColor);
            }
        });
        square.on('pointerup', function (pointer) {
            this.setTint(hoverColor);
            updateString(this, letterMap.get(this));
        });
    lastWidth += 150;
}

async function submitWord() {
    if (currentWord.length < 4) return;
    const errorMessage = validWord(currentWord);
    if (errorMessage != "") {
        camera.shake(700, 0.003);
        for (square in currentSquares) {
            currentSquares[square].setTint(mainColor);
        }
        currentSquares = [];
        currentWordText.setText(errorMessage);
        await sleep(1000);
        currentWord = "";
        currentWordText.setText(currentWord);
        return;
    }
    madeWords.add(currentWord);
    plurals.add(currentWord + "s");
    var bonus = calculateScore(currentWord);
    score += bonus;
    if (p1) {
        // change left
        leftScore = new Phaser.Geom.Rectangle(0, h, w / 2, -1 * (score / 32 * (h - 370)));
        leftGraphics.fillRectShape(leftScore);

    } else {
        // change right
        rightScore = new Phaser.Geom.Rectangle(w / 2, h, w, -1 * (score / 32 * (h - 370)));
        rightGraphics.fillRectShape(rightScore);
    }
    var points = bonus == 1 ? " point!" : " points!";
   // scoreText.setText("you: " + score);
    const dimensions = canRearrange();
    addWord(context, currentWord, p1);
    var bonusImage;
    if (bonus > 10) {
        bonusImage = context.add.sprite(w/2, h/2, 'excellent');
        bonusImage.alpha = 0.9;
    } else if (bonus > 4) {
        bonusImage = context.add.sprite(w/2, h/2, 'nice');
        bonusImage.alpha = 0.9;
    }
    var deleteIndices = [];
    for (i = 0; i < currentSquares.length; i++) {
        if (squareToIndex.get(currentSquares[i]) != null) {
            // from top tiles
            deleteIndices.push(squareToIndex.get(currentSquares[i]));
            squareToTextBox.get(currentSquares[i]).destroy();
            currentSquares[i].destroy();
        }
        else {
            // invalidate
            currentSquares[i].disableInteractive();
            currentSquares[i].setTint(gray);
            deadLetters.add(currentSquares[i]);
        }
    }
    deleteIndices.sort(function (a, b) {
        return a - b;
    });
    for (var i = deleteIndices.length - 1; i >= 0; i--) {
        letterBagTiles.splice(deleteIndices[i], 1);
    }
    if (dimensions) {
        if (dimensions.stolen) {
            theirScore -= dimensions.length;
            if (p1) {
                // change right
                rightGraphics.clear();
                rightScore = new Phaser.Geom.Rectangle(w / 2, h, w, -1 * (theirScore / 32 * (h - 370)));
                rightGraphics.fillRectShape(rightScore);
            } else {
                // change left
                leftGraphics.clear();
                leftScore = new Phaser.Geom.Rectangle(0, h, w / 2, -1 * (theirScore / 32 * (h - 370)));
                leftGraphics.fillRectShape(leftScore);
            }
         //   otherScoreText.setText("them: " + (theirScore));
        }
        bonusText.setText("GRABBLE! You turned " + dimensions.before + " into " + currentWord + " for " + bonus + points);
    }
    else {
        bonusText.setText("You played " + currentWord + " for " + bonus + points);
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

    if(score >= max) {
        gameOver(true);
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
    if (madeWords.has(currentWord)) {
        return "already made!";
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
    currentSquares[currentSquares.length - 1].setTint(mainColor);
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
    if(letterBagTiles.length > 10) {
        console.log('too many letters already');
        return;
    }
    letterBagTiles.push(letterBag[pos]);
    addTile();
    pos++;
    if (isSpacebar) {
        Client.newTile();
    }
}

function canRearrange(word) {
    var stolen = false;
    for (i = 0; i < currentSquares.length; i++) {
        if (squareToLocation.has(currentSquares[i])) {
            const loc = squareToLocation.get(currentSquares[i]);
            if (loc.left && !p1) {
                // stole a left word
                stolen = true;
            }
            if (!loc.left && p1) {
                // stole a right word
                stolen = true;
            }
            return {
                before: loc.before,
                left: loc.left,
                index: loc.index,
                length: loc.length,
                stolen: stolen
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
        width += 110;
        const square = context.add.sprite(width, currHeight, 'square');
        squareToLocation.set(square, {
            before: word,
            left: left,
            index: index,
            length: word.length
        });
        square.tint = mainColor;
        square.on('pointerover', function (pointer) {
            this.setTint(hoverColor);
        });
        square.on('pointerout', function (pointer) {
             if (!currentSquares.includes(this) && !deadLetters.has(this)) {
                this.setTint(mainColor);
            }
        });
        square.on('pointerup', function (pointer) {
            this.setTint(hoverColor);
            updateString(this, letterMap.get(this));
        });
        text = context.add.text(square.x, square.y, word[i], {
            font: "80px Merriweather",
            fill: letterColor
        });
        text.setOrigin(0.5)
        square.setInteractive();
        letterMap.set(square, word[i]);
        squareToTextBox.set(square, text);
        squares.push({
            square: square,
            text: text
        });
    }
    if (left) {
        lpos += 125;
        leftWords[leftWordCounter] = squares;
        leftWordCounter++;
    } else {
        rpos += 125;
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