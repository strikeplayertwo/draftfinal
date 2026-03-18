import { useEffect, useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { extractFENsFromGames } from '../tools/generate-fens';
import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";
import { Chess, Square } from 'chess.js';
//import moveAudio from './assets/sounds/move.mp3';
//import captureAudio from './assets/sounds/capture.mp3';
import './App.css'
import { evaluateFen } from "./engine/evaluate";
import { workerA, workerB, workerC, workerD } from "./engine/stockfishWorker";
import pgnData from "./assets/twic1326.pgn?raw";
import { createClient, User } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
type Arrow = {
  startSquare: Square;
  endSquare: Square;
  color: string;
};
type EvalGraphProps = {
  evals: number[];
  bPosHistory: string[];
  bColors: string[];
  onJumpToMove: (index: number) => void;
};
type GameResult = {
  id: string;
  user_id: string;
  accuracy: number;
  created_at: string;
};

function EvalGraph({ evals, bPosHistory, bColors, onJumpToMove }: EvalGraphProps) {
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
      {bPosHistory.map((_, i) => {
        const x = 
          bPosHistory.length === 1
            ? width / 2
            : (i / (bPosHistory.length - 1)) * width;

        const squareSize = 200 / bPosHistory.length;
        return (
          <rect
            key={i}
            x={x - squareSize / 2}
            y={height - 40}
            width={squareSize}
            height={squareSize}
            fill={bColors[i] || "#000"}
            style={{ cursor: "pointer" }}
            onClick={() => onJumpToMove(i)}
          />
        );
      })}
    </svg>
  );
}

function App() {
  const fens = extractFENsFromGames(pgnData,47); //pick random fen and set position to it
  const randomFen: number = Math.floor(Math.random() * fens.length);
  const [gameStatus, setGameStatus] = useState("Moves played: 0");
  const [movesplayed, setMovesPlayed] = useState(-1);
  const [gameResult, setGameResult] = useState("");
  const [showEffex, setShowEffex] = useState("");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakMsg, setStreakMsg] = useState("Current Streak: 0");
  const [highestStreak, setHighestStreak] = useState(0);
  const [bmcounter, setbmcounter] = useState(0);
  const [brilcounter, setbrilcounter] = useState(0);
  const [evalHistory, setEvalHistory] = useState<number[]>([]);
  const [posHistory, setPosHistory] = useState<string[]>([]);
  const [realMove, setRealMove] = useState(1);
  const [showBack2, setShowBack2] = useState(false);
  const [storeGameResult, setStoreGameResult] = useState("");
  const [DisplayEval, setDisplayEval] = useState("");
  const chessGameRef = useRef(new Chess(fens[randomFen]));
  const chessGame = chessGameRef.current;
  const [bPosHistory, setBPosHistory] = useState<string[]>([chessGame.fen()]);
  const [bColors, setBColors] = useState<string[]>([]);
  const smallGameRef = useRef(new Chess(chessGame.fen()));
  const smallGame = smallGameRef.current;
  const [startingEval, setStartingEval] = useState(0);
  const [dif, setDif] = useState(0);
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [bigChessPosition, setBigChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState('');
  const [oldMove, setOldMove] = useState('');
  const [oldFen, setOldFen] = useState(chessGame.fen());
  const tryFenRef = useRef(new Chess(oldFen));
  const tryFenGame = tryFenRef.current;
  const [accuracy, setAccuracy] = useState(100);

  //supabase stuff
  const [user, setUser] = useState<User | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!user) return; // don't fetch if not logged in

    async function fetchGameHistory() {
      if (!user) return;
      const { data } = await supabase
        .from("game_results")
        .select()
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setGameHistory(data);
    }

    fetchGameHistory();
  }, [user]);

    useEffect(() => {
    // Get current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error("Sign in error:", error.message);
  }

  async function signUpWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) console.error("Sign up error:", error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  function highlightKingSquare(chessInstance: Chess, type: string) {
    let cSquare = "a1";
    while(chessInstance.get(cSquare as Square) === null || chessInstance.get(cSquare as Square)?.type !== 'k' || chessInstance.get(cSquare as Square)?.color !== chessInstance.turn()){
      if(cSquare[1] !== '8'){
        cSquare = cSquare[0] + String.fromCharCode(cSquare.charCodeAt(1) + 1);
      }else{
        cSquare = String.fromCharCode(cSquare.charCodeAt(0) + 1) + '1';
      }
    };
    if(type === "small"){
      setSquareStyles({
        [cSquare]: {
          backgroundColor: 'rgba(255,0,0,0.2)'
        }
      }); 
    }else if(type === "big"){
      setOptionSquares({
        [cSquare]: {
          backgroundColor: 'rgba(255,0,0,0.2)'
        }
      });
    }
  }
  
  const [squareStyles, setSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});
  highlightKingSquare(chessGame, "big");
  const [loading, setLoading] = useState(false);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [oldEval, setOldEval] = useState(-10000);
  const isAnalyzing = useRef(false);

  useEffect(() => {
    // Prevent re-entrant calls
    if (isAnalyzing.current) return;

    setSquareStyles({});
    setArrows([]);

    if (realMove === 1) {
      setPosHistory([chessPosition]);
      setMovesPlayed(prev => {
        const next = prev + 1;
        setGameStatus("Moves played: " + next);
        return next;
      });
    } else {
      setPosHistory(prev => [...prev, chessPosition]);
    }

    smallGame.load(chessPosition);

    if (realMove !== 2) {
      isAnalyzing.current = true;
      findBestMove(realMove, chessPosition).finally(() => {
        isAnalyzing.current = false;
      });
    } else {
      highlightKingSquare(smallGame, "small");
    }
  }, [chessPosition]);

  function handleJumpToMove(index: number) {
    const fen = bPosHistory[index];
    if (!fen) return;
    
    setRealMove(2);
    setArrows([]);
    setShowBack2(true);
    setStoreGameResult(gameResult);
    setGameResult("");
    smallGame.load(fen);
    setChessPosition(fen);
    setPosHistory(prev => prev.slice(0, index + 1));
  }

  async function triggerEnd(finalmessage: string, accuracy: number){
    setGameResult(finalmessage);
    await saveGameResult(accuracy);
  }

  async function saveGameResult(accuracy: number) {
    if (!user) return; // not logged in, skip
    const { error } = await supabase
      .from("game_results")
      .insert({ user_id: user.id, accuracy });
    if (error) console.error("Failed to save game result:", error);
  }

  async function findBestMove(moveType: number, chessPos: string): Promise<void> {
    let fenAfterMove = "";
    let fenBeforeMove = "";
    if (moveType === 1){
      fenAfterMove = chessGame.fen();
      fenBeforeMove = oldFen;
    }else{
      fenAfterMove = chessPos;
      fenBeforeMove = posHistory[posHistory.length - 1];
    }
    if (movesplayed > -3){
      setLoading(true);
      try {
        console.log("findBestMove started", { moveType, fenAfterMove, fenBeforeMove });
        const [result, result2] = await Promise.all([
          workerA.getBestLine(fenAfterMove, 18).then(r => { console.log("workerA done", r); return r; }),//best line after played move
          workerB.getBestLine(fenBeforeMove, 18).then(r => { console.log("workerB done", r); return r; }),//best line before played move
        ]);
        console.log("Promise.all resolved");
        
        const pv = result.pv;
        console.log("PV: " + pv);
        const bestMove = pv?.split(" ")?.[0];
        const bestResponse = pv?.split(" ")?.[1];
        const nextResponse = pv?.split(" ")?.[2];
        
        if (showBack2 === true && moveType === 0){
          const lines = await workerB.getMultiPV(fenAfterMove, 18, 3);
          const maxMoves = 6;
          const formatted = lines
            .filter(line => line)
            .map(line => {
              const shortPv = line.pv
                .split(" ")
                .slice(0, maxMoves)
                .join(" ");

              if (line.mate !== null) {
                return `#${line.mate} ${shortPv}`;
              }
              
              if (line.cp !== null) {
                if (fenAfterMove.split(" ")[1] === "b" && line.cp !== null) {
                  line.cp = -line.cp;
                }
                return `${line.cp > 0 ? "+" : ""}${(line.cp / 100).toFixed(2)} ${shortPv}`;
              }

              return null;
            })
            .filter(Boolean)
            .join("\n");

          setDisplayEval(formatted);
        };
        const pv2 = result2.pv;
        const bestMove2 = pv2?.split(" ")?.[0];
        
        if (oldMove === bestMove2){
          setArrows(
          bestMove
            ? [
                {
                  startSquare: bestMove.substring(0, 2) as Square,
                  endSquare: bestMove.substring(2, 4) as Square,
                  color: "rgb(0, 128, 0)",
                },
                ...(bestResponse
                  ? [{
                      startSquare: bestResponse.substring(0, 2) as Square,
                      endSquare: bestResponse.substring(2, 4) as Square,
                      color: "rgb(0, 128, 0)",
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

  async function handleBack() {
    setRealMove(2);
    if(posHistory.length > 1){
      smallGame.load(posHistory[posHistory.length - 2]);
      setPosHistory(prev => prev.slice(0, -1));
    }else{
      smallGame.load(oldFen);
    }
    setChessPosition(smallGame.fen());
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
    console.log("chooseFen checkpoint 1");
    let ourOldEval = oldEval;
    if (movesplayed === 0){
      ourOldEval = await workerC.getEval(oldFen, 18);
      setStartingEval(ourOldEval);
      setEvalHistory(prev => [...prev, ourOldEval]);
      console.log("Starting Eval logged: " + oldFen);
    }
    console.log("chooseFen checkpoint 2");
    const [result, bingusSetup] = await Promise.all([
      workerC.getBestLine(chessGame.fen(), 18).then(r => { console.log("chooseFen workerA done", r); return r; }),
      workerD.getBestLine(fungusFen, 18).then(r => { console.log("chooseFen workerB done", r); return r; }),
    ]);
    console.log("chooseFen checkpoint 3");
    const mate = result.mate;
    const ourEval = -1 * await workerC.getEval(chessGame.fen(), 18);
    let bestEval = ourEval;
    let streaker = currentStreak;

    const pvb = bingusSetup.pv;
    const bingusMove = pvb?.split(" ")?.[0];
    if(bingusMove !== fungusMove){ 
      tryFenGame.load(fungusFen);
      tryFenGame.move({from: bingusMove.substring(0, 2), to: bingusMove.substring(2, 4), promotion: 'q'});
      bestEval = -1 * await workerD.getEval(tryFenGame.fen(), 18);
      console.log(bingusMove + " not equals " + fungusMove);
    }else{
      console.log(bingusMove + " equals " + fungusMove);
    }
    console.log("chooseFen checkpoint 4");
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
    }else if (ourEval - bestEval >= -30 || ourEval >= bestEval * 0.85 || ourEval * 0.85 >= bestEval){
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
    let thisaccuracy = Math.round((100 * Math.exp((ourEval - bestEval) / 200)) * 10);
    if(thisaccuracy > 1100){
      thisaccuracy = 1100;
    }
    if (thisaccuracy > 1000){
      setBColors(prev => [...prev, "rgb(0, 251, 255)"]);
    }else if (thisaccuracy === 1000){
      setBColors(prev => [...prev, "rgb(0, 255, 55)"]);
    }else if (thisaccuracy > 850){
      setBColors(prev => [...prev, "rgb(0, 137, 7)"]);
    }else if (thisaccuracy > 600){
      setBColors(prev => [...prev, "rgb(255, 174, 0)"]);
    }else{
      setBColors(prev => [...prev, "rgb(255, 0, 0)"]);
    }
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
    }else if (streaker === 2){
      streakbonus = 50;
    }else if (streaker === 3){
      streakbonus = 80;
    }else if (streaker === 4){
      streakbonus = 125;
    }else if (streaker === 5){
      streakbonus = 200;
    }else if (streaker >= 6){
      streakbonus = 300;
    }
    let msg = "";
    for (let i = 0; i < streaker; i++){
      msg += "🔥";
    }
    if(streaker > 0){
      if(doublemessage){
        stopEffex(msg + " +" + streakbonus + " eval");
      }else{
        setShowEffex(msg + " +" + streakbonus + " eval");
        stopEffex();
      }
    }

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
        triggerEnd("You win! Final result: " + (mate > 0 ? "You mate in " + mate : "You mate in " + (-mate)) + " Final stats: " + "Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (highestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter) + ", Starting Eval: " + startingEval, displayAccuracy/10);
      }else{
        triggerEnd("Game over! Final result: " + (mate > 0 ? "You are mated in " + mate : "You are mated in " + (-mate)) + " Final stats: " + "Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (highestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter)  + ", Starting Eval: " + startingEval, displayAccuracy/10);
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
    const MAX_ATTEMPTS = 400;
    while (attempts < MAX_ATTEMPTS) {
      const newFens = fens[Math.floor(Math.random() * fens.length)];
      const evalB = await workerA.getEval(newFens, 10);
      //if ((evalA - evalB <= 30) && (evalA - evalB >= -30)){ 
      if (Math.abs(evalA) < 50){
        if ((evalA - evalB <= 30) && (evalA - evalB >= -30)){
          setBigChessPosition(newFens);
          chessGame.load(newFens);
          highlightKingSquare(chessGame, "big");

          const newevalB = await workerB.getEval(newFens, 18);
          const difference = evalA - newevalB;
          setOldEval(newevalB);
          setDif(difference);
          console.log("Success 1! Elo Within 30 " + evalA + " " + evalB + " " + newevalB + " " + difference);
          setBPosHistory(prev => [...prev, newFens]);
          return;
        }
      }else if (((evalA < evalB / 0.6) && (evalA > evalB * 0.6) && (evalA >= 0)) || ((evalA > evalB / 0.6) && (evalA < evalB * 0.6) && (evalA <= 0))){
        const newevalB = await workerB.getEval(newFens, 18);
        if (((evalA < newevalB / 0.5) && (evalA > newevalB * 0.5) && (evalA >= 0)) || ((evalA > newevalB / 0.5) && (evalA < newevalB * 0.5) && (evalA <= 0))){
          setBigChessPosition(newFens);
          chessGame.load(newFens);
          highlightKingSquare(chessGame, "big");

          setOldEval(newevalB);
          const difference = evalA - newevalB;
          setDif(difference);
          console.log("Success 2! Elo within division range" + evalA + " " + evalB + " " + newevalB + " " + difference);
          setBPosHistory(prev => [...prev, newFens]);
          return;
        }else{
          console.log("Inaccuracy error");
        }
      }else if (((Math.abs(evalA) < Math.abs(evalB) / 0.7) && (Math.abs(evalA) > Math.abs(evalB) * 0.7)) || ((Math.abs(evalA) > Math.abs(evalB) / 0.7) && (Math.abs(evalA) < Math.abs(evalB) * 0.7))){
        /*const switchedFen = newFens.split(" ")[0] + " " + (newFens.split(" ")[1] === "w" ? "b" : "w") + " " + newFens.split(" ").slice(2).join(" ");
        console.log("eval switch: " + newFens + " " + switchedFen);
        setBigChessPosition(switchedFen);
        chessGame.load(switchedFen)
        const newevalB = await newEval(switchedFen, 18);
        const difference = evalA - newevalB;
        setDif(difference);
        console.log("Success 3! " + evalA + " " + evalB + " " + newevalB + " " + difference);
        return;*/

        const result4 = await workerA.getBestLine(newFens, 18);
        const pvswap = result4.pv;
        const swapMove = pvswap?.split(" ")?.[0];
        chessGame.load(newFens);
        try{
          chessGame.move({from: swapMove.substring(0, 2), to: swapMove.substring(2, 4), promotion: 'q'});
        }catch{
          console.log("invalid move in swapFen");
        }
        const newevalB = await workerB.getEval(chessGame.fen(), 18);

        if (((evalA < newevalB / 0.5) && (evalA > newevalB * 0.5) && (evalA >= 0)) || ((evalA > newevalB / 0.5) && (evalA < newevalB * 0.5) && (evalA <= 0))){
          setBigChessPosition(chessGame.fen());
          highlightKingSquare(chessGame, "big");

          setOldEval(newevalB);
          const difference = evalA - newevalB;
          setDif(difference);
          console.log("Success 3! Elo swapped" + evalA + " " + evalB + " " + newevalB + " " + difference);
          setBPosHistory(prev => [...prev, chessGame.fen()]);
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
      triggerEnd("You win! Final stats: Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (highestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter)  + ", Starting Eval: " + startingEval + ", Final Eval: " + evalA, displayAccuracy/10);
    }else{
      triggerEnd("Game over! Final stats: Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (highestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter)  + ", Starting Eval: " + startingEval + ", Final Eval: " + evalA, displayAccuracy/10);
    }
  }

  /*function runEval() {
    //const chess = new Chess();
    const score = evaluateFen(chessGame.fen());
    console.log("Evaluation:", score);
  }*/


  function getMoveOptions(square: Square, chess = chessGame) {
    const moves = chess.moves({
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
        background: chess.get(move.to) && chess.get(move.to)?.color !== chess.get(square)?.color?'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
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
      setRealMove(1);
      setChessPosition(chessGame.fen()); 
      chooseFen(sendthatfen, moveFrom + square);

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
        setRealMove(1);
        setChessPosition(chessGame.fen());

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
    console.log("1");
    if (!moveFrom && piece){
      console.log("2");
      const hasMoveOptions = getMoveOptions(square as Square, smallGame);
      if (hasMoveOptions){
        setMoveFrom(square);
      }
      return;
    }
    const moves = smallGame.moves({
      square: moveFrom as Square,
      verbose: true
    });
    const foundMove = moves.find(m => m.from === moveFrom && m.to === square);
    if (!foundMove) {
      console.log("3");
      console.log(smallGame);
      console.log(moves);
      console.log(moveFrom);
      const hasMoveOptions = getMoveOptions(square as Square, smallGame);
      setMoveFrom(hasMoveOptions ? square: '');
      return;
    }
    try {
      smallGame.move({
        from: moveFrom,
        to: square,
        promotion: 'q'
      });
      console.log("4");
      setRealMove(0);
      setChessPosition(smallGame.fen());
      console.log("5"); 
    }catch (e) {
      console.log(e);
      console.log("6");
      const hasMoveOptions = getMoveOptions(square as Square, smallGame);
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
    setOldMove(moveFrom + square);
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
    <>
      <div className="auth-bar">
        {user ? (
          <>
            <span>{user.email}</span>
            <button onClick={signOut}>Sign out</button>
          </>
        ) : (
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={() => signInWithEmail(email, password)}>Sign in</button>
            <button onClick={() => signUpWithEmail(email, password)}>Sign up</button>
          </div>
        )}
      </div>
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
          <EvalGraph evals={evalHistory} bPosHistory={bPosHistory} bColors={bColors} onJumpToMove={handleJumpToMove}/>
          <h3>Past Games</h3>
          <ul>
            {gameHistory.map((game) => (
              <li key={game.id}>
                {new Date(game.created_at).toLocaleDateString()} — Accuracy: {game.accuracy.toFixed(1)}%
              </li>
            ))}
          </ul>
        </div>
          {/* result UI */}
        </div>
      </div>
      <button className="back-button" onClick={handleBack}>Back</button>
      <button className={`back2-button ${showBack2 ? "show" : "hide"}`} onClick={() => {setShowBack2(false); setGameResult(storeGameResult);}}>Back to Graph</button>
      <div className={`evals-graph ${showBack2 ? "show" : "hide"}`}>{DisplayEval}</div>
      </>
  ); 
}
export default App;
