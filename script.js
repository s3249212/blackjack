const BASE_DECK = ["♤2", "♡2", "♢2", "♧2", "♤3", "♡3", "♢3", "♧3", "♤4", "♡4", "♢4", "♧4", "♤5", "♡5", "♢5", "♧5", "♤6", "♡6", "♢6", "♧6", "♤7", "♡7", "♢7", "♧7", "♤8", "♡8", "♢8", "♧8", "♤9", "♡9", "♢9", "♧9", "♤10", "♡10", "♢10", "♧10", "♤J", "♡J", "♢J", "♧J", "♤Q", "♡Q", "♢Q", "♧Q", "♤K", "♡K", "♢K", "♧K", "♤A", "♡A", "♢A", "♧A"]
const BLACKJACK = 21;
const DEALER_MINIMUM = 17;
const N_START_CARDS = 2;
const NO_RESULT = 0;
const PLAYER_LOSS = 1;
const STANDOFF = 2;
const PLAYER_WIN = 3;
const PLAYING = 4;

function copyArray(array) {
    let copy = array.slice();
    return copy;
}

class Deck {
    constructor(){
        this._deck = copyArray(BASE_DECK);
        this.shuffle();
    }

    createArrayWithAllCards(){
        // add number 2 thru 9
        let arr = Array.from({length: 9}, (_, i) => i + 2)
        // add letter cards
        arr = arr.concat(['J', 'Q', 'K', 'A'])
        // create for each letter and number in the array a variant for each suit
        arr = arr.flatMap(e => Array.from('♤♡♢♧', s => s + e));
        return arr;
    }

    shuffle() {
        let i = 0;
        let h;
        let l = this._deck.length;
        
        console.log("Shuffling...");
        
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
        return this._deck.pop();
    }
}

class Hand {
    constructor() {
        this._cards = []
    }

    get cards(){
        return this._cards;
    }

    get scores(){
        let score = 0;
        let nAces = 0;
        for (let card of this._cards){
            switch (card[1]) {
                case "A":
                    score += 1;
                    nAces += 1;
                    break;
                case "K":
                case "Q":
                case "J":
                    score += 10;
                    break;
                default:
                    score += Number(card.slice(1));
                    break;
            }
        }

        if (nAces == 0) {
            return [score];
        } else {
            return [score, score + 10];
        }


        // // remove suits
        // let hand = this._cards.map(e => e[1]);

        // // save original number of cards
        // let nCards = hand.length;

        // // remove aces
        // hand = hand.filter(e => e !== "A");

        // // count aces
        // let nAces = nCards - hand.length;

        // // replace king, queen, jack by 10
        // hand = hand.map(e => "KQJ".includes(e) ? 10: e);

        // // replace strings of the number by the actual number
        // hand = hand.map(e => Number(e));

        // // count the score of the hands without aces (reduce has to include an initial value in case there are no non-ace cards)
        // let score = hand.reduce((agg, cur) => agg + cur, 0);
        
        // // every ace is at least worth 1, so add 1 times the number of aces
        // score += nAces;

        // // // every ace can be either 1 or 11, so there will be nAces + 1 possible scores with the lowest being current 'score' and the highest current 'score' plus 10 times 'nAces'
        // // let scores = Array.from({length: nAces + 1}, (_, i) => score + i * 10);
        
        // let scores;
        // if (nAces) {
        //     scores = [score, score + 10];
        // } else {
        //     scores = [score];
        // }

        // return scores;
    }

    get score(){
        return (this.scores.length > 1 && this.scores[1] <= BLACKJACK) ? this.scores[1]: this.scores[0];
    }

    addCard(card){
        this._cards.push(card);
    }
}


class Model {
    constructor() {
        this._observers = [];
        this._status = NO_RESULT;
    }

    reset(){
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
            console.log('invalide hit click')
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
        
        // speler heeft hier sowieso minder dan 21
        if (this.dealer.score > BLACKJACK || this.dealer.score < this.player.score) {
            // speler heeft gewonnen
            this._status = PLAYER_WIN;
        } else if (this.dealer.score > this.player.score){
            // dealer heeft gewonnen (dealer kan hier niet meer dan 21 hebben)
            this._status = PLAYER_LOSS;
        } else {
            // standoff
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
        console.log(this.dealer.cards);
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
            shownCards[1] = '??'
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
        this._element = document.getElementById('winOrLoss');
    }


    set visible(boolean) {
        if (boolean){
            this._element.style.display = 'block';
        } else {
            this._element.style.display = 'none';
        }
    }

    get message(){
        let m = '';
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
        console.log('eventtt')
        if (this._model.isInPlay) {
            this._model.hit();
        } else {
            this._model.reset();
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
        console.log('evednttt')
        if (this._model.isInPlay) {
            this._model.pass();
        }
    }

    set visible(boolean) {
        if (boolean) {
            this._element.style.display = 'block';
        } else {
            this._element.style.display = 'none';
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