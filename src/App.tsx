//aaaa
import { useEffect, useState, useRef } from 'react';
import {flushSync} from 'react-dom';
import { extractFENsFromGames } from '../tools/generate-fens';
import { Chessboard, PieceDropHandlerArgs, PieceHandlerArgs, SquareHandlerArgs } from "react-chessboard";
import {Chess, Piece, Move, Square} from 'chess.js';
//import {buildSquareStyles} from './utils/styleHelpers';
//import {getGameStatus} from './utils/gameLogic';
//import moveAudio from './assets/sounds/move.mp3';
//import captureAudio from './assets/sounds/capture.mp3';
import './App.css'
import { evaluateFen } from "./engine/evaluate";
import { getBestLineFromFen } from './engine/findBestLine';
//import { K } from 'vitest/dist/chunks/reporters.d.BFLkQcL6.js';
import pgnData from "./assets/twic1326.pgn?raw";
type Arrow = {
  startSquare: Square;
  endSquare: Square;
  color: string;
};

/*function BoardPopup({ pos }: { pos: string }) {
  const analysisBoardOptions = {
    //onPieceDrop,
    //onSquareClick,
    position: pos,
    //squareStyles: optionSquares,
    id: 'board3',
  };

  return (
    <Chessboard
      options={analysisBoardOptions}
    />
  );
}*/

type EvalGraphProps = {
  evals: number[];
};
function EvalGraph({ evals }: EvalGraphProps) {
  if (evals.length < 2) return null;

  const width = 500;
  const height = 200;

  // clamp evals to 1000
  const clamp = (v: number) => Math.max(-1000, Math.min(1000, v));

  const points = evals.map((e, i) => {
    const x = (i / (evals.length - 1)) * width;
    const y = height / 2 - (clamp(e) / 1000) * (height / 2);
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} style={{ background: "#111", marginTop: "1rem" }}>
      <line
        x1={0}
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="#555"
        strokeDasharray="4"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="#00ff88"
        strokeWidth={2}
      />
    </svg>
  );
}


function App() {
  const fens = extractFENsFromGames(pgnData,94); //pick random fen and set position to it
  const randomFen: number = Math.floor(Math.random() * fens.length);
  //const [newFen, setNewFen] = useState<string>(fens[randomFen]);
  //const [game, setGame] = useState<Chess>(new Chess());
  //const [fen, setFen] = useState('');
  const [gameStatus, setGameStatus] = useState("Moves played: 0");
  const [movesplayed, setMovesPlayed] = useState(-2);
  const [gameResult, setGameResult] = useState("");
  const [showEffex, setShowEffex] = useState("");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakMsg, setStreakMsg] = useState("Current Streak: 0");
  const [highestStreak, setHighestStreak] = useState(0);
  const [bmcounter, setbmcounter] = useState(0);
  const [brilcounter, setbrilcounter] = useState(0);
  const [evalHistory, setEvalHistory] = useState<number[]>([]);
  
  //const [activeSquare, setActiveSquare] = useState<string>('');
  //const [activeDragSquare, setActiveDragSquare] = useState<string>('');
  //const [reset, setReset] = useState(false);
  //const dropSquareStyle = {backgroundColor: 'hsla(81, 18%, 50%, 1)'};

  // create a chess game using a ref to always have access to the latest game state within closures and maintain the game state across renders

  //**loop to make sure starting eval is between -30 and 30

  const chessGameRef = useRef(new Chess(fens[randomFen]));
  const chessGame = chessGameRef.current;
  const [startingEval, setStartingEval] = useState(0);
  const [dif, setDif] = useState(0);
  // track the current position of the chess game in state to trigger a re-render of the chessboard
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [bigChessPosition, setBigChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState('');
  const [oldMove, setOldMove] = useState('');
  const [oldFen, setOldFen] = useState(chessGame.fen());
  const tryFenRef = useRef(new Chess(oldFen));
  const tryFenGame = tryFenRef.current;
  //const [evaluation, setEvaluation] = useState<number | null>(null);
  const [eval1, setEval1] = useState<number>(3.5);
  const [accuracy, setAccuracy] = useState(100);
  //evaluateFen(fens[randomFen]).then((score) => setEval1(score));
  //const [eval2, setEval2] = useState<number>(3.6);
  //const [randFen, setRandFen] = useState("");
  let cSquare = "a1";
  while(chessGame.get(cSquare as Square) === null || chessGame.get(cSquare as Square)?.type !== 'k' || chessGame.get(cSquare as Square)?.color !== chessGame.turn()){
    if(cSquare[1] !== '8'){
      cSquare = cSquare[0] + String.fromCharCode(cSquare.charCodeAt(1) + 1);
    }else{
      cSquare = String.fromCharCode(cSquare.charCodeAt(0) + 1) + '1';
    }
  };
  const [squareStyles, setSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({
    [cSquare]: {
      backgroundColor: 'rgba(255,0,0,0.2)'
    }
  });
  const [loading, setLoading] = useState(false);
  const [bestLine, setBestLine] = useState('');
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [oldEval, setOldEval] = useState(-10000);//later-make this eval of starting position?
  useEffect(() => {
    setSquareStyles({});
    setArrows([]);
    setMovesPlayed(prev => {
      const next = prev + 1;
      setGameStatus("Moves played: " + next);
      return next;
    });
    findBestMove();
    /*if(movesplayed === 0){
      const starteval = await newEval(chessGame.fen(), 18);
      setStartingEval(starteval);
    }*/
  }, [chessPosition]);

  async function triggerEnd(finalmessage: string){
    setGameResult(finalmessage);
  }

  async function findBestMove(){
    if (movesplayed > -3){
      setLoading(true);
      try {
        const result = await getBestLineFromFen(chessGame.fen(), 18); //gets best line after played move--check if player blundered mate
        const pv = result.pv;
        console.log("PV: " + pv);
        const bestMove = pv?.split(" ")?.[0];
        const bestResponse = pv?.split(" ")?.[1];
        const nextResponse = pv?.split(" ")?.[2];

        const result2 = await getBestLineFromFen(oldFen, 18); //gets best line before played move--check if player has mate
        const pv2 = result2.pv;
        const bestMove2 = pv2?.split(" ")?.[0];
        setBestLine(bestMove2);
        

        if (oldMove === bestMove2){
          //console.log("best move! " + oldMove + " " + bestMove2);
          
          /*setCurrentStreak(prev => {
            const next = prev + 1;
            setStreakMsg("Current Streak: " + next);
            if (next > highestStreak){
              setHighestStreak(next);
            }
            return next;
          });*/
          setArrows(
          bestMove
            ? [
                {
                  startSquare: bestMove.substring(0, 2) as Square,
                  endSquare: bestMove.substring(2, 4) as Square,
                  color: "rgb(0, 128, 0)", // green = best move
                },
                ...(bestResponse
                  ? [{
                      startSquare: bestResponse.substring(0, 2) as Square,
                      endSquare: bestResponse.substring(2, 4) as Square,
                      color: "rgb(0, 128, 0)", // red = best response
                    }]
                  : []),
              ]
            : []
          );
          setSquareStyles(prev => {
            const newSquareStyles = {
              ...prev
            };
            newSquareStyles[oldMove.substring(0, 2)] = {
              backgroundColor: "rgba(0, 128, 0, 0.2)"
            };
            newSquareStyles[oldMove.substring(2, 4)] = {
              backgroundColor: "rgba(0, 128, 0, 0.2)"
            };
            return newSquareStyles;
          });
        }else{
          console.log("not best move: " + oldMove + " " + bestMove2);
        
          /*setCurrentStreak(0);
          setStreakMsg("Current Streak: 0");*/
          tryFenGame.load(oldFen);
          let trybool = true;
          try{
            tryFenGame.move({from: bestMove2.substring(0, 2), to: bestMove2.substring(2, 4), promotion: 'q'});
            tryFenGame.move({from: bestMove.substring(0, 2), to: bestMove.substring(2, 4), promotion: 'q'});
          }catch{
            console.log("invalid move in tryFenGame");
            trybool = false;
          }

          const result3 = await getBestLineFromFen(tryFenGame.fen(), 18);
          const pv3 = result3.pv;
          const tryMove = pv3?.split(" ")?.[0];
          
          if(oldMove !== '' && bestMove2 !== ''){
            setArrows(
            bestMove
              ? [
                  {
                    startSquare: bestMove.substring(0, 2) as Square,
                    endSquare: bestMove.substring(2, 4) as Square,
                    color: "rgb(255, 0, 0)", // red = best move
                  },
                  ...(bestResponse
                    ? [{
                        startSquare: bestResponse.substring(0, 2) as Square,
                        endSquare: bestResponse.substring(2, 4) as Square,
                        color: "rgb(255, 0, 0)", // red = best response
                      }]
                    : []),
                  ...(nextResponse
                    ? [{
                        startSquare: nextResponse.substring(0, 2) as Square,
                        endSquare: nextResponse.substring(2, 4) as Square,
                        color: "rgb(129, 0, 0)", // red = best response
                      }]
                    : []),
                  ...(bestMove2 && bestMove2 !== bestResponse
                    ? [{
                        startSquare: bestMove2.substring(0, 2) as Square,
                        endSquare: bestMove2.substring(2, 4) as Square,
                        color: "rgb(0, 128, 0)", // green = best response
                      }]
                    : []),
                  ...(tryMove && tryMove !== bestResponse && trybool
                    ? [{
                        startSquare: tryMove.substring(0, 2) as Square,
                        endSquare: tryMove.substring(2, 4) as Square,
                        color: "rgba(13, 0, 129, 1)", // red = best response
                      }]
                    : []),
                ]
              : []
            );
          };
          if (movesplayed > -1) {
            setSquareStyles(prev => {
              const newSquareStyles = {
                ...prev
              };
              newSquareStyles[bestMove2.substring(0, 2)] = {
                backgroundColor: "rgba(0, 128, 0, 0.2)"
              };
              newSquareStyles[bestMove2.substring(2, 4)] = {
                backgroundColor: "rgba(0, 128, 0, 0.2)"
              };
              newSquareStyles[oldMove.substring(0, 2)] = {
                backgroundColor: 'rgba(255, 0, 0, 0.2)'
              };
              newSquareStyles[oldMove.substring(2, 4)] = {
                backgroundColor: 'rgba(255, 0, 0, 0.2)'
              };
              return newSquareStyles;
            });
          }
        }
        
        //console.log("Best line: " + bestMove);
        /*setArrows(bestMove ? [{
          startSquare: bestMove.substring(0, 2) as Square,
          endSquare: bestMove.substring(2, 4) as Square,
          color: 'rgb(0, 128, 0)'
        }] : []);*/
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  }

  /*function evaluateWithWorker(fen: string, depth = 18) {
  const worker = new Worker("/stockfish.wasm.js");

  worker.onmessage = (e) => {
    const text = String(e.data);

    // Example info line:
    // info depth 18 score cp 34 pv e2e4 e7e5 g1f3 ...
    if (text.includes(" pv ")) {
      const pvMatch = text.match(/ pv (.+)$/);
      if (pvMatch) {
        const pv = pvMatch[1];
        setBestLine(pv); // 👈 replaces engine.onMessage(...)
      }
    }

    if (text.startsWith("bestmove")) {
      worker.terminate();
    }
  };

  worker.postMessage("uci");
  worker.postMessage("isready");
  worker.postMessage(`position fen ${fen}`);
  worker.postMessage(`go depth ${depth}`);
}*/

  async function handleEvaluate() {
    setLoading(true);
    try {
      const score = await evaluateFen(chessGame.fen(), 18);
      setEval1(score);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function newEval(eFen: string, depth: number) {
    setLoading(true);
    try {
      const score = await evaluateFen(eFen, depth);
      return score;
    } catch (err) {
      console.error(err);
      return 3.7;
    } finally {
      setLoading(false);
    }
  }

  async function stopEffex(damessage: string = "") {
    await new Promise(resolve => setTimeout(resolve, 1500));
    if(damessage !== ""){
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowEffex(damessage);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    setShowEffex("");
  }

  async function chooseFen(fungusFen: string, fungusMove: string) {
    let ourOldEval = oldEval;
    if (movesplayed === 0){
      ourOldEval = await newEval(oldFen, 18);
      setStartingEval(ourOldEval);
      setEvalHistory(prev => [...prev, ourOldEval]);
      console.log("Starting Eval logged: " + oldFen);
    }
    const result = await getBestLineFromFen(chessGame.fen(), 18);
    const mate = result.mate;
    const ourEval = -1 * await newEval(chessGame.fen(), 18);
    let bestEval = ourEval;
    let streaker = currentStreak;

    const bingusSetup = await getBestLineFromFen(fungusFen, 18);
    const pvb = bingusSetup.pv;
    const bingusMove = pvb?.split(" ")?.[0];
    if(bingusMove !== fungusMove){ 
      tryFenGame.load(fungusFen);
      tryFenGame.move({from: bingusMove.substring(0, 2), to: bingusMove.substring(2, 4), promotion: 'q'});
      bestEval = -1 * await newEval(tryFenGame.fen(), 18);
      console.log(bingusMove + " not equals " + fungusMove);
    }else{
      console.log(bingusMove + " equals " + fungusMove);
    }

    let doublemessage = false;
    let bonus = 0;
    let disHighestStreak = highestStreak;
    let disbrilcounter = brilcounter;
    let disbmcounter = bmcounter;
    if(ourEval > bestEval){
      console.log("Brilliant Move! " + ourEval + " " + bestEval);
      bonus = 200;
      setShowEffex("Brilliant Move ‼️ +200 eval, +2 streak");
      setbrilcounter(prev => prev + 1);
      disbrilcounter++;
      doublemessage = true;
      setCurrentStreak(prev => {
        const next = prev + 3;
        let fires = "";
        for (let i = 0; i < next; i++){
          fires += "🔥";
        }
        setStreakMsg("Current Streak: " + next + " " + fires);
        if (next > highestStreak){
          setHighestStreak(next);
          disHighestStreak+= 3;
        }
        return next;
      });
      streaker += 3;
    }else if (ourEval === bestEval){
      console.log("Best Move!");
      bonus = 25;
      setShowEffex("Best Move⭐ +25 eval");
      setbmcounter(prev => prev + 1);
      disbmcounter++;
      doublemessage = true;
      //new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStreak(prev => {
        const next = prev + 1;
        let fires = "";
        for (let i = 0; i < next; i++){
          fires += "🔥";
        }
        setStreakMsg("Current Streak: " + next + " " + fires);
        if (next > highestStreak){
          setHighestStreak(next);
          disHighestStreak++; 
        }
        return next;
      });
      streaker++;
    }else if (ourEval - bestEval >= -30){
      console.log("Excellent Move!");
      setCurrentStreak(prev => {
        const next = prev + 1;
        let fires = "";
        for (let i = 0; i < next; i++){
          fires += "🔥";
        }
        setStreakMsg("Current Streak: " + next + " " + fires);
        if (next > highestStreak){
          disHighestStreak++;
          setHighestStreak(next);
        }
        return next;
      });
      streaker++;
    }else{
      console.log("Bad Move!");
      setCurrentStreak(0);
      setStreakMsg("Current Streak: 0");
      console.log("Streak ended: " + ourEval + " " + bestEval);
      streaker = 0;
    }

    const thisaccuracy = Math.round((100 * Math.exp((ourEval - bestEval) / 200)) * 10);
    const displayAccuracy = Math.round(((accuracy * (movesplayed) + thisaccuracy) / (movesplayed + 1)));
    if (movesplayed !== 0){
      setAccuracy(displayAccuracy);
    }else{
      setAccuracy(thisaccuracy);//could be error if movesplayed is only 1
    }
    console.log("Accuracy " + accuracy + " this: " + thisaccuracy + " Moves: " + movesplayed);

    let streakbonus = 0;
    if (streaker === 1){
      streakbonus = 25;
      if(doublemessage){
        stopEffex("🔥 +25 eval");
      }else{
        setShowEffex("🔥 +25 eval");
        stopEffex();
      }
    }else if (streaker === 2){
      streakbonus = 50;
      if(doublemessage){
        stopEffex("🔥🔥 +50 eval");
      }else{
        setShowEffex("🔥🔥 +50 eval");
        stopEffex();
      }
    }else if (streaker === 3){
      streakbonus = 80;
      if(doublemessage){
        stopEffex("🔥🔥🔥 +80 eval");
      }else{
        setShowEffex("🔥🔥🔥 +80 eval");
        stopEffex();
      }
    }else if (streaker === 4){
      streakbonus = 125;
      if(doublemessage){
        stopEffex("🔥🔥🔥🔥 +125 eval");
      }else{
        setShowEffex("🔥🔥🔥🔥 +125 eval");
        stopEffex();
      }
    }else if (streaker === 5){
      streakbonus = 200;
      if(doublemessage){
        stopEffex("🔥🔥🔥🔥🔥 +200 eval");
      }else{
        setShowEffex("🔥🔥🔥🔥🔥 +200 eval");
        stopEffex();
      }
    }else if (streaker >= 6){
      streakbonus = 300;
      if(doublemessage){
        stopEffex("🔥🔥🔥🔥🔥🔥 +300 eval");
      }else{
        setShowEffex("🔥🔥🔥🔥🔥🔥 +300 eval");
        stopEffex();
      }
    }
    //add streak bonus

    const evalA = (ourOldEval - bestEval + ourEval + bonus + streakbonus + dif);
    console.log("EvalA: " + evalA + " ourOldEval: " + ourOldEval + " BestEval: " + bestEval + " OurEval: " + ourEval + " Bonus: " + bonus + " StreakBonus: " + streakbonus + " Dif: " + dif);
    setEvalHistory(prev => [...prev, evalA]);

    if (mate !== null){
      const pv = result.pv;
      for (let i = 0; i < Math.abs(mate) + 5; i++){
        if (chessGame.isGameOver() === false){
          await new Promise(resolve => setTimeout(resolve, 500));
          const move = pv?.split(" ")?.[i];
          chessGame.move({from: move?.substring(0, 2) as Square, to: move?.substring(2, 4) as Square, promotion: 'q'});
          flushSync(() => {
            setBigChessPosition(chessGame.fen());
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      if (evalA > 0){
        triggerEnd("You win! Final result: " + (mate > 0 ? "You mate in " + mate : "You mate in " + (-mate)) + " Final stats: " + "Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (disHighestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter) + ", Starting Eval: " + startingEval);
      }else{
        triggerEnd("Game over! Final result: " + (mate > 0 ? "You are mated in " + mate : "You are mated in " + (-mate)) + " Final stats: " + "Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (disHighestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter)  + ", Starting Eval: " + startingEval);
      }
      return;
    }
    /*
    if (ourEval - oldEval > -50){
      console.log("Streak continued: " + ourEval + " " + oldEval);
      setCurrentStreak(prev => {
        const next = prev + 1;
        setStreakMsg("Current Streak: " + next);
        return next;
      });
    }else{
      if(oldEval !== -10000){
        setCurrentStreak(0);
        setStreakMsg("Current Streak: 0");
        console.log("Streak ended: " + ourEval + " " + oldEval);
      }
    }
    */

    let attempts = 0;
    const MAX_ATTEMPTS = 100;
    while (attempts < MAX_ATTEMPTS) {
      const newFens = fens[Math.floor(Math.random() * fens.length)];
      const evalB = await newEval(newFens, 10);
      //if ((evalA - evalB <= 30) && (evalA - evalB >= -30)){ 
      if (Math.abs(evalA) < 50){
        if ((evalA - evalB <= 30) && (evalA - evalB >= -30)){
          setBigChessPosition(newFens);
          chessGame.load(newFens);

          let cSquare = "a1";
          while(chessGame.get(cSquare as Square) === null || chessGame.get(cSquare as Square)?.type !== 'k' || chessGame.get(cSquare as Square)?.color !== chessGame.turn()){
            if(cSquare[1] !== '8'){
              cSquare = cSquare[0] + String.fromCharCode(cSquare.charCodeAt(1) + 1);
            }else{
              cSquare = String.fromCharCode(cSquare.charCodeAt(0) + 1) + '1';
            }
          };
          setOptionSquares({
            [cSquare]: {
              backgroundColor: 'rgba(255,0,0,0.2)'
            }
          }); 

          const newevalB = await newEval(newFens, 18);
          const difference = evalA - newevalB;
          setOldEval(newevalB);
          setDif(difference);
          console.log("Success 1! " + evalA + " " + evalB + " " + newevalB + " " + difference);
          return;
        }
      }else if (((evalA < evalB / 0.6) && (evalA > evalB * 0.6) && (evalA >= 0)) || ((evalA > evalB / 0.6) && (evalA < evalB * 0.6) && (evalA <= 0))){
        const newevalB = await newEval(newFens, 18);
        if (((evalA < newevalB / 0.5) && (evalA > newevalB * 0.5) && (evalA >= 0)) || ((evalA > newevalB / 0.5) && (evalA < newevalB * 0.5) && (evalA <= 0))){
          setBigChessPosition(newFens);
          chessGame.load(newFens);

          let cSquare = "a1";
          while(chessGame.get(cSquare as Square) === null || chessGame.get(cSquare as Square)?.type !== 'k' || chessGame.get(cSquare as Square)?.color !== chessGame.turn()){
            if(cSquare[1] !== '8'){
              cSquare = cSquare[0] + String.fromCharCode(cSquare.charCodeAt(1) + 1);
            }else{
              cSquare = String.fromCharCode(cSquare.charCodeAt(0) + 1) + '1';
            }
          };
          setOptionSquares({
            [cSquare]: {
              backgroundColor: 'rgba(255,0,0,0.2)'
            }
          });

          setOldEval(newevalB);
          const difference = evalA - newevalB;
          setDif(difference);
          console.log("Success 2! " + evalA + " " + evalB + " " + newevalB + " " + difference);
          return;
        }else{
          console.log("Inaccuracy error");
        }
      }else if (((Math.abs(evalA) < Math.abs(evalB) / 0.6) && (Math.abs(evalA) > Math.abs(evalB) * 0.6)) || ((Math.abs(evalA) > Math.abs(evalB) / 0.6) && (Math.abs(evalA) < Math.abs(evalB) * 0.6))){
        /*const switchedFen = newFens.split(" ")[0] + " " + (newFens.split(" ")[1] === "w" ? "b" : "w") + " " + newFens.split(" ").slice(2).join(" ");
        console.log("eval switch: " + newFens + " " + switchedFen);
        setBigChessPosition(switchedFen);
        chessGame.load(switchedFen)
        const newevalB = await newEval(switchedFen, 18);
        const difference = evalA - newevalB;
        setDif(difference);
        console.log("Success 3! " + evalA + " " + evalB + " " + newevalB + " " + difference);
        return;*/

        const result4 = await getBestLineFromFen(newFens, 18);
        const pvswap = result4.pv;
        const swapMove = pvswap?.split(" ")?.[0];
        chessGame.load(newFens);
        try{
          chessGame.move({from: swapMove.substring(0, 2), to: swapMove.substring(2, 4), promotion: 'q'});
        }catch{
          console.log("invalid move in swapFen");
        }
        const newevalB = await newEval(chessGame.fen(), 18);

        if (((evalA < newevalB / 0.5) && (evalA > newevalB * 0.5) && (evalA >= 0)) || ((evalA > newevalB / 0.5) && (evalA < newevalB * 0.5) && (evalA <= 0))){
          setBigChessPosition(chessGame.fen());

          let cSquare = "a1";
          while(chessGame.get(cSquare as Square) === null || chessGame.get(cSquare as Square)?.type !== 'k' || chessGame.get(cSquare as Square)?.color !== chessGame.turn()){
            if(cSquare[1] !== '8'){
              cSquare = cSquare[0] + String.fromCharCode(cSquare.charCodeAt(1) + 1);
            }else{
              cSquare = String.fromCharCode(cSquare.charCodeAt(0) + 1) + '1';
            }
          };
          setOptionSquares({
            [cSquare]: {
              backgroundColor: 'rgba(255,0,0,0.2)'
            }
          });

          setOldEval(newevalB);
          const difference = evalA - newevalB;
          setDif(difference);
          console.log("Success 3! " + evalA + " " + evalB + " " + newevalB + " " + difference);
          return;
        }else{
          console.log("Inaccuracy error on swap");
        };
      }
      console.log("Eval1: " + evalA + " Eval2: " + evalB);
      attempts++;
    }
    console.log("Failure");
    if(evalA > 0){
      triggerEnd("You win! Final stats: Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (disHighestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter)  + ", Starting Eval: " + startingEval + ", Final Eval: " + evalA);
    }else{
      triggerEnd("Game over! Final stats: Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (disHighestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter)  + ", Starting Eval: " + startingEval + ", Final Eval: " + evalA);
    }
  }

  /*function runEval() {
    //const chess = new Chess();
    const score = evaluateFen(chessGame.fen());
    console.log("Evaluation:", score);
  }*/


  function getMoveOptions(square: Square) {
    const moves = chessGame.moves({
      square,
      verbose: true
    });

    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, React.CSSProperties> = {};

    for (const move of moves) {
      newSquares[move.to] = {
        background: chessGame.get(move.to) && chessGame.get(move.to)?.color !== chessGame.get(square)?.color?'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
        :'radial-gradient(circle, rgba(0,0,0,.1)25%, transparent 25%)',
        borderRadius:'50%'
      }
    }
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)'
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick({
    square,
    piece
  }: SquareHandlerArgs){
    if (!moveFrom && piece){
      const hasMoveOptions = getMoveOptions(square as Square);

      if (hasMoveOptions){
        setMoveFrom(square);
      }

      return;
    }

    const moves = chessGame.moves({
      square: moveFrom as Square,
      verbose: true
    });
    const foundMove = moves.find(m => m.from === moveFrom && m.to === square);

    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square as Square);

      setMoveFrom(hasMoveOptions ? square: '');
      return;
    }
    try {
      //const beforeFen = chessGame.fen();
      const sendthatfen = chessGame.fen();
      setOldFen(chessGame.fen());
      chessGame.move({
        from: moveFrom,
        to: square,
        promotion: 'q'
      });
      setOldMove(moveFrom + square);
      setChessPosition(chessGame.fen()); 
      chooseFen(sendthatfen, moveFrom + square);
      /*console.log("AEval1: " + eval1 + " Eval2: " + eval2);
      newEval(chessGame.fen());
      console.log("BEval1: " + eval1 + " Eval2: " + eval2);
      const evalA = await newEval(chessGame.fen());
      setEval2(evalA);
      console.log("CEval1: " + eval1 + " Eval2: " + eval2);
      setNewFen(fens[(Math.floor(Math.random() * fens.length))]);
      console.log("DEval1: " + eval1 + " Eval2: " + eval2);
      newEval(newFen);
      console.log("EEval1: " + eval1 + " Eval2: " + eval2);
      while(Math.abs(eval1 - eval2) > 100){
        setNewFen(fens[(Math.floor(Math.random() * fens.length))]);
        console.log("FEval1: " + eval1 + " Eval2: " + eval2);
        newEval(newFen);
        console.log("GEval1: " + eval1 + " Eval2: " + eval2);
      }
      setBigChessPosition(newFen);
      console.log("HEval1: " + eval1 + " Eval2: " + eval2);*/

      /*const afterFen = chessGame.fen();
      if (beforeFen !== afterFen){
        //evaluateFen(chessGame.fen()).then((score) => setEval1(score));
        evaluateFen(chessGame.fen())
        .then(value => setEval1(value))
        .catch;
        setRandFen(fens[Math.floor(Math.random() * fens.length)]);
        evaluateFen(chessGame.fen())
        .then(value => setEval2(value))
        .catch;
        //evaluateFen(randFen).then((score) => setEval2(score));
        while(Math.abs(eval1 - eval2) > 2){
          setRandFen(fens[Math.floor(Math.random() * fens.length)]);
          //evaluateFen(randFen).then((score) => setEval2(score));
          evaluateFen(chessGame.fen())
          .then(value => setEval2(value))
          .catch;
        }
        setChessPosition(randFen);
        console.log("Eval1: " + eval1 + " Eval2: " + eval2);
      } */

    }catch {
      const hasMoveOptions = getMoveOptions(square as Square);

      if (hasMoveOptions){
        setMoveFrom(square);
      }

      return;
    }

    setSquareStyles(prev => {
      const newSquareStyles = {
        ...prev
      };
      newSquareStyles[moveFrom] = {
        backgroundColor: 'rgba(255,0,0,0.2)'
      };
      newSquareStyles[square] = {
        backgroundColor: 'rgba(255,0,0,0.2)'
      };
      
      return newSquareStyles;
    });

    setMoveFrom('');
    //find pos of king
    
    setOptionSquares({});
  }

  function onPieceDrop({
      sourceSquare,
      targetSquare
    }: PieceDropHandlerArgs) {
      // type narrow targetSquare potentially being null (e.g. if dropped off board)
      if (!targetSquare) {
        return false;
      }

      // try to make the move according to chess.js logic
      try {
        chessGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q' // always promote to a queen for example simplicity
        });

        // update the position state upon successful move to trigger a re-render of the chessboard
        setChessPosition(chessGame.fen());

        /*evaluateFen(chessGame.fen()).then((score) => setEval1(score));
        setRandFen(fens[Math.floor(Math.random() * fens.length)]);
        evaluateFen(randFen).then((score) => setEval2(score));
        while(Math.abs(eval1 - eval2) > 2){
          setRandFen(fens[Math.floor(Math.random() * fens.length)]);
          evaluateFen(randFen).then((score) => setEval2(score));
        }
        setChessPosition(randFen);
        console.log("Eval1: " + eval1 + " Eval2: " + eval2);*/
        
        /*evaluateFen(chessGame.fen())
        .then(value => setEval1(value))
        .catch;*/

        setSquareStyles(prev => {
          const newSquareStyles = {
            ...prev
          };
          newSquareStyles[sourceSquare] = {
            backgroundColor: 'rgba(255,0,0,0.2)'
          };
          newSquareStyles[targetSquare] = {
            backgroundColor: 'rgba(255,0,0,0.2)'
          };

          return newSquareStyles;
        });

        // return true as the move was successful
        return true;
      } catch {
        // return false as the move was not successful
        return false;
      }
    }

  function smallOnSquareClick({
    square,
    piece
  }: SquareHandlerArgs){
    if (!moveFrom && piece){
      const hasMoveOptions = getMoveOptions(square as Square);
      if (hasMoveOptions){
        setMoveFrom(square);
      }
      return;
    }
    const moves = chessGame.moves({
      square: moveFrom as Square,
      verbose: true
    });
    const foundMove = moves.find(m => m.from === moveFrom && m.to === square);
    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square as Square);
      setMoveFrom(hasMoveOptions ? square: '');
      return;
    }
    try {
      chessGame.move({
        from: moveFrom,
        to: square,
        promotion: 'q'
      });
      setChessPosition(chessGame.fen()); 
    }catch {
      const hasMoveOptions = getMoveOptions(square as Square);
      if (hasMoveOptions){
        setMoveFrom(square);
      }
      return;
    }
    setSquareStyles(prev => {
      const newSquareStyles = {
        ...prev
      };
      newSquareStyles[moveFrom] = {
        backgroundColor: 'rgba(255,0,0,0.2)'
      };
      newSquareStyles[square] = {
        backgroundColor: 'rgba(255,0,0,0.2)'
      };
      return newSquareStyles;
    });
    setMoveFrom('');
    setOptionSquares({});
  }

  const boardOptions = {
    arrows,
    onSquareClick: smallOnSquareClick,
    position: chessPosition,
    squareStyles,
    id: 'board1',
  };

  const bigBoardOptions = {
    onPieceDrop,
    onSquareClick,
    position: bigChessPosition,
    squareStyles: optionSquares,
    id: 'board2',
  };

  return (
    //<DndProvider backend={HTML5Backend}>
    <>
      <button onClick={handleEvaluate}>Evaluate</button>
      {loading && <p>Evaluating...</p>} 
      <div className="statusText">{gameStatus}</div>
      <div className="statusText">{streakMsg}</div>
      <div className="game-container">
        <div className="board-layer">
          <div className="boards">
            <div id ="board1">
            <Chessboard
              options={boardOptions}
            />
            </div>
            <div id ="board2">
            <Chessboard
              options={bigBoardOptions}
            />
            </div>
          </div>
        </div>

        <div
          className={`overlay ${showEffex ? "overlay-front" : "overlay-back"}`}
        >
        <div className="effex-box">
          <h3>{showEffex}</h3>
        </div>
          {/* result UI */}
        </div>


        {/*<div
          className={`overlay ${afterBoard ? "overlay-front" : "overlay-back"}`}
        >
        <div className="analysis-box">
          <BoardPopup pos={pos}/> 
        </div>
        </div>*/}


        <div
          className={`overlay ${gameResult ? "overlay-front" : "overlay-back"}`}
        >
        <div className="result-box">
          <h2>{gameResult}</h2>
          <EvalGraph evals={evalHistory} />
        </div>
          {/* result UI */}
        </div>
      </div>
      </>
      //</DndProvider>
  ); 
}
export default App;
