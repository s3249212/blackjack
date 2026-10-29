let baseDeck = Array.from({length: 9}, (_, i) => i + 1).concat(['J', 'Q', 'K', 'A']).flatMap(e => Array.from('♤♡♢♧', s => s + e));
let deck = undefined;
let inPlay = false;
// console.log(deck);

function createShuffledDeck(){
    let i = 0;
    let h = '';
    let deck = [... baseDeck];
    console.log("Shuffling...");
    for (let i = 0; i < 51; i++){
        swapPosition = Math.floor((52 - i) * Math.random()) + i;
        h = deck[i];
        deck[i] = deck[swapPosition];
        deck[swapPosition] = h;
    }
    return deck;
}

function updatePage(hand_dealer, hand_player, reveal_dealer_cards) {
    console.log(hand_dealer);

    if (reveal_dealer_cards) {
        document.getElementById('dealer_cards').textContent = hand_dealer.join(' ');
        document.getElementById('dealer_score').textContent = score(hand_dealer).join(' or ');
    } else {
        document.getElementById('dealer_cards').textContent = hand_dealer[0] + ' ?';
        document.getElementById('dealer_score').textContent = score([hand_dealer[0]]).join(' or ');
    }

    document.getElementById('player_cards').textContent = hand_player.join(' ');
    document.getElementById('player_score').textContent = score(hand_player).join(' or ');
}

console.log(`Shuffled: ${createShuffledDeck()}`);

let hand_dealer = [];
let hand_player = [];

function score(hand){
    // remove suits
    hand = hand.map(e => e[1]);

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

    // every ace can be either 1 or 11, so there will be nAces + 1 possible scores with the lowest being current 'score' and the highest current 'score' plus 10 times 'nAces'
    let scores = Array.from({length: nAces + 1}, (_, i) => score + i * 10);

    return scores;
}

function deal(){
    deck = createShuffledDeck();
    console.log(`Shuffled: ${deck}`);
    hand_dealer = Array.from({length: 2}, _ => deck.pop());
    hand_player = Array.from({length: 2}, _ => deck.pop());
    console.log(`deck size: ${deck.length}`);
    updatePage(hand_dealer, hand_player, false);
    document.getElementById('win_or_lose').textContent = "";
    inPlay = true;
}

function hit(){
    hand_player.push(deck.pop());
    updatePage(hand_dealer, hand_player, false);

    let scores = score(hand_player);

    if (scores.some(e => e === 21)) {
        // win
        inPlay = false;
        updatePage(hand_dealer, hand_player, true);
        document.getElementById('win_or_lose').textContent = "You win";
    } else if (!scores.some(e => e < 21)) {
        // lose
        inPlay = false;
        updatePage(hand_dealer, hand_player, true);
        document.getElementById('win_or_lose').textContent = "You lose";
    } else {
        // continue
    }
}

function dealOrHit(){
    if (!inPlay) {
        deal();
    } else {
        hit();
    }
}

function pass(){
    if (!inPlay){
        return;
    }
    updatePage(hand_dealer, hand_player, true);
    let scoreDealer = score(hand_dealer);
    let scorePlayer = score(hand_player);
    scoreDealer = scoreDealer.filter(e => e <= 21).reduce((agg, cur) => cur > agg? cur: agg, 0);
    scorePlayer = scorePlayer.filter(e => e <= 21).reduce((agg, cur) => cur > agg? cur: agg, 0);
    if (scorePlayer > scoreDealer) {
        // win
        inPlay = false;
        updatePage(hand_dealer, hand_player, true);
        document.getElementById('win_or_lose').textContent = "You win";
    } else {
        // lose
        inPlay = false;
        updatePage(hand_dealer, hand_player, true);
        document.getElementById('win_or_lose').textContent = "You lose";
    }
}

document.getElementById('hit').addEventListener('click', dealOrHit);
document.getElementById('pass').addEventListener('click', pass);
