import { Player } from "./player";
import { GameStateManager } from "../game/game-state-manager";
import { IIdentible } from "../interfaces/i-Identible";
import { Players } from "./players";

export class PlayersManager<T extends IIdentible> extends Players<T> {
    constructor(private _gameState: GameStateManager<T>) {
        super();
        this._gameState.currentPlayer.subscribe((player: Player<T>) => this._currentPlayer = player);
    }

    switch(): Player<T> {
        const otherPlayer = super.switch();
        this._gameState.updateCurrentPlayer(otherPlayer);
        return otherPlayer;
    }

    public mutatePlayers(): Players<T> {
        const players = new Players<T>();
        players.addPlayer(this.current);
        players.addPlayer(this.opponent);

        return players;
    }
}