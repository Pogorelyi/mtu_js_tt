const log = (message) => {
    $('#errorLogs').append(message + '<br/>');
};

class MyLocalStorage {
    myStorage = window.localStorage;
    storageKey = 'default';

    constructor(storageKey) {
        this.storageKey = storageKey;
    }

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
    startButton = null;
    stopButton = null;
    saveResults = null;

    constructor(props) {
        this.startButton = props.startButton;
        this.stopButton = props.stopButton;
        this.saveResults = props.saveResults;
    }
    bindStartEvent(startMethod) {
        if (typeof startMethod === 'function') {
            this.startButton.on('click', startMethod);
        }
    }
    bindStopEvent(stopMethod) {
        if (typeof stopMethod === 'function') {
            this.stopButton.on('click', stopMethod);
        }
    }
    bindSaveResultEvent(saveMethod) {
        if (typeof saveMethod === 'function') {
            this.saveResults.on('click', saveMethod);
        }
    }
    onStart() {
        this.disableStartButton();
        this.enableStopButton()
    }
    onFinish() {
        this.enableStartButton();
        this.disableStopButton();
    }
    disableStartButton = () => this.startButton.attr('disabled', 'disabled');
    disableStopButton = () =>  this.stopButton.attr('disabled', 'disabled');
    enableStopButton = () => this.stopButton.attr('disabled', false);
    enableStartButton = () => this.startButton.attr('disabled', false);
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
    _currentPoints = 0;
    gameLengthSeconds = 0;
    initRectCount = 0;
    storage = new MyLocalStorage('mySuperGameResults');
    countDown = new CountDownComponent();
    playButtons = null;

    constructor(gameLengthSeconds, initRectCount, playButtons) {
        this.gameLengthSeconds = gameLengthSeconds;
        this.initRectCount = initRectCount;
        this.initButtons(playButtons);
        this.renderTimeLeft(gameLengthSeconds);
        this.drawCurrentResults();
    }

    initButtons(buttons) {
        this.playButtons = buttons;
        this.playButtons.bindStartEvent(this.startGame);
        this.playButtons.bindStopEvent(this.finishGame);
        this.playButtons.bindSaveResultEvent(this.saveResult);
    }

    drawCurrentResults() {
        self = this;
        let maxDisplayResults = 10;
        $('#gameResults').html('');
        this.storage.getAll().reverse().forEach(function(item, index) {
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

        // draw item only inside play area
        if (top + height > 100) {
            top -= (top + height) - 100;
        }
        if (left + width > 100) {
            left -= (left + width) - 100;
        }
        let self = this;
        jQuery('<div/>', {
            class: 'inner-rect',
            style: 'width:' + width + '%;height:' + height + '%;background-color:' + this.getRandomColor() + ';position:absolute;top:' + top + '%;left:' + left + '%;'
        }).appendTo('#play-area').on('click', function () {
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

    set currentPoints(value) {
        this._currentPoints = parseInt(value);
        this.renderCurrentPoints(this._currentPoints);
    }

    get currentPoints() {
        return parseInt(this._currentPoints);
    }

    renderCurrentPoints = (value) => $("#currentPoints").val(value);

    startGame = () => {
        if (this.isStarted) {
            log('game already started');
            return false;
        }
        this.isStarted = true;
        this.currentPoints = 0;
        this.drawRectangles(this.initRectCount);
        this.renderTimeLeft(this.gameLengthSeconds);
        this.startCountDown();
        this.playButtons.onStart();
        log('Game started');
    };

    startCountDown() {
        this.countDown.start(
            this.gameLengthSeconds,
            this.renderTimeLeft,
            this.finishGame,
            this.iterationHandler
        );
    }

    finishGame = () => {
        log('Game finished');
        this.hideAllRectangles();
        this.isStarted = false;
        this.playButtons.onFinish();
        this.showSaveResultModal();
    };

    hideAllRectangles = () => $('.inner-rect').fadeOut();

    showSaveResultModal() {
        $('#gameResultScore').text(this.currentPoints);
        this.getResultModal().modal('show');
    }

    saveResult = () => {
        let name = $('#gamer-name').val();
        if (name) {
            this.getResultModal().modal('hide');
            this.storage.add({name, points: this.currentPoints});
            this.drawCurrentResults();
        }
    };

    appendResultItem(name, points) {
        $('#gameResults').append('<li class="list-group-item">' +
            '<span class="badge">' + points + '</span>' + name + '</li>');
    }

    getResultModal() {
        return $('#saveResultModal');
    }

    iterationHandler = (intervalId) => {
        if (!this.isStarted) {
            clearInterval(intervalId);
        }
    };

    renderTimeLeft = (timeLeft) => $('#timeLeftElement').val(timeLeft);
}

jQuery(document).ready(function() {
    const buttons = new PlayButtons({
        startButton: $('#startGameButton'),
        stopButton: $('#stopGameButton'),
        saveResults: $('#saveResultButton'),
    });

    const game = new MySuperGame(50, 20, buttons);
});