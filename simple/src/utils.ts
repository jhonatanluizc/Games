import { Application, Assets, Sprite } from "pixi.js";

// Utils class encapsulating utility functions
export default class Utils {

    // Private properties
    private _app: Application | null = null;
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

    // Private create application method
    private async create() {
        this._app = new Application();
        await this._app.init({ background: this._background, resizeTo: window });
        document.getElementById("pixi-container")!.appendChild(this._app.canvas);
        return this._app;
    }
}
