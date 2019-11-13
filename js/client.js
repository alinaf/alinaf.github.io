var Client = {};
Client.socket = io.connect();

Client.sendTest = function(){
    console.log("test sent");
    Client.socket.emit('test');
};

Client.askNewPlayer = function(){
    Client.socket.emit('newplayer');
};

Client.startGame = function(tileBag){
    Client.socket.emit('start', tileBag);
};

Client.newTile = function () {
    Client.socket.emit('newtile');
};

Client.sendClick = function(x,y){
  Client.socket.emit('click',{x:x,y:y});
};

Client.submitWord = function(word, score, letterBagTiles, total, dimensions){
  Client.socket.emit('submit',{word: word, score: score, tiles: letterBagTiles, total: total, dimensions: dimensions});
};

Client.socket.on('newtile', function() {
    Game.newTile();
});

Client.socket.on('newplayer',function(data){
    Game.addNewPlayer(data.id,data.x,data.y);
});


Client.socket.on('print',function(data){
   Game.print(data);
});

Client.socket.on('tilebag',function(data){
   Game.setTileBag(data);
});

Client.socket.on('allplayers',function(data){
    for(var i = 0; i < data.length; i++){
        Game.addNewPlayer(data[i].id,data[i].x,data[i].y);
    }

    Client.socket.on('move',function(data){
        Game.movePlayer(data.id,data.x,data.y);
    });

    Client.socket.on('remove',function(id){
        Game.removePlayer(id);
    });
});