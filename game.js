const fishImages = [

"images/fish1.png",
"images/fish2.png",
"images/fish3.png",
"images/fish4.png",
"images/fish5.png",
"images/fish6.png",
"images/fish7.png",
"images/fish8.png",
"images/fish9.png",
"images/fish10.png",
"images/fish11.png",
"images/fish12.png"

]

const backImage = "images/back.png"

let cards = [...fishImages, ...fishImages]

cards.sort(() => Math.random() - 0.5)

const board = document.getElementById("game-board")

let firstCard = null
let secondCard = null
let lockBoard = false

cards.forEach(src => {

const card = document.createElement("div")
card.classList.add("card")

card.innerHTML = `

<div class="card-inner">

<div class="card-front">
<img src="${src}">
</div>

<div class="card-back">
<img src="${backImage}">
</div>

</div>

`

card.addEventListener("click", () => flipCard(card, src))

board.appendChild(card)

})

function flipCard(card, src){

if(lockBoard) return
if(card.classList.contains("flipped")) return

card.classList.add("flipped")

if(!firstCard){

firstCard = {card, src}
return

}

secondCard = {card, src}

checkMatch()

}

function checkMatch(){

if(firstCard.src === secondCard.src){

firstCard = null
secondCard = null

}else{

lockBoard = true

setTimeout(()=>{

firstCard.card.classList.remove("flipped")
secondCard.card.classList.remove("flipped")

firstCard = null
secondCard = null

lockBoard = false

},1000)

}

}