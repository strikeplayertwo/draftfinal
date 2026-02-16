import {Chess, Piece, Square, Move} from 'chess.js';
import {HintSquare} from '../types';

const pieceSquareStyle = (pieceSquare: Square) => {
    return {
        ...{
            [pieceSquare]: {backgroundColor: 'hsla(81, 18%, 50%, 1)'},
        },
        
    };
}

export const lastMoveStyles = (history: Move[]) => {
    if (!history.length) return null;

    const sourceSquare = history[history.length - 1].from;
    const targetSquare = history[history.length - 1].to;

    return {
        ...{
            [sourceSquare]: {
                backgroundColor: 'hsla(81, 58%, 50%, .6)',
            },
        },
        ...{
            [targetSquare]: {
                backgroundColor: 'hsla(81, 58%, 50%, .6)',
            },
        },
    };
};

export const showHintsForSquare = (square: Square, game: Chess) => {
    const moves = game.moves({
        square: square,
        verbose: true,
    });

    const squaresToHighlight: HintSquare[] = moves.map((move) => {
        return {
            square: move.to,
            capture: move.captured ? true : false,
        };
    });

    return squaresToHighlight;
};

export const buildSquareStyles = (
    sourceSquare: Square | null,
    game: Chess,
) => {
    const hintSquares = sourceSquare ? showHintsForSquare(sourceSquare, game) : [];
    const hintStyles = [...hintSquares].reduce((a, c) => {
        return {
            ...a,
            ...(!c.capture && {
                [c.square]: {
                    background: 
                    'radial-gradient(circle, hsla(81, 18%, 50%, .7), hsla(81, 18%, 50%, .7) 25%, transparent 25%)',
                    borderRadius: '50%',
                },
            }),
            ...(c.capture && {
                [c.square]: {
                    background:
                    'radial-gradient(circle, transparent, transparent 78%, hsla(81, 18%, 50%, .7) 78%)',
                },
            }),
        };
    }, {});

    return {
        ...sourceSquare && pieceSquareStyle(sourceSquare),
        ...lastMoveStyles(game.history({verbose: true})),
        ...hintStyles,
    };
};