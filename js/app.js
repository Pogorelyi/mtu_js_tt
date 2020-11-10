const log = (message) => {
    $('#errorLogs').append(message + '<br/>');
};

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

    start(finishOffSet, timeLeftRender, endCallBack, iterationHandler) {
        const currentTime = new Date().getTime();
        const expiredDate = currentTime + finishOffSet * this.millisecondsInSecond;

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
    gameLength = 5; // seconds
    initRectCount = 40;
    countDown = new CountDownComponent();
    playButtons = new PlayButtons();

    constructor() {
        this.renderTimeLeft(this.gameLength);
    }

    drawRandRectangles() {
        for(let i = 0; i < this.initRectCount; i++) {
            let size = this.getRandomLength(20);
            let top = this.getRandomLength(100);
            let left = this.getRandomLength(100);

            if (top + size > 100) {
                top -= (top + size) - 100;
            }
            if (left + size > 100) {
                left -= (left + size) - 100;
            }
            let self = this;
            jQuery('<div/>', {
                class: 'inner-rect',
                style: 'width:'+size+'%;height:'+size+'%;background-color:'+this.getRandomColor()+';position:absolute;top:'+top+'%;left:'+left+'%;'
            }).appendTo('#play-area').on('click', function() {
                self.incrPoints();
                this.remove();
            });
        }
    }

    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    getRandomLength(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    incrPoints() {
        let curr = this.currentPoints++;
        this.renderCurrentPoints(curr);
    }
    renderCurrentPoints(value) {
        $("#currentPoints").val(value);
    }

    startGame() {
        if (this.isStarted) {
            log('game already started');
            return false;
        }
        this.drawRandRectangles();
        this.isStarted = true;
        this.renderTimeLeft(this.gameLength);
        this.countDown.start(this.gameLength, this.renderTimeLeft, this.finishGame, this.iterationHandler);
        this.playButtons.disableStartButton();
        this.playButtons.enableStopButton();
        log('Game started')
    }

    finishGame = () => {
        log('Game finished');
        $('.inner-rect').remove();
        this.currentPoints = 0;
        this.renderCurrentPoints(0);
        this.isStarted = false;
        this.playButtons.enableStartButton();
        this.playButtons.disableStopButton();
    };

    get points() {
        return this.currentPoints
    }

    iterationHandler = (intervalId) => {
        if (!this.isStarted) {
            clearInterval(intervalId);
        }
    };

    renderTimeLeft = (timeLeft) => {
        $('#timeLeftElement').val(timeLeft);
    }
};

jQuery(document).ready(function(){
    const game = new MySuperGame();

    $('#startGameButton').on('click', function(){
        game.startGame();
    });
    $('#stopGameButton').on('click', function(){
        game.finishGame();
    });
});