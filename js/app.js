const log = (message) => {
    $('#errorLogs').append(message + '<br/>');
};

class MyLocalStorage {
    myStorage = window.localStorage;
    storageKey = 'mySuperGameResults';

    add(item) {
        let allItems = this.getAll();
        allItems.push(item);
        this.myStorage.setItem(this.storageKey, JSON.stringify(allItems))
    }

    getAll() {
        let currentData = JSON.parse(this.myStorage.getItem(this.storageKey));
        return !currentData ? [] : currentData;
    }
}

class PlayButtons {
    disableStartButton() {
        $('#startGameButton').attr('disabled', 'disabled');
    }
    disableStopButton() {
        $('#stopGameButton').attr('disabled', 'disabled');
    }
    enableStopButton() {
        $('#stopGameButton').attr('disabled', false);
    }
    enableStartButton() {
        $('#startGameButton').attr('disabled', false);
    }
}

class CountDownComponent {
    timeRemaining = 0;
    millisecondsInSecond = 1000;

    start(finishOffset, timeLeftRender, endCallBack, iterationHandler) {
        const currentTime = new Date().getTime();
        const expiredDate = currentTime + finishOffset * this.millisecondsInSecond;

        this.timeRemaining = expiredDate - currentTime;
        const intervalId = setInterval(() => {
            this.timeRemaining -= this.millisecondsInSecond;
            if (this.timeRemaining  <= 0) {
                clearInterval(intervalId);
                if (typeof endCallBack === 'function') {
                    endCallBack()
                }
            }
            if (typeof timeLeftRender === 'function') {
                timeLeftRender(this.timeRemaining  / this.millisecondsInSecond)
            }
            if (typeof iterationHandler === 'function') {
                iterationHandler(intervalId)
            }

        }, this.millisecondsInSecond);
    }
}

class MySuperGame {
    isStarted = false;
    currentPoints = 0;
    gameLengthSeconds = 0;
    initRectCount = 0;
    storage = new MyLocalStorage();
    countDown = new CountDownComponent();
    playButtons = new PlayButtons();

    constructor(props) {
        this.gameLengthSeconds = props.gameLengthSeconds;
        this.initRectCount = props.initRectCount;
        this.renderTimeLeft(props.gameLengthSeconds);
        this.drawCurrentResults();
    }
    drawCurrentResults() {
        self = this;
        let maxDisplayResults = 10;
        this.storage.getAll().forEach(function(item, index){
            if (index < maxDisplayResults) {
                self.appendResultItem(item.name, item.points);
            }
        });
    }
    drawRectangles(count) {
        for(let i = 0; i < count; i++) {
            this.drawOneRectangle();
        }
    }

    drawOneRectangle() {
        let width = this.getRandomNumber(20);
        let height = this.getRandomNumber(20);
        let top = this.getRandomNumber(100);
        let left = this.getRandomNumber(100);
        if (top + height > 100) {
            top -= (top + height) - 100;
        }
        if (left + width > 100) {
            left -= (left + width) - 100;
        }
        let self = this;
        jQuery('<div/>', {
            class: 'inner-rect',
            style: 'width:'+width+'%;height:'+height+'%;background-color:'+this.getRandomColor()+';position:absolute;top:'+top+'%;left:'+left+'%;'
        }).appendTo('#play-area').on('click', function() {
            self.incrPoints();
            $(this).fadeOut();
            if (self.isStarted) {
                self.drawRectangles(self.getRandomNumber(3));// 0 or 1 or 2 new items
            }
        }).fadeIn();
    }

    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    getRandomNumber(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    incrPoints() {
        this.renderCurrentPoints(++this.currentPoints);
    }
    renderCurrentPoints(value) {
        $("#currentPoints").val(value);
    }

    startGame() {
        if (this.isStarted) {
            log('game already started');
            return false;
        }
        this.currentPoints = 0;
        this.renderCurrentPoints(0);
        this.drawRectangles(this.initRectCount);
        this.isStarted = true;
        this.renderTimeLeft(this.gameLengthSeconds);
        this.countDown.start(
            this.gameLengthSeconds,
            this.renderTimeLeft,
            this.finishGame,
            this.iterationHandler
        );
        this.playButtons.disableStartButton();
        this.playButtons.enableStopButton();
        log('Game started')
    }

    finishGame = () => {
        log('Game finished');
        $('.inner-rect').fadeOut();
        this.isStarted = false;
        this.playButtons.enableStartButton();
        this.playButtons.disableStopButton();
        this.showSaveResultModal();
    };

    showSaveResultModal() {
        $('#gameResultScore').text(this.currentPoints);
        this.getResultModal().modal('show');
    }

    saveResult() {
        let name = $('#gamer-name').val();
        if (name) {
            this.appendResultItem(name, this.currentPoints);
            this.getResultModal().modal('hide');
            this.storage.add({name, points: this.currentPoints});
        }
    }

    appendResultItem(name, points) {
        $('#gameResults').append('<li class="list-group-item">' +
            '<span class="badge">' + points + '</span>' + escape(name) + '</li>');
    }

    getResultModal() {
        return $('#saveResultModal');
    }

    iterationHandler = (intervalId) => {
        if (!this.isStarted) {
            clearInterval(intervalId);
        }
    };

    renderTimeLeft = (timeLeft) => {
        $('#timeLeftElement').val(timeLeft);
    }
}

jQuery(document).ready(function(){
    const game = new MySuperGame( {
        gameLengthSeconds: 50,
        initRectCount: 20
    });

    $('#startGameButton').on('click', function(){
        game.startGame();
    });
    $('#stopGameButton').on('click', function(){
        game.finishGame();
    });

    $('#saveResultButton').on('click', function(){
        game.saveResult();
    })
});