
import { Checker } from "../board/checker";
import { IMoveAnalyzer } from "../../common/interfaces/i-move-analyzer";
import { MoveType } from "../../common/move/move-type";
import { PositionDefinition, IPosition } from "../../common/board/position";
import { Board } from "../../common/board/board";
import { SelectDescriptor } from "../../common/descriptor/select-descriptor";
import { MoveDescriptor } from "../../common/descriptor/move-descriptor";
import { CheckerState } from "../board/checker-state";
import { DirectionsDefinition, MoveDirectionsDefinition } from "../../common/move/move-direction";
import { PlayersManager } from "../../common/player/players-manager";
import { IMoveValidator } from "../../common/interfaces/i-move-validator-interceptorr";

interface IFromTo<T> {
    from: T;
    to: T;
}

enum SimulationResult {
    TryNext,
    Ok,
    NotPossible
}

export class MoveAnalyzer implements IMoveAnalyzer<Checker> {
    private static readonly singleEatRecDistance = 2;

    constructor(private _playersManager: PlayersManager<Checker>,
        private _moveValidator: IMoveValidator<Checker>) {

    }

    getMoveType(from: PositionDefinition, to: PositionDefinition): MoveType {
        const distance = this.getDistance(from, to);

        if (distance === 1) {
            return MoveType.Move;
        } else {
            return MoveType.Atack;
        }
    }

    getPossibleMoves(select: SelectDescriptor, board: Board<Checker>): MoveDescriptor[] {
        const fromChecker = board.getCellByPosition(select.from).element;
        const unCheckedPosibleNextMoves = [];
        if (fromChecker.state === CheckerState.Super) {
            unCheckedPosibleNextMoves.push(...this.getSuperPossibleMoves(select, board));
        } else {
            unCheckedPosibleNextMoves.push(...this.getNormalPossibleMoves(select, board));
        }

        const moves = unCheckedPosibleNextMoves
            .map((pos: IPosition) => new MoveDescriptor(
                select.from, new PositionDefinition(pos.x, pos.y),
                this._playersManager.current.id,
                select.elementId))
            .filter(move => this._moveValidator.validate(move, board));

        return moves;
    }

    private getSuperPossibleMoves(select: SelectDescriptor, board: Board<Checker>) {
        const unCheckedPosibleNextMoves = [];

        const left = this.getSuperPossibleMove(select, board, DirectionsDefinition.Left);
        unCheckedPosibleNextMoves.push(...left);
        const right = this.getSuperPossibleMove(select, board, DirectionsDefinition.Right);
        unCheckedPosibleNextMoves.push(...right);

        return unCheckedPosibleNextMoves;
    }

    private getSuperPossibleMove(select: SelectDescriptor, board: Board<Checker>, direction: DirectionsDefinition) {
        const unCheckedPosibleNextMoves = [];
        let cell = board.getCellByPosition(select.position);
        let pos = this.getNextPositionByDirection(select.position, select.direction | direction, board);
        while (cell) {
            unCheckedPosibleNextMoves.push(pos);

            pos = this.getNextPositionByDirection(pos, select.direction | direction, board);
            cell = board.getCellByPosition(pos);
        }

        return unCheckedPosibleNextMoves;
    }

    private getNormalPossibleMoves(select: SelectDescriptor, board: Board<Checker>) {
        const unCheckedPosibleNextMoves = [];

        const left = this.getNextPositionByDirection(select.position, select.direction | DirectionsDefinition.Left, board);
        unCheckedPosibleNextMoves.push(left);
        const right = this.getNextPositionByDirection(select.position, select.direction | DirectionsDefinition.Right, board);
        unCheckedPosibleNextMoves.push(right);

        return unCheckedPosibleNextMoves;
    }

    private checkIfMoveOrAttack(to: IPosition, moveDirection: MoveDirectionsDefinition, board: Board<Checker>): SimulationResult {
        const cell = board.getCellByPosition(to);

        if (!cell) {
            return SimulationResult.NotPossible;
        }

        if (cell.element) {
            if (cell.element.id === this._playersManager.opponent.id) {
                return SimulationResult.TryNext;
            } else if (cell.element.id === this._playersManager.current.id) {
                return SimulationResult.NotPossible;
            } else {
                throw new Error('id not found');
            }
        } else {
            return SimulationResult.Ok;
        }
    }

    private simulateNextCellByDirection(position: IPosition, moveDirection: MoveDirectionsDefinition): IPosition {
        const pos = { x: position.x, y: position.y };

        if (moveDirection & DirectionsDefinition.Up) {
            pos.y++;
        }

        if (moveDirection & DirectionsDefinition.Down) {
            pos.y--;
        }

        if (moveDirection & DirectionsDefinition.Right) {
            pos.x++;
        }

        if (moveDirection & DirectionsDefinition.Left) {
            pos.x--;
        }

        return pos;
    }

    getNextPositionByDirection(position: IPosition, moveDirection: MoveDirectionsDefinition, board: Board<Checker>): IPosition {
        let pos = this.simulateNextCellByDirection(position, moveDirection);
        const result = this.checkIfMoveOrAttack(pos, moveDirection, board);

        if (result === SimulationResult.TryNext) {
            pos = this.simulateNextCellByDirection(position, moveDirection);
        }

        return pos;
    }

    private getDistance(from: PositionDefinition, to: PositionDefinition): number {
        return Math.abs(from.y - to.y);
    }
}