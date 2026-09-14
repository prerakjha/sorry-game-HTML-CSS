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
  alert("Congratulations. You have officially been forgiven. Probably.");
});
