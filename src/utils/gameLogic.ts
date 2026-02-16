import {Chess} from 'chess.js';

export const getGameStatus = (game: Chess) => {
    if (game.isGameOver()) {
        if (game.isCheckmate()) {
            return `Checkmate - ${game.turn() === 'b' ? 'White' : 'Black'
            } Wins`;
        }else if (game.isStalemate()) {
            return `Checkmate - ${game.turn() === 'b' ? 'White' : 'Black'
            } is in Stalemate`;
        }else if (game.isDraw()) {
            return 'Game Over - Draw';
        }
    }
return `${game.turn() === 'w' ? 'White' : 'Black'}'s turn`;
};