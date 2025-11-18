
import { AnimatedSprite, Assets, Rectangle, Texture } from "pixi.js";

async function createPlayer() {
    // Carrega spritesheets
    const idleSheet = await Assets.load('/assets/characters/player/idle.png');
    const walkSheet = await Assets.load('/assets/characters/player/walking.png');

    // Idle
    const idleFrames = 5;
    const idleFrameWidth = idleSheet.width / idleFrames;
    const idleFrameHeight = idleSheet.height;
    let idleTextures = [];
    for (let i = 0; i < idleFrames; i++) {
        idleTextures.push(new Texture({ source: idleSheet.source, frame: new Rectangle(idleFrameWidth * i, 0, idleFrameWidth, idleFrameHeight) }));
    }

    // Walk
    const walkFrames = 5; // ajuste se necessário
    const walkFrameWidth = walkSheet.width / walkFrames;
    const walkFrameHeight = walkSheet.height;
    let walkTextures = [];
    for (let i = 0; i < walkFrames; i++) {
        walkTextures.push(new Texture({ source: walkSheet.source, frame: new Rectangle(walkFrameWidth * i, 0, walkFrameWidth, walkFrameHeight) }));
    }

    // Cria AnimatedSprite com idle por padrão
    const sprite = new AnimatedSprite(idleTextures);
    sprite.x = 120 + 50 - idleFrameWidth / 2;
    sprite.y = 480 - idleFrameHeight;
    sprite.animationSpeed = 0.15;
    sprite.play();

    // Métodos para trocar animação
    sprite.setIdle = function() {
        if (sprite.textures !== idleTextures) {
            sprite.textures = idleTextures;
            sprite.animationSpeed = 0.15;
            sprite.play();
        }
    };
    sprite.setWalk = function() {
        if (sprite.textures !== walkTextures) {
            sprite.textures = walkTextures;
            sprite.animationSpeed = 0.18;
            sprite.play();
        }
    };

    return sprite;
}

export { createPlayer };

