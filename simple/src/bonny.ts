import { Application, Assets, Sprite } from "pixi.js";

// Bonny class encapsulating the application logic
class Bonny {

    // Private properties
    private app: Application | null = null;
    private bunny: Sprite | null = null;
    private _background: string;

    // Constructor with optional background parameter
    constructor({ background = "#1099bb" } = {}) {
        this._background = background;
    }

    // Getter and Setter for background property
    public set background(value: string) {
        this._background = value;
    }

    // Getter for background property
    public get background(): string {
        return this._background;
    }

    // Start the application
    public async start() {
        await this.createApplication();
        await this.loadBunny();
        this.setupBunny();
        this.addTicker();
    }

    // Private create application method
    private async createApplication() {
        this.app = new Application();
        await this.app.init({ background: this._background, resizeTo: window });
        document.getElementById("pixi-container")!.appendChild(this.app.canvas);
    }

    // Private load bunny method
    private async loadBunny() {
        if (!this.app) throw new Error("Application not initialized");
        const texture = await Assets.load("/assets/bunny.png");
        this.bunny = new Sprite(texture);
    }

    //  Private setup bunny method
    private setupBunny() {
        if (!this.app || !this.bunny) throw new Error("App or Bunny not initialized");
        this.bunny.anchor.set(0.5);
        this.bunny.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        this.app.stage.addChild(this.bunny);
    }

    // Private add ticker method
    private addTicker() {
        if (!this.app || !this.bunny) throw new Error("App or Bunny not initialized");
        this.app.ticker.add((time) => {
            this.bunny!.rotation += 0.1 * time.deltaTime;
        });
    }
}

// Export the Bonny class
export { Bonny };