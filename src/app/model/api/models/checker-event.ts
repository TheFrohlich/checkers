import { IPosition } from "../../common/board/position";
import { PositionType } from "../../common/board/position-type";

export class CheckerEvent {
    constructor(public position: IPosition,
        public playerId?: string,
        public type?: PositionType,
        public prediction?: boolean,
        public superMode?: boolean) {

    }
}