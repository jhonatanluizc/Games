
import { Application, Container, Graphics } from "pixi.js";

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
  await app.init({ background: "#5c94fc", width: 800, height: 600 }); // fundo azul Atari, tamanho fixo
  document.getElementById("pixi-container").appendChild(app.canvas);

  // Containers principais
  const gameScene = new Container();
  app.stage.addChild(gameScene);

  // Variáveis do jogo (jogador, plataformas, etc)
  let player, platforms = [];
  // Física simples
  let velocityY = 0;
  const gravity = 1;
  const moveSpeed = 4;
  const jumpStrength = 16;
  let onGround = false;
  // Controles
  const keys = { left: false, right: false, up: false };

  // Objetivo (moeda)
  let goal;
  let goalReached = false;

  // Função para criar o jogador (placeholder)
  function createPlayer() {
    const g = new Graphics();
    // Mario pixelado: chapéu vermelho, cabeça bege, camisa vermelha, calça azul
    // Chapéu
    g.beginFill(0xB22222).drawRect(2, 0, 12, 4).endFill();
    g.beginFill(0xB22222).drawRect(4, 4, 8, 4).endFill();
    // Cabeça
    g.beginFill(0xFFD39B).drawRect(4, 8, 8, 8).endFill();
    // Camisa
    g.beginFill(0xB22222).drawRect(2, 16, 12, 6).endFill();
    // Calça
    g.beginFill(0x1E3A8A).drawRect(2, 22, 12, 8).endFill();
    // Botas
    g.beginFill(0x654321).drawRect(2, 30, 4, 4).endFill();
    g.beginFill(0x654321).drawRect(10, 30, 4, 4).endFill();
    // Bordas
    g.lineStyle(2, 0x000000).drawRect(2, 0, 12, 4); // chapéu
    g.lineStyle(2, 0x000000).drawRect(4, 4, 8, 4); // chapéu
    g.lineStyle(2, 0x000000).drawRect(4, 8, 8, 8); // cabeça
    g.lineStyle(2, 0x000000).drawRect(2, 16, 12, 6); // camisa
    g.lineStyle(2, 0x000000).drawRect(2, 22, 12, 8); // calça
    g.lineStyle(2, 0x000000).drawRect(2, 30, 4, 4); // bota esquerda
    g.lineStyle(2, 0x000000).drawRect(10, 30, 4, 4); // bota direita
    // Posição inicial: sobre a primeira plataforma
    g.x = 120 + 50 - 8; // centro da plat1 menos metade da largura
    g.y = 480 - 34; // topo da plat1 menos altura do personagem (34px)
    // Não definir width/height manualmente!
    return g;
  }

  // Função para criar uma plataforma (placeholder)
  function createPlatform(x, y, w, h) {
    const g = new Graphics();
    // Plataforma marrom com borda preta
    g.lineStyle(3, 0x000000).beginFill(0xA0522D).drawRect(0, 0, w, h).endFill();
    g.x = x;
    g.y = y;
    return g;
  }

  // Inicializa jogador e plataformas
  // player = createPlayer();
  // gameScene.addChild(player);

  // Helper para obter largura/altura reais do player
  function getPlayerBounds() {
    const bounds = player.getLocalBounds();
    return { width: bounds.width, height: bounds.height };
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
  // Adiciona "céu" com nuvens simples (estilo Atari)
  function drawCloud(x, y) {
    const g = new Graphics();
    g.beginFill(0xFFFFFF).drawEllipse(x, y, 24, 10).endFill();
    g.beginFill(0xFFFFFF).drawEllipse(x + 18, y + 2, 16, 8).endFill();
    g.beginFill(0xFFFFFF).drawEllipse(x - 18, y + 2, 16, 8).endFill();
    return g;
  }
  gameScene.addChild(drawCloud(120, 60));
  gameScene.addChild(drawCloud(400, 40));
  gameScene.addChild(drawCloud(700, 70));

  // Inicializa jogador e plataformas
  player = createPlayer();
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
  if (keys.left) nextX -= moveSpeed;
  if (keys.right) nextX += moveSpeed;
  const { width: playerW, height: playerH } = getPlayerBounds();

    // Gravidade
    velocityY += gravity;
    let nextY = player.y + velocityY;

    // Colisão horizontal (simples)
    let blockedX = false;
    for (const plat of platforms) {
      if (
        nextX + playerW > plat.x &&
        nextX < plat.x + plat.width &&
        player.y + playerH > plat.y &&
        player.y < plat.y + plat.height
      ) {
        blockedX = true;
        break;
      }
    }
    if (!blockedX) player.x = nextX;

    // Colisão vertical
    onGround = false;
    let blockedY = false;
    for (const plat of platforms) {
      // Descendo
      if (
        player.x + playerW > plat.x &&
        player.x < plat.x + plat.width &&
        nextY + playerH > plat.y &&
        player.y + playerH <= plat.y
      ) {
        // Colidiu com o topo da plataforma
        player.y = plat.y - playerH;
        velocityY = 0;
        onGround = true;
        blockedY = true;
        break;
      }
      // Subindo (bateu embaixo da plataforma)
      if (
        player.x + playerW > plat.x &&
        player.x < plat.x + plat.width &&
        nextY < plat.y + plat.height &&
        player.y >= plat.y + plat.height
      ) {
        // Impede atravessar de baixo para cima
        player.y = plat.y + plat.height;
        velocityY = 0;
        blockedY = true;
        break;
      }
    }
    if (!blockedY) player.y = nextY;

    // Limita para não sair da tela
  if (player.x < 0) player.x = 0;
  if (player.x + playerW > app.screen.width) player.x = app.screen.width - playerW;
  if (player.y > app.screen.height) player.y = app.screen.height - playerH;

    // Checa se jogador alcançou o objetivo
  const dx = player.x + playerW/2 - goal.x;
  const dy = player.y + playerH/2 - goal.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
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
