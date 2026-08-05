import {parse} from 'pgn-parser'
import {Chess} from "chess.js";

async function sanToUciMultiple(startPos: string, sanMoves: string[]): Promise<string[]> {
  const openingMover = new Chess(startPos);
  let ucis = [];
  for (let i = 0; i < sanMoves.length; i++){
    try {
      const moveData = openingMover.move(sanMoves[i]);
      ucis.push(`${moveData.from}${moveData.to}${moveData.promotion || ''}`);
    } catch {
    }
  }
  return ucis;
}

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
  //console.log("Opening filter: " + openingFilter)
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


export async function extractFENsFromGames(pgnText: string, limit = 469, opening = "None", plyLength = 10, start = 0): Promise<string[]> {
  const gamesText = splitPGNGames(pgnText, opening).slice(start, limit);
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

//for uciToSan: 
//load gMoves & save fen
//if match in cMoves use that

export async function midArrows(openingMoves: string[], gMoves: string[], opening: string): Promise<string[]> {
  const chessGame = new Chess();
  for(let i = 0; i < gMoves.length; i++){
    chessGame.move(gMoves[i]);
  }
  const basePos = chessGame.fen();
  const matchGameMoves: string[] = [];
  const nextMoves: string[] = [];
  const responseMoves: string[] = [];
  const aMoves: Record<string, string> = {};
  for(const openingMoveString of openingMoves){
    let isMatch = true;
    //console.log("moves: " + moves);
    const moves = openingMoveString.split(" ");
    const tMoves = moves.splice(0, gMoves.length);
    //console.log("moves: " + moves + " tMoves: " + tMoves);
    for(let i = 0; i < gMoves.length; i++){
      if(!tMoves.includes(gMoves[i])){
        isMatch = false;
        break;
      }
    }
    if(isMatch){
      //find most common next 2 moves

      const nMoves: string[] = moves.splice(0,6);//test--make sure is next 10 moves?
      //const iMoves: string[] = [nMoves[0], nMoves[1]];
      const nMovesUCI = await sanToUciMultiple(basePos, nMoves);
      //console.log("Match! Order: " + tMoves + " moves: " + moves + " nMoves: " + nMoves + " nMovesUCI: " + nMovesUCI);
      for(let i = 0; i < nMoves.length; i++){
        if(i === 0){
          nextMoves.push(nMoves[i]);
        }else if(i === 1) responseMoves.push(nMoves[i]);
        matchGameMoves.push(nMoves[i]);
        const nMove = nMoves[i];
        if(!(aMoves[nMove])) aMoves[nMove] = nMovesUCI[i];
      }
    }
  }
  //console.log(matchGameMoves.length + " moves found for gMoves" + gMoves);
  const cMoves: string[] = [];//chosen moves
  let cMovesUCI: string[] = [];
  const cMovesCount: number[] = [];
  const uMoves: string[] = [];//unique moves
  const uNextMoves: string[] = [];
  const uResponseMoves: string[] = [];
  let nextRecordCount = 0;
  let finalNextMove = "";
  let responseRecordCount = 0;
  let finalResponseMove = "";
  const uMovesCount: number[] = [];
  const minMatchCount = 0.5 * matchGameMoves.length / 6;
  for(const nextMove of nextMoves){
    if(uNextMoves.includes(nextMove)) continue;
    uNextMoves.push(nextMove);
    const nextCount = nextMoves.filter(m => m === nextMove).length;
    if(nextCount > nextRecordCount){
      nextRecordCount = nextCount;
      finalNextMove = nextMove;
    }
  }
  for(const responseMove of responseMoves){
    if(uResponseMoves.includes(responseMove)) continue;
    uResponseMoves.push(responseMove);
    const responseCount = responseMoves.filter(m => m === responseMove).length;
    if(responseCount > responseRecordCount){
      responseRecordCount = responseCount;
      finalResponseMove = responseMove;
    }
  }
  const finalNextMoveUCI = aMoves[finalNextMove];
  const finalResponseMoveUCI = aMoves[finalResponseMove];
  for(const matchGameMove of matchGameMoves){
    if(uMoves.includes(matchGameMove)) continue;
    const matchCount = matchGameMoves.filter(m => m === matchGameMove).length;
    uMoves.push(matchGameMove);
    uMovesCount.push(matchCount);
  }
  for(let i = 0; i < uMoves.length; i++){
    //find top 6 moves with count > minMatchCount
    if(uMovesCount[i] > minMatchCount && cMoves.length < 6){
      cMoves.push(uMoves[i]);
      cMovesUCI.push(aMoves[uMoves[i]]);
      cMovesCount.push(uMovesCount[i]);
    }else if(uMovesCount[i] > Math.min(...cMovesCount) && cMoves.length === 6){
      const minIndex = cMovesCount.indexOf(Math.min(...cMovesCount));
      cMoves[minIndex] = uMoves[i];
      cMovesUCI[minIndex] = aMoves[uMoves[i]];
      cMovesCount[minIndex] = uMovesCount[i];
    }
  }
  if(cMovesUCI.includes(finalResponseMoveUCI) && cMovesUCI.includes(finalNextMoveUCI)){
    cMovesUCI[cMovesUCI.indexOf(finalResponseMoveUCI)] === cMovesUCI[1];
    cMovesUCI[1] = finalResponseMoveUCI;
    cMovesUCI[cMovesUCI.indexOf(finalNextMoveUCI)] === cMovesUCI[0];
    cMovesUCI[0] = finalNextMoveUCI;
  }else if(!cMovesUCI.includes(finalResponseMoveUCI) && !cMovesUCI.includes(finalNextMoveUCI)){
    cMovesUCI.unshift(finalResponseMoveUCI);
    cMovesUCI.unshift(finalNextMoveUCI);
  }else if(cMovesUCI.includes(finalResponseMoveUCI)){
    cMovesUCI.unshift(finalNextMoveUCI);
    cMovesUCI[cMovesUCI.indexOf(finalResponseMoveUCI)] === cMovesUCI[1];
    cMovesUCI[1] = finalResponseMoveUCI;
  }else{
    cMovesUCI.unshift(finalResponseMoveUCI);
    cMovesUCI[cMovesUCI.indexOf(finalResponseMoveUCI)] === cMovesUCI[1];
    cMovesUCI[1] = finalResponseMoveUCI;
    cMovesUCI[cMovesUCI.indexOf(finalNextMoveUCI)] === cMovesUCI[0];
    cMovesUCI[0] = finalNextMoveUCI;
  }
  /*if(cMoves.length > 0){
    const mostIndex = cMovesCount.indexOf(Math.max(...cMovesCount));
    const mostMove = cMoves[mostIndex];
    const mostMoveUCI = cMovesUCI[mostIndex];
    if(mostMoveUCI.includes("1") || mostMoveUCI.includes("2") || mostMoveUCI.includes("3") || mostMoveUCI.includes("4")){}
  }*/
  //console.log("cMoves: " + cMoves + " cMovesUCI: " + cMovesUCI);
  // + " aMoves: " + JSON.stringify(aMoves, null, 2));
  return cMovesUCI;
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