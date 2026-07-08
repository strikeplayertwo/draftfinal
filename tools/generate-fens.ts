import {parse} from 'pgn-parser'
import {Chess} from "chess.js";


function splitPGNGames(pgnText: string, openingFilter: string): string[] {
  if(openingFilter.toLowerCase() === "petrov's"){
    openingFilter = "Petrov";
  }else if(openingFilter.toLowerCase() === "queen's pawn game" || openingFilter.toLowerCase() === "queen's gambit declined"){
    openingFilter = "Queen's pawn";
  }else if(openingFilter.toLowerCase() === "italian"){
    openingFilter = "Giuoco";
  }else if(openingFilter.toLowerCase() === "king's indian defense"){
    openingFilter = "King's Indian";
  }else if(openingFilter.toLowerCase() === "queen's indian defense"){
    openingFilter = "Queen's Indian";
  }else if(openingFilter.toLowerCase() === "grünfeld"){
    openingFilter = "Gruenfeld";
  }else if(openingFilter.toLowerCase() === "london system"){
    openingFilter = "Queen's Pawn Game";
  }else if(openingFilter.toLowerCase() === "spanish"){
    openingFilter = "Ruy Lopez";
  }
  console.log("Opening filter: " + openingFilter)
  return pgnText
    .split(/\r?\n\r?\n(?=\[Event )/)
    .filter(g => g.trim().length > 0)
    .filter(g => {
      if (openingFilter === "None") return true;
      const openingMatch = g.match(/\[Opening "([^"]+)"\]/);
      if (!openingMatch) return false;
      return openingMatch[1].toLowerCase().includes(openingFilter.toLowerCase());
    });
}


export async function extractFENsFromGames(pgnText: string, limit = 469, opening = "None", plyLength = 6): Promise<string[]> {
  const gamesText = splitPGNGames(pgnText, opening).slice(0, limit);
  const fens: string[] = [];

  for (const gameText of gamesText) {
    const parsed = parse(gameText)[0];
    if (!parsed?.moves || parsed.moves.length < plyLength) continue; // plies/2 = moves

    const chess = new Chess();

    const maxPly = parsed.moves.length - 1;
    /*console.log("parsed moves: " + parsed.moves.length);
    const randomPly = Math.floor(Math.random() * (maxPly - plyLength + 1)) + plyLength;
    console.log("randomPly: " + randomPly);*/
    const randomStartPly = plyLength + Math.floor(Math.random() * 8);
    //const randomEndPly = Math.floor((Math.random() * maxPly / 2) + maxPly / 2);
    for (let i = 0; i < randomStartPly; i++){
      const san = parsed.moves[i].move;
      chess.move(san);
    }

    for (let i = 0; i < maxPly; i++){
      if(i % 8 === 0){
        fens.push(chess.fen());

        const board = chess.board();
        let pieceCount = 0;
        for (let rank = 0; rank < 8; rank++) {
          for (let file = 0; file < 8; file++) {
            const piece = board[rank][file];
            if (piece) pieceCount++;
          }
        }
        if(pieceCount < 6) i = maxPly;
      }
      try{
        if(parsed.moves[i]){
          const san = parsed.moves[i].move;
          chess.move(san);
        }
      }catch{}
    }
  }
  console.log(fens.length + " fens generated from " + opening);
  return fens;
}
/*
async function generateRandomFens(){
    const response = await fetch("/lichess_elite_2023-07.pgn");
    const pgnText = await response.text();
    const games = parse(pgnText);
    const outputFens: string[] = [];
for (const game of games) {
    if (!game.moves || game.moves.length === 0) continue;
    const chess = new Chess();
    const plyCount = game.moves.length;
    const randomPly = Math.floor(Math.random() * plyCount);

    for (let i = 0; i < randomPly; i++) {
        const move = game.moves[i].move;
        try{chess.move(move);
        }catch {

         break;
        }
    }
    outputFens.push(chess.fen());
}

const blob = new Blob([JSON.stringify(outputFens, null, 2)], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'random_fens.json';
a.click();
URL.revokeObjectURL(url);
console.log("Generated", outputFens.length, "FENs.");
}
generateRandomFens();*/