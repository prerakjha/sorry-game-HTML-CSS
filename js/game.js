let playerX = 50;

let rage = 100;

let gameRunning = false;

let lastTime = 0;
let animationFrame;

/* =========================
   DOM ELEMENTS
========================= */

const gameArea = document.getElementById("game-area");
const player = document.getElementById("player");

const character = document.getElementById("character");
const characterImage = character.querySelector("img");

const rageElement = document.getElementById("rage");

/* =========================
   AUDIO SYSTEM
========================= */

let audioContext = null;
const audioBuffers = {};

const AUDIO_FILES = {
  heart: "assets/audio/heart.mp3",
  anger: "assets/audio/anger.mp3",
  gameStart: "assets/audio/game_start.mp3",
  victory: "assets/audio/victory.mp3",
  gameOver: "assets/audio/game_over.mp3",
  catWalk: "assets/audio/cat_walk.mp3",
};

/*
   Change these values to control
   exactly which part of each audio
   file is played.

   start = starting point in seconds
   duration = how long to play
*/

const SOUND_SETTINGS = {
  heart: {
    start: 0,
    duration: 0.6,
    volume: 0.8,
  },

  anger: {
    start: 0,
    duration: 0.6,
    volume: 0.8,
  },

  gameStart: {
    start: 0,
    duration: 1.5,
    volume: 0.7,
  },

  victory: {
    start: 0,
    duration: 2,
    volume: 0.8,
  },

  gameOver: {
    start: 0,
    duration: 2,
    volume: 0.8,
  },

  catWalk: {
    start: 0,
    duration: 1,
    volume: 0.25,
  },
};

let catWalkSource = null;
let catWalkGain = null;

/* =========================
   INITIALIZE AUDIO
========================= */

async function initializeAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  for (const [name, path] of Object.entries(AUDIO_FILES)) {
    if (audioBuffers[name]) {
      continue;
    }

    try {
      const response = await fetch(path);

      const arrayBuffer = await response.arrayBuffer();

      audioBuffers[name] =
        await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error(
        `Failed to load audio: ${path}`,
        error,
      );
    }
  }
}

/* =========================
   PLAY SOUND
========================= */

function playSound(name) {
  if (!audioContext) {
    return;
  }

  const buffer = audioBuffers[name];

  if (!buffer) {
    return;
  }

  const settings = SOUND_SETTINGS[name];

  if (!settings) {
    return;
  }

  const source = audioContext.createBufferSource();

  const gainNode = audioContext.createGain();

  source.buffer = buffer;

  gainNode.gain.value = settings.volume;

  source.connect(gainNode);

  gainNode.connect(audioContext.destination);

  const startTime = Math.max(
    0,
    settings.start,
  );

  const maxDuration =
    buffer.duration - startTime;

  const duration = Math.min(
    settings.duration,
    maxDuration,
  );

  if (duration <= 0) {
    return;
  }

  source.start(
    0,
    startTime,
    duration,
  );
}

/* =========================
   CAT WALK SOUND
========================= */

function startCatWalkSound() {
  if (!audioContext) {
    return;
  }

  if (!audioBuffers.catWalk) {
    return;
  }

  if (catWalkSource) {
    return;
  }

  const settings = SOUND_SETTINGS.catWalk;

  catWalkSource =
    audioContext.createBufferSource();

  catWalkGain =
    audioContext.createGain();

  catWalkSource.buffer =
    audioBuffers.catWalk;

  catWalkSource.loop = true;

  /*
     Loop only the selected section
     of the walking sound.
  */

  catWalkSource.loopStart =
    settings.start;

  catWalkSource.loopEnd =
    Math.min(
      settings.start + settings.duration,
      audioBuffers.catWalk.duration,
    );

  catWalkGain.gain.value =
    settings.volume;

  catWalkSource.connect(catWalkGain);

  catWalkGain.connect(
    audioContext.destination,
  );

  catWalkSource.start(
    0,
    settings.start,
  );

  catWalkSource.onended = () => {
    catWalkSource = null;
    catWalkGain = null;
  };
}

/* =========================
   STOP CAT WALK SOUND
========================= */

function stopCatWalkSound() {
  if (!catWalkSource) {
    return;
  }

  try {
    catWalkSource.stop();
  } catch (error) {
    /* Already stopped */
  }

  catWalkSource.disconnect();

  if (catWalkGain) {
    catWalkGain.disconnect();
  }

  catWalkSource = null;
  catWalkGain = null;
}

/* =========================
   PLAYER MOVEMENT
========================= */

let moveLeft = false;
let moveRight = false;

const MOVE_SPEED = 50;

/* =========================
   CHARACTER STATE
========================= */

let characterState = "idle";

let facingDirection = 1;

/* =========================
   GAME OBJECTS
========================= */

const objects = [];

const SPAWN_INTERVAL = 0.7;

let spawnTimer = 0;

/* =========================
   KEY DOWN
========================= */

document.addEventListener("keydown", (event) => {
  if (!gameRunning) return;

  if (
    event.code === "KeyA" ||
    event.code === "ArrowLeft"
  ) {
    moveLeft = true;

    setCharacterFacing(-1);

    startCatWalkSound();

    event.preventDefault();
  }

  if (
    event.code === "KeyD" ||
    event.code === "ArrowRight"
  ) {
    moveRight = true;

    setCharacterFacing(1);

    startCatWalkSound();

    event.preventDefault();
  }
});

/* =========================
   KEY UP
========================= */

document.addEventListener("keyup", (event) => {
  if (
    event.code === "KeyA" ||
    event.code === "ArrowLeft"
  ) {
    moveLeft = false;
  }

  if (
    event.code === "KeyD" ||
    event.code === "ArrowRight"
  ) {
    moveRight = false;
  }

  if (!moveLeft && !moveRight) {
    stopCatWalkSound();
  }
});

/* =========================
   START GAME
========================= */

async function startGame() {
  /*
     Initialize audio from the user's
     button interaction.
  */

  await initializeAudio();

  playSound("gameStart");

  rage = 100;

  playerX = 50;

  moveLeft = false;
  moveRight = false;

  spawnTimer = 0;

  gameRunning = true;

  updateRageUI();

  player.style.left = `${playerX}%`;

  /* Reset character */

  facingDirection = 1;

  character.style.transform = "scaleX(1)";

  setCharacterState("idle");

  /* Remove old objects */

  objects.forEach((object) => {
    object.element.remove();
  });

  objects.length = 0;

  /* Remove leftover particles */

  gameArea
    .querySelectorAll(".particle")
    .forEach((particle) => {
      particle.remove();
    });

  /* Remove leftover shake */

  gameArea.classList.remove(
    "screen-shake",
  );

  /* Reset game loop timing */

  lastTime = performance.now();

  /* Start game loop */

  cancelAnimationFrame(animationFrame);

  animationFrame =
    requestAnimationFrame(gameLoop);
}

/* =========================
   MAIN GAME LOOP
========================= */

function gameLoop(currentTime) {
  if (!gameRunning) {
    return;
  }

  /* =========================
     DELTA TIME
  ========================== */

  let deltaTime =
    (currentTime - lastTime) / 1000;

  lastTime = currentTime;

  deltaTime = Math.min(
    deltaTime,
    0.05,
  );

  /* =========================
     UPDATE PLAYER
  ========================== */

  updatePlayer(deltaTime);

  /* =========================
     SPAWN OBJECTS
  ========================== */

  spawnTimer += deltaTime;

  if (spawnTimer >= SPAWN_INTERVAL) {
    spawnTimer = 0;

    spawnObject();
  }

  /* =========================
     UPDATE OBJECTS
  ========================== */

  updateObjects(deltaTime);

  /* =========================
     COLLISION
  ========================== */

  checkCollisions();

  /* =========================
     NEXT FRAME
  ========================== */

  animationFrame =
    requestAnimationFrame(gameLoop);
}

/* =========================
   PLAYER UPDATE
========================= */

function updatePlayer(deltaTime) {
  const isMoving =
    moveLeft || moveRight;

  if (moveLeft) {
    playerX -=
      MOVE_SPEED * deltaTime;

    setCharacterFacing(-1);
  }

  if (moveRight) {
    playerX +=
      MOVE_SPEED * deltaTime;

    setCharacterFacing(1);
  }

  playerX = Math.max(
    5,
    Math.min(95, playerX),
  );

  player.style.left =
    `${playerX}%`;

  if (isMoving) {
    setCharacterState("walking");

    startCatWalkSound();
  } else {
    setCharacterState("idle");

    stopCatWalkSound();
  }
}

/* =========================
   CHARACTER STATE
========================= */

function setCharacterState(state) {
  if (characterState === state) {
    return;
  }

  characterState = state;

  character.classList.remove(
    "idle",
    "walking",
    "hit",
  );

  character.classList.add(state);
}

/* =========================
   CHARACTER FACING
========================= */

function setCharacterFacing(direction) {
  if (
    facingDirection === direction
  ) {
    return;
  }

  facingDirection = direction;

  character.style.transform =
    `scaleX(${facingDirection})`;
}

/* =========================
   CHARACTER HIT
========================= */

function playHitAnimation() {
  character.classList.remove(
    "idle",
    "walking",
    "hit",
  );

  void character.offsetWidth;

  character.classList.add("hit");

  setTimeout(() => {
    if (!gameRunning) {
      return;
    }

    character.classList.remove("hit");

    if (moveLeft || moveRight) {
      character.classList.add(
        "walking",
      );

      characterState = "walking";
    } else {
      character.classList.add(
        "idle",
      );

      characterState = "idle";
    }
  }, 350);
}

/* =========================
   SPAWN OBJECT
========================= */

function spawnObject() {
  const element =
    document.createElement("div");

  element.classList.add(
    "falling-object",
  );

  const isHeart =
    Math.random() < 0.35;

  element.textContent =
    isHeart ? "💗" : "💢";

  element.dataset.type =
    isHeart ? "heart" : "anger";

  const x =
    Math.random() * 90 + 5;

  element.style.left =
    `${x}%`;

  element.style.top =
    "-40px";

  gameArea.appendChild(element);

  const object = {
    element: element,

    x: x,

    y: -40,

    speed: 130,

    type:
      isHeart ? "heart" : "anger",
  };

  objects.push(object);
}

/* =========================
   UPDATE OBJECTS
========================= */

function updateObjects(deltaTime) {
  for (
    let i = objects.length - 1;
    i >= 0;
    i--
  ) {
    const object = objects[i];

    object.y +=
      object.speed * deltaTime;

    object.element.style.top =
      `${object.y}px`;

    if (
      object.y >
      gameArea.clientHeight
    ) {
      object.element.remove();

      objects.splice(i, 1);
    }
  }
}

/* =========================
   COLLISION
========================= */

function checkCollisions() {
  const playerRect =
    player.getBoundingClientRect();

  const playerPaddingX =
    playerRect.width * 0.25;

  const playerPaddingY =
    playerRect.height * 0.15;

  const playerHitbox = {
    left:
      playerRect.left +
      playerPaddingX,

    right:
      playerRect.right -
      playerPaddingX,

    top:
      playerRect.top +
      playerPaddingY,

    bottom:
      playerRect.bottom -
      playerPaddingY,
  };

  for (
    let i = objects.length - 1;
    i >= 0;
    i--
  ) {
    const object = objects[i];

    const objectRect =
      object.element
        .getBoundingClientRect();

    const objectPaddingX =
      objectRect.width * 0.25;

    const objectPaddingY =
      objectRect.height * 0.25;

    const objectHitbox = {
      left:
        objectRect.left +
        objectPaddingX,

      right:
        objectRect.right -
        objectPaddingX,

      top:
        objectRect.top +
        objectPaddingY,

      bottom:
        objectRect.bottom -
        objectPaddingY,
    };

    const collision =
      playerHitbox.left <
        objectHitbox.right &&
      playerHitbox.right >
        objectHitbox.left &&
      playerHitbox.top <
        objectHitbox.bottom &&
      playerHitbox.bottom >
        objectHitbox.top;

    if (collision) {
      object.element.remove();

      objects.splice(i, 1);

      const collisionPoint =
        getCollisionPoint(
          playerRect,
          objectRect,
        );

      if (object.type === "heart") {
        createHeartParticles(
          collisionPoint.x,
          collisionPoint.y,
        );

        collectHeart();
      } else {
        createAngerParticles(
          collisionPoint.x,
          collisionPoint.y,
        );

        shakeScreen();

        hitByAnger();
      }
    }
  }
}

/* =========================
   COLLISION POINT
========================= */

function getCollisionPoint(
  playerRect,
  objectRect,
) {
  const left = Math.max(
    playerRect.left,
    objectRect.left,
  );

  const right = Math.min(
    playerRect.right,
    objectRect.right,
  );

  const top = Math.max(
    playerRect.top,
    objectRect.top,
  );

  const bottom = Math.min(
    playerRect.bottom,
    objectRect.bottom,
  );

  return {
    x: (left + right) / 2,
    y: (top + bottom) / 2,
  };
}

/* =========================
   SCREEN SHAKE
========================= */

function shakeScreen() {
  gameArea.classList.remove(
    "screen-shake",
  );

  void gameArea.offsetWidth;

  gameArea.classList.add(
    "screen-shake",
  );

  setTimeout(() => {
    gameArea.classList.remove(
      "screen-shake",
    );
  }, 300);
}

/* =========================
   PARTICLE SYSTEM
========================= */

function createParticle(
  x,
  y,
  options = {},
) {
  const particle =
    document.createElement("span");

  particle.classList.add(
    "particle",
  );

  particle.textContent =
    options.symbol || "•";

  particle.style.left =
    `${x}px`;

  particle.style.top =
    `${y}px`;

  particle.style.setProperty(
    "--particle-x",
    `${options.velocityX || 0}px`,
  );

  particle.style.setProperty(
    "--particle-y",
    `${options.velocityY || 0}px`,
  );

  particle.style.setProperty(
    "--particle-size",
    `${options.size || 8}px`,
  );

  particle.style.setProperty(
    "--particle-duration",
    `${options.duration || 600}ms`,
  );

  gameArea.appendChild(
    particle,
  );

  setTimeout(() => {
    particle.remove();
  }, options.duration || 600);
}

/* =========================
   HEART PARTICLES
========================= */

function createHeartParticles(
  x,
  y,
) {
  const gameAreaRect =
    gameArea.getBoundingClientRect();

  const localX =
    x - gameAreaRect.left;

  const localY =
    y - gameAreaRect.top;

  const particleSymbols = [
    "♥",
    "•",
    "✦",
  ];

  for (let i = 0; i < 10; i++) {
    const angle =
      Math.random() *
      Math.PI *
      2;

    const speed =
      35 +
      Math.random() * 55;

    createParticle(
      localX,
      localY,
      {
        symbol:
          particleSymbols[
            Math.floor(
              Math.random() *
                particleSymbols.length,
            )
          ],

        velocityX:
          Math.cos(angle) *
          speed,

        velocityY:
          Math.sin(angle) *
          speed,

        size:
          5 +
          Math.random() * 7,

        duration:
          500 +
          Math.random() * 250,
      },
    );
  }
}

/* =========================
   ANGER PARTICLES
========================= */

function createAngerParticles(
  x,
  y,
) {
  const gameAreaRect =
    gameArea.getBoundingClientRect();

  const localX =
    x - gameAreaRect.left;

  const localY =
    y - gameAreaRect.top;

  const particleSymbols = [
    "•",
    "✦",
    "!",
  ];

  for (let i = 0; i < 14; i++) {
    const angle =
      Math.random() *
      Math.PI *
      2;

    const speed =
      50 +
      Math.random() * 80;

    createParticle(
      localX,
      localY,
      {
        symbol:
          particleSymbols[
            Math.floor(
              Math.random() *
                particleSymbols.length,
            )
          ],

        velocityX:
          Math.cos(angle) *
          speed,

        velocityY:
          Math.sin(angle) *
          speed,

        size:
          5 +
          Math.random() * 9,

        duration:
          400 +
          Math.random() * 250,
      },
    );
  }
}

/* =========================
   RAGE UI
========================= */

function updateRageUI() {
  const clampedRage =
    Math.max(
      0,
      Math.min(200, rage),
    );

  rageElement.textContent =
    clampedRage;

  const rageBar =
    document.getElementById(
      "rage-bar",
    );

  if (rageBar) {
    rageBar.style.width =
      `${(clampedRage / 200) * 100}%`;
  }

  const header =
    document.querySelector(
      ".game-header",
    );

  if (header) {
    header.classList.remove(
      "rage-low",
      "rage-medium",
      "rage-high",
      "rage-critical",
    );

    if (clampedRage <= 50) {
      header.classList.add(
        "rage-low",
      );
    } else if (
      clampedRage <= 100
    ) {
      header.classList.add(
        "rage-medium",
      );
    } else if (
      clampedRage <= 150
    ) {
      header.classList.add(
        "rage-high",
      );
    } else {
      header.classList.add(
        "rage-critical",
      );
    }
  }
}

/* =========================
   COLLECT HEART
========================= */

function collectHeart() {
  playSound("heart");

  rage -= 10;

  rage = Math.max(0, rage);

  updateRageUI();

  if (rage <= 0) {
    winGame();
  }
}

/* =========================
   HIT BY ANGER
========================= */

function hitByAnger() {
  playSound("anger");

  playHitAnimation();

  rage += 10;

  rage = Math.min(200, rage);

  updateRageUI();

  if (rage >= 200) {
    gameOver();
  }
}

/* =========================
   GAME OVER
========================= */

function gameOver() {
  gameRunning = false;

  moveLeft = false;
  moveRight = false;

  stopCatWalkSound();

  playSound("gameOver");

  cancelAnimationFrame(
    animationFrame,
  );

  character.classList.remove(
    "idle",
    "walking",
  );

  document
    .getElementById(
      "game-screen",
    )
    .classList.remove("active");

  document
    .getElementById(
      "game-over-screen",
    )
    .classList.add("active");
}

/* =========================
   WIN
========================= */

function winGame() {
  gameRunning = false;

  moveLeft = false;
  moveRight = false;

  stopCatWalkSound();

  playSound("victory");

  cancelAnimationFrame(
    animationFrame,
  );

  character.classList.remove(
    "idle",
    "walking",
  );

  document
    .getElementById(
      "game-screen",
    )
    .classList.remove("active");

  document
    .getElementById(
      "victory-screen",
    )
    .classList.add("active");
}