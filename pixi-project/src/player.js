
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
    sprite.scale.set(0.5);
    sprite.x = 120 + 50 - idleFrameWidth / 2;
    sprite.y = 480 - idleFrameHeight;
    sprite.animationSpeed = 0.15;
    sprite.play();
    // Direção inicial: 1 = direita, -1 = esquerda
    sprite._direction = 1;

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

    // Hitbox refinada: centralizada, justa ao corpo, com "perdão" nas bordas
    sprite.getCollisionBounds = function() {
        const bounds = this.getLocalBounds();
        const scaleX = Math.abs(this.scale?.x || 1);
        const scaleY = this.scale?.y || 1;
        // Ajuste: hitbox cobre só o tronco/pernas
        const width = bounds.width * scaleX * 0.28; // ainda mais estreito
        const height = bounds.height * scaleY * 0.62; // só tronco e pernas
        const offsetX = (bounds.width * scaleX - width) / 2;
        const offsetY = bounds.height * scaleY * 0.38; // centraliza verticalmente
        return {
            width,
            height,
            offsetX,
            offsetY
        };
    };

    // Método para checar colisão com uma plataforma
    sprite.checkPlatformCollision = function(nextX, nextY, plat) {
        const { width, height, offsetX, offsetY } = this.getCollisionBounds();
        return (
            nextX + offsetX + width > plat.x &&
            nextX + offsetX < plat.x + plat.width &&
            nextY + offsetY + height > plat.y &&
            nextY + offsetY < plat.y + plat.height
        );
    };

    // Método para virar para esquerda/direita suavemente
    // Animação suave de virada com easing e sem múltiplas animações
    sprite._turning = false;
    sprite.faceDirection = function(dir) {
        // dir: 1 = direita, -1 = esquerda
        if (dir !== this._direction && !this._turning) {
            this._turning = true;
            const bounds = this.getLocalBounds();
            const scaleX = Math.abs(this.scale.x);
            let footX;
            if (this._direction === 1) {
                footX = this.x + bounds.width * scaleX;
            } else {
                footX = this.x;
            }
            this._direction = dir;
            const targetScale = scaleX * dir;
            const initialScale = this.scale.x;
            const duration = 4; // frames (~0.5s em 24fps)
            let frame = 0;
            // Easing quadrático
            function easeInOutQuad(t) {
                return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            }
            // x só é ajustado no início e fim
            const startX = this.x;
            const endX = (dir === 1)
                ? footX - bounds.width * scaleX
                : footX;
            const animate = () => {
                frame++;
                const t = Math.min(frame / duration, 1);
                const eased = easeInOutQuad(t);
                this.scale.x = initialScale + (targetScale - initialScale) * eased;
                // x interpolado suavemente
                this.x = startX + (endX - startX) * eased;
                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.scale.x = targetScale;
                    this.x = endX;
                    this._turning = false;
                }
            };
            animate();
        }
    };

    return sprite;
}

export { createPlayer };

