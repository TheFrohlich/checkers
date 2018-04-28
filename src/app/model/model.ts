import { Board } from "./common/board/board";
import { Checker } from "./checkers/board/checker";
import { IMoveStrategy } from "./common/interfaces/i-move-strategy";
import { GameStateManager } from "./common/game/game-state";
import { PlayersManager } from "./common/player/players-manager";
import { GameManager } from "./common/game/game-manager";
import { MoveManager } from "./common/move/move-manager";
import { Configurations } from "./api/models/game-configurations";
import { MoveValidator } from "./common/descriptor/move-validator";
import { BoundariesValidator } from "./common/move/move-validators/boundaries-validator";
import { DirectionValidator } from "./checkers/move/move-validators/direction-validator";
import { DistanceValidator } from "./checkers/move/move-validators/distance-validator";
import { MoveAnalyzer } from "./checkers/move/move-analyzer";
import { PlayerMoveStrategy } from "./checkers/move/player/player-move-strategy";
import { AiMoveStrategy } from "./checkers/move/ai/ai-move-strategy";
import { DirectionsDefinition } from "./common/move/move-direction";
import { Player, AiPlayer } from "./common/player/player";
import { CheckersPositionStrategy } from "./checkers/board/checkers-position-strategy";
import { CheckrsCellBuilder } from "./common/builders/checkers-cell-builder";


export class Model {
    private _board: Board<Checker>;
    private _playerMoveStrategy: IMoveStrategy<Checker>;
    private _computerMoveStrategy: IMoveStrategy<Checker>;
    private _gameState: GameStateManager<Checker>;
    private _playersManager: PlayersManager<Checker>;
    private _gameManager: GameManager<Checker>;
    private _moveManager: MoveManager<Checker>;

    constructor(configurations: Configurations) {
        this._gameState = new GameStateManager();

        this.setMoveComponents(configurations);
        this.setGameComponents();
        this.setPlayers(configurations);
        this.setBoard(configurations.size);
    }

    private setGameComponents() {
        this._gameManager = new GameManager(this._gameState, this._playersManager, this._moveManager);
    }

    private setMoveComponents(configurations: Configurations) {
        this._playersManager = new PlayersManager(this._gameState);
        const moveValidator = new MoveValidator<Checker>();

        moveValidator.append(new BoundariesValidator());
        moveValidator.append(new DirectionValidator());
        moveValidator.append(new DistanceValidator());

        const moveAnalizer = new MoveAnalyzer(this._playersManager, moveValidator);
        this._playerMoveStrategy = new PlayerMoveStrategy(this._board, this._gameState, moveValidator, moveAnalizer, this._playersManager);
        this._computerMoveStrategy = new AiMoveStrategy(this._board, this._gameState, moveValidator, moveAnalizer, this._playersManager, configurations.level);
        this._moveManager = new MoveManager(this._gameState, this._playersManager);
    }

    private setPlayers(configurations: Configurations) {
        const players = [];
        players.push(new Player(configurations.players[0], 1, 1, DirectionsDefinition.Up, this._playerMoveStrategy));
        players.push(configurations.computer ?
            new AiPlayer('computer', 2, configurations.size, DirectionsDefinition.Down, this._computerMoveStrategy) :
            new Player(configurations.players[1], 2, configurations.size, DirectionsDefinition.Down, this._playerMoveStrategy));

        this._playersManager.addPlayer(players[0]);
        this._playersManager.addPlayer(players[1]);
        this._gameState.updateCurrentPlayer(players[0]);
    }

    private setBoard(size: number) {
        this._board = new Board<Checker>(size, new CheckersPositionStrategy(size, this._playersManager), this._playersManager.players, new CheckrsCellBuilder());
    }
}