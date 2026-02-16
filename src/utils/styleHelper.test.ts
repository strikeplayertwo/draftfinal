import {Chess} from 'chess.js';
import {describe, it, expect} from "vitest";
import {showHintsForSquare, lastMoveStyles,buildSquareStyles} from "./styleHelpers"

describe('styleHelpers showHintsforSquare', () => {
    it('should return hints for square', () =>{
        const game = new Chess();
        const hints = showHintsForSquare('f2',game)
        const expected = [{square: 'f3', capture: false }, {square: 'f4', capture: false}];
        expect(hints).toStrictEqual(expected);
    })

    it('should return hints for square with possible capture', () => {
        const game = new Chess('rnbqkbnr/ppppp1pp/8/5p2/4P3/8/PPPP1PPP/RNBQKBNR w KQkq j- 0 2');
        const hints = showHintsForSquare('e4', game)
        const expected = [{square: 'e5', capture: false}, {square: 'f5', capture: true}];
        expect(hints).toStrictEqual(expected);
    })

    it('should not return hints if move not possible', () => {
        const game = new Chess();
        const hints = showHintsForSquare('e1', game)
        expect(hints).toStrictEqual([]);
    })

    it('should not return hints if not players turn', () => {
        const game = new Chess();
        const hints = showHintsForSquare('e7', game)
        expect(hints).toStrictEqual([]);
    })
})

describe('styleHelpers lastMoveStyles', () => {
    it('should return lastMoveStyles', () => {
        const game = new Chess();
        game.move({
            from: 'e2',
            to: 'e4',
            promotion: 'q',
        });
        const lastMove = lastMoveStyles(game.history({verbose: true}))
        const expected = {
            e2: {backgroundColor: 'hsla(81, 58%, 50%, .6)'},
            e4: {backgroundColor: 'hsla(81, 58%, 50%, .6)'}
        };
        expect(lastMove).toStrictEqual(expected);
    })

    it('should not return lastMoveStyles with no history', () => {
        const game = new Chess();
        const lastMove = lastMoveStyles(game.history({verbose: true}))
        expect(lastMove).toStrictEqual(null);
    })
})

describe('styleHelpers buildSquareStyles', () => {
    it('should return an empty object for a new game', () => {
        const game = new Chess();
        const lastMove = buildSquareStyles(null, game)
        expect(lastMove).toStrictEqual({});
    })
})