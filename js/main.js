const screens = document.querySelectorAll(".screen");

function showScreen(screenId) {
  screens.forEach((screen) => {
    screen.classList.remove("active");
  });

  document.getElementById(screenId).classList.add("active");
}

/* =========================
   START GAME
========================= */

document.getElementById("start-button").addEventListener("click", () => {
  showScreen("game-screen");

  startGame();
});

/* =========================
   RETRY
========================= */

document.getElementById("retry-button").addEventListener("click", () => {
  showScreen("game-screen");

  startGame();
});

/* =========================
   VICTORY
========================= */

document.getElementById("apology-button").addEventListener("click", () => {
  showScreen("apology-screen");
});

/* =========================
   FINAL BUTTON
========================= */

document.getElementById("final-button").addEventListener("click", () => {
  alert("Congratulations. Popcorn has officially been forgiven. Probably. Hope So. Please God.");
});

const noButton = document.querySelector(".no-button");

noButton.addEventListener("click", () => {
  console.log("NO BUTTON CLICKED");
  noButton.classList.add("falling");
});
