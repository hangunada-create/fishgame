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

cards.sort(() => 0.5 - Math.random())

const board = document.getElementById("game-board")

let firstCard = null
let secondCard = null
let lock = false

let time = 0
let timerInterval = null
let matchCount = 0

timerInterval = setInterval(()=>{

time++

document.getElementById("timer").innerText = time

},1000)

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

if(lock) return

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

matchCount++

if(matchCount === 12){

clearInterval(timerInterval)

document.getElementById("game-clear").style.display = "block"

}

firstCard = null
secondCard = null

}else{

lock = true

setTimeout(()=>{

firstCard.card.classList.remove("flipped")
secondCard.card.classList.remove("flipped")

firstCard = null
secondCard = null

lock = false

},1000)

}

}
