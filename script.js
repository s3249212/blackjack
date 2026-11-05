const BASE_DECK = ["♤2", "♡2", "♢2", "♧2", "♤3", "♡3", "♢3", "♧3", "♤4", "♡4", "♢4", "♧4", "♤5", "♡5", "♢5", "♧5", "♤6", "♡6", "♢6", "♧6", "♤7", "♡7", "♢7", "♧7", "♤8", "♡8", "♢8", "♧8", "♤9", "♡9", "♢9", "♧9", "♤10", "♡10", "♢10", "♧10", "♤J", "♡J", "♢J", "♧J", "♤Q", "♡Q", "♢Q", "♧Q", "♤K", "♡K", "♢K", "♧K", "♤A", "♡A", "♢A", "♧A"]

const BLACKJACK = 21;
const DEALER_MINIMUM = 17;
const N_START_CARDS = 2;

const DISPLAY_HIDDEN = 'none';
const DISPLAY_VISIBLE = 'inline';

const NO_RESULT = 0;
const PLAYER_LOSS = 1;
const STANDOFF = 2;
const PLAYER_WIN = 3;
const PLAYING = 4;

function copyArray(array) {
    let copy = array.slice();
    return copy;
}

// model
class Deck {
    constructor(){
        this._deck = copyArray(BASE_DECK);
        this.shuffle();
    }

    shuffle() {
        let i = 0;
        let h;
        let l = this._deck.length;
        
        // go through the deck 'from left to right' and for each card either keep that card in position or swap it with a random card to the right of it
        for (let i = 0; i < l - 1; i++){
            // find the 'swap partner', the range includes i, so there is an equal chance it picks i as any card card to the right of it
            let swapPosition = Math.floor((l - i) * Math.random()) + i;
            // perform the swap
            h = this._deck[i];
            this._deck[i] = this._deck[swapPosition];
            this._deck[swapPosition] = h;
        }
    }

    draw(){
        if(this._deck.length === 0) {
            console.log('Out of cards')
            return undefined;
        } else {
            return this._deck.pop();
        }
    }
}

function scoreCard(card){
    switch (card[1]) {
        case "A":
            return 1;
        case "K":
        case "Q":
        case "J":
            return 10;
        default:
            return Number(card.slice(1));
    }
}

function isAce(card) {
    return card[1] === 'A';
}

class Hand {
    constructor() {
        this._cards = []
        this._baseScore = 0;
        this._nAces = 0;

        this._possibleScores = [];
        this._bestScore = 0;

    }
    
    addCard(card){
        this._cards.push(card);

        this._baseScore += scoreCard(card);
        if (isAce(card)){
            this._nAces++;
        }

        this.updateScores();
        this.updateScore();
    }

    // possible scores
    //  - since each ace is worth at least 1 but can optionally add another 10,
    //  - aces create [number of aces] + 1 possible scores
    //  - we only need to give the first two options if BLACKJACK is 21 (or lower) but since we want to make it flexible we give all options
    updateScores(){
        this._possibleScores = [];
        for (let i = 0; i <= this._nAces; i++){
            this._possibleScores.push(this._baseScore + i * 10);
        }
    }

    // current best score
    // - the scores will always be in ascending order
    // - therefore, if we go through the scores from back to front and pick the first option that is less than or equal to BLACKJACK, we have found our best score
    // - if no score is less than or equal to BLACKJACK, we will have lost but we still need to return a value. We simply pick the first score in the list, since there is guaranteed to at least be one score in the list, and it will also be the one that is closest to BLACKJACK
    updateScore(){
        this._bestScore = undefined;

        for (let i = this._possibleScores.length - 1; i >= 0; i--){
            if (this._possibleScores[i] <= BLACKJACK) {
                this._bestScore = this._possibleScores[i];
                break;
            }
        }

        if (this._bestScore === undefined){
            this._bestScore = this._possibleScores[0];
        }
    }

    get cards(){
        return this._cards;
    }

    get scores(){
        return this._possibleScores;
    }

    get score(){
        return this._bestScore;
    }   
}

class Model {
    constructor() {
        this._observers = [];
        this._status = NO_RESULT;
    }

    deal(){
        this._status = PLAYING;

        this._deck = new Deck();

        this.player = new Hand();
        this.dealer = new Hand();
        
        for (let i = 0; i < N_START_CARDS; i++){
            this.player.addCard(this._deck.draw());
            this.dealer.addCard(this._deck.draw());
        }

        this.update();
    }

    hit(){
        if (!this.isInPlay) {
            return;
        }

        this.player.addCard(this._deck.draw());
        this._validate();
        
        this.update();
    }

    pass(){
        if (!this.isInPlay) {
            return;
        }

        while (this.dealer.score < DEALER_MINIMUM) {
            this.dealer.addCard(this._deck.draw());
        }
        
        // the player is guaranteed to have less than 21 at this point
        if (this.dealer.score > BLACKJACK || this.dealer.score < this.player.score) {
            this._status = PLAYER_WIN;
        } else if (this.dealer.score > this.player.score){
            this._status = PLAYER_LOSS;
        } else {
            this._status = STANDOFF;
        }

        this.update();
    }

    _validate(){
        if (this.player.score > BLACKJACK) {
            this._status = PLAYER_LOSS;
        } else if (this.player.score == BLACKJACK) {
            this._status = PLAYER_WIN;
        }
    }

    addObserver(observer) {
        this._observers.push(observer);
    }

    update(){
        this._observers.forEach(e => e.update());
    }

    get isInPlay() {
        return this.status === PLAYING;
    }

    get status() {
        return this._status;
    }
}

// View
class PlayerCardsView {
    constructor(model) {
        this._model = model;
        this._element = document.getElementById('player_cards');
    }

    update() {
        this._element.textContent = this._model.player.cards.join(' ');
    }
}

class DealerCardsView {
    constructor(model) {
        this._model = model;
        this._element = document.getElementById('dealer_cards');
    }

    update() {
        let shownCards = copyArray(this._model.dealer.cards);
        if (this._model.isInPlay){
            shownCards[shownCards.length - 1] = '??'
        }
        this._element.textContent = shownCards.join(' ');
    }
}

class PlayerScoreView {
    constructor(model) { 
        this._model = model;
        this._element = document.getElementById('player_score');
    }

    update() {
        if (this._model.isInPlay) {
            let possibleScores = this._model.player.scores;
            this._element.textContent = possibleScores.join(' or ');
        } else {
            let bestScore = this._model.player.score;
            this._element.textContent = bestScore;
        }
    }
}

class DealerScoreView {
    constructor(model) { 
        this._model = model;
        this._element = document.getElementById('dealer_score');
    }

    update() {
        if (this._model.isInPlay) {
            this._element.textContent = '?';
        } else {
            let bestScore = this._model.dealer.score;
            this._element.textContent = bestScore;
        }
    }
}

class EndResultView {
    constructor(model) {
        this._model = model;
        this._element = document.getElementById('win_or_loss');
    }

    set visible(boolean) {
        if (boolean){
            this._element.style.display = DISPLAY_VISIBLE;
        } else {
            this._element.style.display = DISPLAY_HIDDEN;
        }
    }

    get message(){
        let m;
        switch (this._model.status) {
            case PLAYER_WIN:
                m = "Je hebt gewonnen";
                break;
            case PLAYER_LOSS:
                m = "Je hebt verloren";
                break;
            case STANDOFF:
                m = "Het is gelijkspel";
                break;
            default:
                m = "Dit wordt als het goed is niet weer gegeven.";
                break;
        }
        return m;
    }

    update() {
        if (this._model.isInPlay) {
            this.visible = false;
        } else {
            this.visible = true;
            this._element.textContent = this.message;
        }
    }
}

// controller
class DealOrHitButton {
    constructor(model, element) {
        this._model = model;
        this._element = element;
    }

    handleEvent(_) {
        if (this._model.isInPlay) {
            this._model.hit();
        } else {
            this._model.deal();
        }
    }

    update(){
        if (this._model.isInPlay) {
            this._element.textContent = 'Hit';
        } else {
            this._element.textContent = 'Delen';
        }
    }
}

class PassButton {
    constructor(model, element) {
        this._model = model;
        this._element = element;
    }

    handleEvent(_) {
        if (this._model.isInPlay) {
            this._model.pass();
        }
    }

    set visible(boolean) {
        if (boolean) {
            this._element.style.display = DISPLAY_VISIBLE;
        } else {
            this._element.style.display = DISPLAY_HIDDEN;
        }
    }

    update() {
        this.visible = this._model.isInPlay;
    }
}

let model = new Model();

model.addObserver(new PlayerCardsView(model));
model.addObserver(new DealerCardsView(model));
model.addObserver(new PlayerScoreView(model));
model.addObserver(new DealerScoreView(model));
model.addObserver(new EndResultView(model));

let dealButtonElement = document.getElementById('deal_or_hit_button');
let passButtonElement = document.getElementById('pass_button');

let dealButton = new DealOrHitButton(model, dealButtonElement);
let passButton = new PassButton(model, passButtonElement);

dealButtonElement.addEventListener('click', dealButton);
passButtonElement.addEventListener('click', passButton);

model.addObserver(dealButton);
model.addObserver(passButton);