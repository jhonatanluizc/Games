import { Application, Container, Graphics, Sprite, Texture, TextureSource, Assets, Rectangle, AnimatedSprite } from "pixi.js";
import { createPlayer } from "./player.js";

// Música de fundo
let bgm;

(async () => {
  // Inicializa o app Pixi.js
  // Inicia música de fundo
  if (!bgm) {
    bgm = new Audio("/sound/florest.mp3");
    bgm.loop = true;
    bgm.volume = 0.5;
    // Tentar tocar após interação do usuário (requisito de navegadores)
    function tryPlayBgm() {
      if (bgm.paused) {
        bgm.play().catch((e) => {
          console.warn("Falha ao tocar música de fundo:", e);
        });
      }
    }
    window.addEventListener("pointerdown", tryPlayBgm, { once: true });
    window.addEventListener("keydown", tryPlayBgm, { once: true });
  }
  const app = new Application();


  await app.init({ background: "#5c94fc", width: 800, height: 600 }); // fundo azul Atari, tamanho 
  // fixo
  app.ticker.maxFPS = 24; // Limita a 24 FPS para estilo retrô

  document.getElementById("pixi-container").appendChild(app.canvas);

  // Adiciona o background.png como fundo
  const bgtexture = await Assets.load('/assets/background.png');
  const bgSprite = new Sprite(bgtexture);
  bgSprite.width = 800;
  bgSprite.height = 600;
  app.stage.addChild(bgSprite);

  // Containers principais
  const gameScene = new Container();
  app.stage.addChild(gameScene);

  // Variáveis do jogo (jogador, plataformas, etc)
  let player, platforms = [];


  // Física simples
  let velocityY = 0;
  const gravity = 1;
  const moveSpeed = 4;
  const jumpStrength = 10;
  let onGround = false;

  // Controles
  const keys = { left: false, right: false, up: false };

  // Objetivo (moeda)
  let goal;
  let goalReached = false;

  // Função para criar uma plataforma (placeholder)
  function createPlatform(x, y, w, h) {
    const g = new Graphics();
    // Plataforma marrom com borda preta
    g.lineStyle(3, 0x000000).beginFill(0xA0522D).drawRect(0, 0, w, h).endFill();
    g.x = x;
    g.y = y;
    return g;
  }



  // Cria objetivo (moeda)
  function createGoal(x, y) {
    const g = new Graphics();
    // Moeda amarela com borda preta
    g.lineStyle(3, 0x000000).beginFill(0xFFD700).drawCircle(0, 0, 12).endFill();
    g.x = x;
    g.y = y;
    return g;
  }

  // Inicializa jogador e plataformas
  player = await createPlayer();
  gameScene.addChild(player);

  // Cria objetivo (moeda)
  goal = createGoal(750, 460);
  gameScene.addChild(goal);
  goal = createGoal(750, app.screen.height - 140);
  gameScene.addChild(goal);

  // Plataforma "chão"
  const ground = createPlatform(0, 560, 800, 40);
  platforms.push(ground);
  gameScene.addChild(ground);

  // Plataformas estáticas adicionais
  const plat1 = createPlatform(120, 480, 100, 20);
  platforms.push(plat1);
  gameScene.addChild(plat1);

  const plat2 = createPlatform(300, 400, 100, 20);
  platforms.push(plat2);
  gameScene.addChild(plat2);

  const plat3 = createPlatform(500, 340, 100, 20);
  platforms.push(plat3);
  gameScene.addChild(plat3);

  const plat4 = createPlatform(700, 500, 80, 20);
  platforms.push(plat4);
  gameScene.addChild(plat4);

  // Loop principal do jogo
  app.ticker.add((delta) => {
    if (goalReached) return;
    // Movimento horizontal
    let nextX = player.x;
    let moving = false;
    if (keys.left) {
      nextX -= moveSpeed;
      moving = true;
      if (player.setWalk) player.setWalk();
      if (player.faceDirection) player.faceDirection(-1); // vira para esquerda
    }
    if (keys.right) {
      nextX += moveSpeed;
      moving = true;
      if (player.setWalk) player.setWalk();
      if (player.faceDirection) player.faceDirection(1); // vira para direita
    }
    if (!keys.left && !keys.right) {
      if (player.setIdle) player.setIdle();
    }
    const { width: playerW, height: playerH, offsetX, offsetY } = player.getCollisionBounds();

    // Gravidade
    velocityY += gravity;
    let nextY = player.y + velocityY;

    // Colisão horizontal (usando método do player)
    let blockedX = false;
    for (const plat of platforms) {
      if (player.checkPlatformCollision(nextX, player.y, plat)) {
        blockedX = true;
        // Permite "deslizar" ao lado da plataforma
        // Se está indo para a direita, encosta na borda esquerda da plataforma
        if (nextX > player.x) {
          player.x = plat.x - offsetX - playerW - 0.1;
        } else if (nextX < player.x) {
          player.x = plat.x + plat.width - offsetX + 0.1;
        }
        break;
      }
    }
    if (!blockedX) player.x = nextX;

    // Colisão vertical (usando método do player)
    onGround = false;
    let blockedY = false;
    for (const plat of platforms) {
      // Descendo
      if (
        player.checkPlatformCollision(player.x, nextY, plat) &&
        nextY > player.y
      ) {
        // Colidiu com o topo da plataforma
        player.y = plat.y - offsetY - playerH;
        velocityY = 0;
        onGround = true;
        blockedY = true;
        break;
      }
      // Subindo (bateu embaixo da plataforma)
      if (
        player.checkPlatformCollision(player.x, nextY, plat) &&
        nextY < player.y
      ) {
        // Impede atravessar de baixo para cima
        player.y = plat.y + plat.height - offsetY;
        velocityY = 0;
        blockedY = true;
        break;
      }
    }
    if (!blockedY) player.y = nextY;

    // Limita para não sair da tela
    if (player.x < 0) player.x = 0;
    if (player.x + offsetX + playerW > app.screen.width) player.x = app.screen.width - playerW - offsetX;
    if (player.y > app.screen.height) player.y = app.screen.height - playerH;

    // Checa se jogador alcançou o objetivo
    const dx = player.x + offsetX + playerW / 2 - goal.x;
    const dy = player.y + offsetY + playerH / 2 - goal.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 28) {
      goalReached = true;
      goal.tint = 0x00FF00;
      setTimeout(() => {
        alert("Parabéns! Você venceu!");
      }, 100);
    }
  });

  // Eventos de teclado
  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft") keys.left = true;
    if (e.code === "ArrowRight") keys.right = true;
    if (e.code === "ArrowUp" || e.code === "Space") {
      if (onGround) {
        velocityY = -jumpStrength;
      }
      keys.up = true;
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft") keys.left = false;
    if (e.code === "ArrowRight") keys.right = false;
    if (e.code === "ArrowUp" || e.code === "Space") keys.up = false;
  });
})();
