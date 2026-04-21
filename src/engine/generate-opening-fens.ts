/*import {Chess} from "chess.js";
import {useRef} from "react";
export async function generateFENsFromOpening(mainline: string){
    const fens: string[] = [];
    for (let i = 1; i < 4; i++){
        const chessGameRef = useRef(new Chess());
        const chessGame = chessGameRef.current;
        const mainMoves = mainline.split(" ");
        for (let j = 0; j < mainMoves.length; j++){
            chessGame.move({from: mainMoves[j].substring(0, 2), to: mainMoves[j].substring(2, 4), promotion: 'q'});
        }
        while (fens.length < i * 20){
            const lines = await workerA.getTop6Lines(chessGame.fen(), 16);
            const secondaccuracy = Math.round((100 * Math.exp((lines[1].cp - lines[0].cp) / 200)) * 10);
            let probability = 50 + (100 - secondaccuracy);
            if (probability > 100) probability = 100;
            if (Math.random() * 100 < probability){
                chessGame.move(lines[0].pv[0]);
                fens.push(chessGame.fen());
            } else {
                const thirdaccuracy = Math.round((100 * Math.exp((lines[2].cp - lines[0].cp) / 200)) * 10);
                let thirdprobability = 50 + (secondaccuracy - thirdaccuracy);
                if (thirdprobability > 100) thirdprobability = 100;
                if (Math.random() * 100 < thirdprobability){
                    chessGame.move(lines[1].pv[0]);
                    fens.push(chessGame.fen());
                } else {
                    chessGame.move(lines[2].pv[0]);
                    fens.push(chessGame.fen());
                }
            }
        }
    }
    return fens;
}
    */