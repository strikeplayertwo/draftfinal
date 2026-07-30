import * as fs from "fs";
import {parse} from 'pgn-parser'

const pgnText = fs.readFileSync("src/assets/lichess_elite_2025-11.pgn", "utf-8");

function splitPGNGames(pgnText: string, opening = "None"): string[]{
  if(opening.toLowerCase() === "gruenfeld"){
    opening = "Grünfeld";
  }else if(opening.toLowerCase() === "reti"){
    opening = "Réti";
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
  const allMoves: string[] = [];

  for(const gameText of games){
    try{
      const parsed = parse(gameText)[0];
      if(!parsed?.moves || parsed.moves.length < 25) continue;
      let thisline = parsed.moves[0].move;
      for(let i = 1; i <parsed.moves.length; i++){
        thisline = thisline + " " + parsed.moves[i].move 
      }
      allMoves.push(thisline);
    }catch{}
  }

  result[opening] = allMoves;
  console.log(`${opening}: ${allMoves.length} moves`);
}

if(!fs.existsSync("public/opening-moves")) {
  fs.mkdirSync("public/opening-moves");
}

for(const [opening, allMoves] of Object.entries(result)){
  const filename = opening.toLowerCase().replace(/[^a-z0-9]/g, "_");
  fs.writeFileSync(
    `public/opening-moves/${filename}.json`,
    JSON.stringify(allMoves)
  );
  console.log(`Written ${filename}.json with ${allMoves.length} moves`);
}