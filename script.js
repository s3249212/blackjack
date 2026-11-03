const BLACKJACK = 21;
const NO_RESULT = 0;
const PLAYER_LOSS = 1;
const STANDOFF = 2;
const PLAYER_WIN = 3;


class Deck {
    constructor(){
        this._deck = this.createArrayWithAllCards();
        this.shuffle();
    }

    createArrayWithAllCards(){
        // add number 2 thru 9
        let arr = Array.from({length: 8}, (_, i) => i + 2)
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
        // remove suits
        let hand = this._cards.map(e => e[1]);

        // save original number of cards
        let nCards = hand.length;

        // remove aces
        hand = hand.filter(e => e !== "A");

        // count aces
        let nAces = nCards - hand.length;

        // replace king, queen, jack by 10
        hand = hand.map(e => "KQJ".includes(e) ? 10: e);

        // replace strings of the number by the actual number
        hand = hand.map(e => Number(e));

        // count the score of the hands without aces (reduce has to include an initial value in case there are no non-ace cards)
        let score = hand.reduce((agg, cur) => agg + cur, 0);
        
        // every ace is at least worth 1, so add 1 times the number of aces
        score += nAces;

        // // every ace can be either 1 or 11, so there will be nAces + 1 possible scores with the lowest being current 'score' and the highest current 'score' plus 10 times 'nAces'
        // let scores = Array.from({length: nAces + 1}, (_, i) => score + i * 10);
        
        let scores;
        if (nAces) {
            scores = [score, score + 10];
        } else {
            scores = [score];
        }

        return scores;
    }

    get score(){
        return (this.scores.length == 2 && this.scores[1] <= 21) ? this.scores[1]: this.scores[0];
    }

    addCard(card){
        this._cards.push(card);
    }
}


class Model {
    constructor() {
        this._listeners = [];
        this._inPlay = false;
        this._result = NO_RESULT;
    }

    reset(){
        this._inPlay = true;
        this._status = NO_RESULT;
        this._deck = new Deck();
        this.player = new Hand();
        this.dealer = new Hand();
        
        for (let i = 0; i < 2; i++){
            this.player.addCard(this._deck.draw());
            this.dealer.addCard(this._deck.draw());
        }
        this.update();
    }

    hit(){
        if (!this._inPlay) {
            return;
        }
        this.player.addCard(this._deck.draw());
        this._validate();
        this.update();
    }

    pass(){
        if (!this._inPlay) {
            return;
        }
        while (this.dealer.score < 17) {
            this.dealer.addCard(this._deck.draw());
        }
        
        // speler heeft hier sowieso minder dan 21
        if (this.dealer.score > 21 || this.dealer.score < this.player.score) {
            // speler heeft gewonnen
            this._result = PLAYER_WIN;
        } else if (this.dealer.score > this.player.score){
            // dealer heeft gewonnen (dealer kan hier niet meer dan 21 hebben)
            this._result = PLAYER_LOSS;
        } else {
            // standoff
            this._result = STANDOFF;
        }
        this._inPlay = false;

        this.update();
    }

    _validate(){
        if (this.player.score > 21) {
            this._result = PLAYER_LOSS;
        this._inPlay = false;
        } else if (this.player.score == 21) {
            this._result = PLAYER_WIN;
        this._inPlay = false;
        }
    }

    addListener(listener) {
        this._listeners.push(listener);
    }

    update(){
        console.log(this.dealer.cards);
        this._listeners.forEach(e => e.update());
    }

    get isInPlay() {
        return this._inPlay;
    }

    get result() {
        return this._result;
    }
}

class View {
    constructor(model) {
        this._model = model;
        this._playerCardsField = document.getElementById('player_cards');
        this._playerScoreField = document.getElementById('player_score');
        this._dealerCardsField = document.getElementById('dealer_cards');
        this._dealerScoreField = document.getElementById('dealer_score');
        this._endResultField = document.getElementById('winOrLoss');
        this._dealHitButton = document.getElementById('hit');
    }

    update(){
        // display cards
        console.log(`view.update inplay? -> ${this._model.isInPlay}`);
        this._playerCardsField.textContent = this._model.player.cards.join(' ');
        if (this._model.isInPlay) {
            this._dealerCardsField.textContent = this._model.dealer.cards[0] + ' ?';
        } else {
            this._dealerCardsField.textContent = this._model.dealer.cards.join(' ');
        }
         

        // display score
        if (this._model.isInPlay) {
            this._playerScoreField.textContent = this._model.player.scores.join(' or ');
            this._dealerScoreField.textContent = '?';
        } else {
            this._playerScoreField.textContent = this._model.player.score;
            this._dealerScoreField.textContent = this._model.dealer.score;
        }
        
        // display result
        if (this._model.isInPlay){
            console.log('is in play')
            this._endResultField.style.display = 'none';
            console.log(this._endResultField.display);
        } else {
            this._endResultField.style.display = 'block';
            switch (this._model.result) {
                case PLAYER_WIN:
                    this._endResultField.textContent = "Je hebt gewonnen";
                    break;
                case PLAYER_LOSS:
                    this._endResultField.textContent = "Je hebt verloren";
                    break;
                case STANDOFF:
                    this._endResultField.textContent = "Het is gelijkspel";
                    break;
                default:
                    this._endResultField.textContent = "Dit wordt als het goed is niet weer gegeven.";
                    break;
            }
        }
        
        // change button text from deal to hit and back
        if (this._model.isInPlay){
            this._dealHitButton.textContent = "Hit";
        } else {
            this._dealHitButton.textContent = "Delen";
        }
    }
}

class DealOrHit {
    constructor(model) {
        this._model = model;
    }

    handleEvent(event) {
        console.log('ddd')
        console.log(this._model);
        console.log(this._model._listeners)
        if (this._model.isInPlay) {
            this._model.hit();
        } else {
            this._model.reset();
        }
    }
}

class PassButton {
    constructor(model) {
        this._model = model;
    }

    handleEvent(event) {
        if (this._model.isInPlay) {
            this._model.pass();
        }
    }
}

class Controller {
    

    constructor(model) {
        this._model = model;
        this._dealHitButton = document.getElementById('hit');
        this._passButton = document.getElementById('pass');
        this._dealHitButton.addEventListener('click', new DealOrHit(model));
        this._passButton.addEventListener('click', new PassButton(model));
    }

    dealOrHit(){
        console.log('ddd')
        console.log(this._model);
        if (this._model.isInPlay) {
            this._model.hit();
        } else {
            this._model.reset();
        }
    }

    pass() {
        this._model.pass();
    }
}

let model = new Model();
let view = new View(model);
model.addListener(view);
let controller = new Controller(model);