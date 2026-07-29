import {Chess} from "chess.js";
import * as fs from "fs";
import {parse} from 'pgn-parser'

const pgnText = fs.readFileSync("src/assets/lichess_elite_2025-11.pgn", "utf-8");

function splitPGNGames(pgnText: string, opening = "None"): string[]{
  if(opening.toLowerCase() === "grünfeld"){
    opening = "Gruenfeld";
  }else if(opening.toLowerCase() === "réti"){
    opening = "Reti";
  }

  const games = pgnText
    .split(/\r?\n\r?\n(?=\[Event )/)
    .filter(g => g.trim().length > 0);
  if(opening === "None") return games;
  return games.filter(g => {
    const openingMatch = g.match(/\[Opening "([^"]+)"\]/);
    return openingMatch?.[1]?.toLowerCase().includes(opening.toLowerCase());
  });
}

const openings = ["Italian", "French", "Queen's Pawn Game", "Caro-Kann", "Queen's Indian Defense", "King's Indian Defense", "Reti", "London System", "Queen's Gambit Declined", "Gruenfeld", "Benoni", "English", "Petrov's", "Ruy Lopez", "Catalan", "Sicilian"];
const result: Record<string, string[]> = {};

for(const opening of openings){
  const games = splitPGNGames(pgnText, opening === "None" ? "None" : opening);
  const fens: string[] = [];

  for(const gameText of games){
    try{
      const parsed = parse(gameText)[0];
      if(!parsed?.moves || parsed.moves.length < 10) continue;

      const chess = new Chess();
      const maxPly = parsed.moves.length - 1;
      const randomStartPly = 10 + Math.floor(Math.random() * 8);

      for(let i = 0; i < randomStartPly && i < maxPly; i++){
        chess.move(parsed.moves[i].move);
      }

      for(let i = randomStartPly; i < maxPly; i++){
        if (i % 8 === 0) {
          fens.push(chess.fen());
          const board = chess.board();
          let pieceCount = 0;
          for(let rank = 0; rank < 8; rank++)
            for(let file = 0; file < 8; file++)
              if(board[rank][file]) pieceCount++;
          if(pieceCount < 6) break;
        }
        try{
          if(parsed.moves[i]) chess.move(parsed.moves[i].move);
        }catch{}
      }
    }catch{}
  }

  result[opening] = fens;
  console.log(`${opening}: ${fens.length} fens`);
}

if(!fs.existsSync("public/opening-fens")) {
  fs.mkdirSync("public/opening-fens");
}

for(const [opening, fens] of Object.entries(result)){
  const filename = opening.toLowerCase().replace(/[^a-z0-9]/g, "_");
  fs.writeFileSync(
    `public/opening-fens/${filename}.json`,
    JSON.stringify(fens)
  );
  console.log(`Written ${filename}.json with ${fens.length} fens`);
}