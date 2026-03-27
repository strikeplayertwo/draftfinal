import {parse} from 'pgn-parser'
import {Chess} from "chess.js";


function splitPGNGames(pgnText: string, openingFilter: string): string[] {
  return pgnText
    .split(/\r?\n\r?\n(?=\[Event )/)
    .filter(g => g.trim().length > 0)
    .filter(g => {
      if (openingFilter === "None") return true; // no filter, return all
      // Match against the [Opening "..."] tag in the PGN header
      const openingMatch = g.match(/\[Opening "([^"]+)"\]/);
      if (!openingMatch) return false;
      return openingMatch[1].toLowerCase().includes(openingFilter.toLowerCase());
    });
}


export function extractFENsFromGames(pgnText: string, limit = 469, opening = "None", plyLength = 6) {
  const gamesText = splitPGNGames(pgnText, opening).slice(0, limit);
  const fens: string[] = [];

  for (const gameText of gamesText) {
    const parsed = parse(gameText)[0];
    if (!parsed?.moves || parsed.moves.length < plyLength) continue; // plies/2 = moves

    const chess = new Chess();

    const maxPly = parsed.moves.length - 1;
    const randomPly = Math.floor(Math.random() * (maxPly - plyLength + 1)) + plyLength;

    try {
      for (let i = 0; i < randomPly; i++) {
        const san = parsed.moves[i].move;
        chess.move(san);
      }
      fens.push(chess.fen());
    } catch { /* ignore malformed games */ }
  }
  //console.log(fens);
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