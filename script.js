


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
    }

    reset(){
        this._status = 0;
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
        this.player.addCard(this._deck.draw());
        this._validate();
        this.update();
    }

    pass(){
        
    }

    _validate(){
        if (this.player.score > 21) {
            this._status = -1;
        } else if (this.player.score == 21) {
            this._status = 1;
        }
    }

    addListener(listener) {
        this._listeners.push(listener);
    }

    update(){
        this._listeners.forEach(e => e.update());
    }

    get isInPlay() {
        return this._status == 0;
    }

    get result() {
        if (this._status == -1) {
            return 'loss';
        } else if (this._status == 1) {
            return 'win';
        } else {
            return 'still playing...';
        }
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
        this._playerCardsField.textContent = this._model.player.cards.join(' ');
        if (this._model.isInPlay) {
            this._dealerCardsField.textContent = this._model.dealer.cards.join(' ');
        } else {
            this._dealerCardsField.textContent = this._model.dealer.cards[0] + ' ?';
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
            this._endResultField.textContent = model.result;
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

class Controller {
    

    constructor(model) {
        this._model = model;
        this._dealHitButton = document.getElementById('hit');
        this._passButton = document.getElementById('pass');
        this._dealHitButton.addEventListener('click', new DealOrHit(model));
        this._passButton.addEventListener('click', this.pass);
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
        return;
    }
}

let model = new Model();
let view = new View(model);
model.addListener(view);
let controller = new Controller(model);