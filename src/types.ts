import {Square, Piece} from 'chess.js';

export type HintSquare = {
    square: Square;
    capture: boolean;
};