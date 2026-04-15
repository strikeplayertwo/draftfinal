import { useEffect, useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { extractFENsFromGames } from '../tools/generate-fens';
import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";
import { Chess, Square } from 'chess.js';
//import moveAudio from './assets/sounds/move.mp3';
//import captureAudio from './assets/sounds/capture.mp3';
import './App.css'
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
type ClassicGameResult = {
  id: string;
  user_id: string;
  accuracy: number;
  result: string;
  opening: string;
  created_at: string;
};

type DailyGameResult = {
  id: string;
  user_id: string;
  accuracy: number;
  daily_score: number;
  created_at: string;
};

type RankInfo = {
  today:   { rank: number; total: number };
  week:    { rank: number; total: number };
  allTime: { rank: number; total: number };
} | null;

type UserProgress = {
  level: number;
  beaten_openings: string[];
  unlocked_openings: string[];
  userMinPly: number;
};

type CaroKannProgress = {
  line_1: string;
};

type MoveInfo = {
  san: string;
  from: string;
  to: string;
  piece: string;
  eval: number;
  main: boolean;
};



const levelUnlocks: Record<number, string[]> = {
  2: ["Random", "French", "Caro-Kann", "Benoni"],
  3: ["English", "Giuoco Piano/Pianissimo", "Catalan"],
  4: ["Queen's Pawn Game", "Queen's Bishop Game", "Queen's Gambit Declined"],
  5: ["Queen's Indian", "King's Indian", "Gruenfeld"],
  6: ["Ruy Lopez", "Reti", "Sicilian"],
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
  //const fens = extractFENsFromGames(pgnData,94, "All");
  const [fens, setFens] = useState<string[]>([]);
  const [dailyFens, setDailyFens] = useState<string[]>([]);
  const [dailyBestMoves, setDailyBestMoves] = useState<string[]>([]);
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
  const [isAnalysisMove, setisAnalysisMove] = useState("real");
  const [showBack2, setShowBack2] = useState(false);
  const [showPosList, setShowPosList] = useState(false);
  const [storeGameResult, setStoreGameResult] = useState("");
  const [fenIndex, setFenIndex] = useState(0);
  const [fiveFens, setFiveFens] = useState<string[]>([]);
  // create a chess game using a ref to always have access to the latest game state within closures and maintain the game state across renders
  const [DisplayEval, setDisplayEval] = useState("");
  const [PosList, setPosList] = useState("");
  const chessGameRef = useRef<Chess | null>(null);
  const [fenScores, setFenScores] = useState(0);
  //const chessGameRef = useRef(new Chess(fens[randomFen]));
  //const chessGame = chessGameRef.current;
  const [bPosHistory, setBPosHistory] = useState<string[]>([]);
  const [bColors, setBColors] = useState<string[]>([]);
  const smallGameRef = useRef<Chess | null>(null);
  const [startingEval, setStartingEval] = useState(0);
  const [dif, setDif] = useState(0);
  // track the current position of the chess game in state to trigger a re-render of the chessboard
  const [chessPosition, setChessPosition] = useState("");
  const [bigChessPosition, setBigChessPosition] = useState("");
  const [moveFrom, setMoveFrom] = useState('');
  const [oldMove, setOldMove] = useState('');
  const [oldFen, setOldFen] = useState("");
  const tryFenRef = useRef<Chess | null>(null);
  //const tryFenRef = useRef(new Chess(oldFen));
  //const tryFenGame = tryFenRef.current;
  const [accuracy, setAccuracy] = useState(100);

  const [screen, setScreen] = useState<"title" | "versus" | "classic" | "daily" | "settings" | "analytics">("title");

  //supabase stuff
  const [user, setUser] = useState<User | null>(null);
  const [gameHistory, setGameHistory] = useState<ClassicGameResult[]>([]);
  const [dailyGameHistory, setDailyGameHistory] = useState<DailyGameResult[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rankInfo, setRankInfo] = useState<RankInfo>(null);
  
  //opening stuff
  const daOpeningFensRef = useRef<string[]>([]);
  const [caroKannProgress, setCaroKannProgress] = useState<CaroKannProgress>({
    line_1: "e2e4 c7c6"
  });
  const [showOpeningSelect, setShowOpeningSelect] = useState(false);
  const [gameOpening, setGameOpening] = useState("None");
  const [reqMove, setReqMove] = useState<string>("none");
  const [daOpeningFens, setDaOpeningFens] = useState<string[]>([]);
  const [daOpeningMoves, setDaOpeningMoves] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 1,
    unlocked_openings: ["None"],
    beaten_openings: [],
    userMinPly: 4
  });
  const openings = ["None", "Random", "Sicilian", "French", "Caro-Kann", "English", "Ruy Lopez", "King's Indian", "Queen's Pawn Game", "Queen's Bishop Game", "Queen's Indian", "Gruenfeld", "Queen's Gambit Declined", "Reti", "Benoni", "Catalan", "Giuoco Piano/Pianissimo"];
  const openingPlyLengths: Record<string, number> = { "None": 6, "Random": 6, "Sicilian": 2, "French": 4, "Caro-Kann": 2, "English": 1, "Ruy Lopez": 5, "King's Indian": 4, "Queen's Pawn Game": 2, "Queen's Bishop Game": 7, "Queen's Indian": 6, "Queen's Gambit Declined": 3, "Reti": 1, "Benoni": 4, "Gruenfeld": 6, "Catalan": 5, "Giuoco Piano/Pianissimo": 5 };
  const openingMoveMap: Record<string, string> = {
    "None": "",
    "Random": "",
    "Sicilian": "e2e4 c7c5",
    "French": "e2e4 e7e6 d2d4 d7d5",
    "Caro-Kann": "e2e4 c7c6",
    "English": "c2c4",
    "Ruy Lopez": "e2e4 e7e5 g1f3 b8c6 f1b5",
    "King's Indian": "d2d4 g8f6 c2c4 g7g6",
    "Queen's Pawn Game": "d2d4 d7d5",
    "Queen's Bishop Game": "d2d4 d7d5 g1f3 g8f6 c1f4 c7c5 e2e3",
    "Queen's Indian": "d2d4 g8f6 c2c4 e7e6 g1f3 b7b6",
    "Gruenfeld": "d2d4 b8c6 c2c4 g7g6 g1f3 b8c6",
    "Queen's Gambit Declined": "d2d4 d7d5 c2c4",
    "Reti": "g1f3",
    "Benoni": "d2d4 g8f6 c2c4 c7c5",
    "Catalan": "d2d4 g8f6 c2c4 e7e6 g2g3",
    "Giuoco Piano/Pianissimo": "e2e4 e7e5 g1f3 b8c6 f1c4"
  };
  useEffect(() => {
    if (!user) return; // don't fetch if not logged in

    async function fetchGameHistory() {
      if (!user) return;
      const { data } = await supabase
        .from("classic_game_results")
        .select()
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setGameHistory(data);
    }

    async function fetchDailyGameHistory() {
      if (!user) return;
      const { data } = await supabase
        .from("daily_game_results")
        .select()
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setDailyGameHistory(data);
    }

    async function fetchProgress() {
      const { data, error } = await supabase
        .from("user_progress")
        .select("level, unlocked_openings, beaten_openings, userMinPly")
        .eq("user_id", user!.id)
        .single();

      if (error || !data) {
        // First time user — create their row
        await supabase.from("user_progress").insert({
          user_id: user!.id,
          level: 1,
          unlocked_openings: ["None"],
          beaten_openings: []
        });
      } else {
        setUserProgress(data);
      }
    }

    async function fetchCaroKannProgress() {
      if (!user) return;
      const { data, error } = await supabase
        .from("caro_kann_progress")
        .select("line_1")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        // First time — create their row
        await supabase.from("caro_kann_progress").insert({
          user_id: user.id,
          line_1: "e2e4 c7c6"
        });
      } else {
        setCaroKannProgress(data);
      }
    }

    fetchGameHistory();
    fetchDailyGameHistory();
    fetchProgress();
    fetchCaroKannProgress();
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

  useEffect(() => {
    daOpeningFensRef.current = daOpeningFens;
  }, [daOpeningFens]);

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

  async function levelUp() {
    if (!user) return;
    const newLevel = userProgress.level + 1;
    const newUnlocks = levelUnlocks[newLevel] ?? []; // openings unlocked at this level
    const updated = [...userProgress.unlocked_openings, ...newUnlocks];
    let minPly = userProgress.userMinPly;
    if(newLevel === 6){
      minPly = 7;
    }else if (newLevel === 7){
      minPly = 10;
    }

    const { error } = await supabase
      .from("user_progress")
      .update({ level: newLevel, unlocked_openings: updated, userMinPly: minPly })
      .eq("user_id", user.id);

    if (!error) {
      setUserProgress({ level: newLevel, unlocked_openings: updated, beaten_openings: userProgress.beaten_openings, userMinPly: minPly });
      if (newUnlocks.length > 0) {
        //setGameResult(prev => `${prev}\nLevel ${newLevel}! Unlocked: ${newUnlocks.join(", ")}`);
        setGameResult(prev => 
          `${prev}\n Level <span style="color: #3cff00;">${newLevel}</span>! Unlocked: ${newUnlocks.join(", ")}`
        );
      } else {}
    }
  }

  async function addMoveToLine(move: string, lineKey: keyof CaroKannProgress) {
    if (!user) return;
    const updatedLine = caroKannProgress[lineKey] + " " + move;

    await supabase
      .from("caro_kann_progress")
      .update({ [lineKey]: updatedLine })
      .eq("user_id", user.id);

    setCaroKannProgress(prev => ({
      ...prev,
      [lineKey]: updatedLine
    }));
  }

  async function getMoveInfos(fen: string): Promise<MoveInfo[]> {
    const game = new Chess(fen);
    const lines = await workerA.getTop6Lines(fen, 16);
    
    return lines.map(line => {
      const moveSan = line.pv.split(" ")[0];
      const move = game.move(moveSan);
      game.undo();
      return {
        san: move.san,
        from: move.from,
        to: move.to,
        piece: move.piece,
        eval: line.cp / 100,
        main: false,//true if in main line on table
      };
    });
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
    if(screen === "daily" || type === "daily"){
      setDailySquares({
        [cSquare]: {
          backgroundColor: 'rgba(255,0,0,0.2)'
        }
      });
    }else if(type === "small"){
      setSmallSquares({
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

  //const [squareStyles, setSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});
  const [dailySquares, setDailySquares] = useState<Record<string, React.CSSProperties>>({});
  const [smallSquares, setSmallSquares] = useState<Record<string, React.CSSProperties>>({});
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [oldEval, setOldEval] = useState(-10000);
  const isAnalyzing = useRef(false);
  const [moveInfos, setMoveInfos] = useState<MoveInfo[]>([]);

  useEffect(() => {
    // Prevent re-entrant calls
    if (isAnalyzing.current) return;

    const smallGame = smallGameRef.current;
    if (!smallGame) return;
    setSmallSquares({});
    setArrows([]);

    if (isAnalysisMove === "real") {
      setPosHistory([chessPosition]);
      setMovesPlayed(prev => {
        const next = prev + 1;
        return next;
      });
      setGameStatus("Moves played: " + (movesplayed + 1));
    } else {
      setPosHistory(prev => [...prev, chessPosition]);
    }

    smallGame.load(chessPosition);

    if (isAnalysisMove !== "endAnalysis") {
      isAnalyzing.current = true;
      findBestMove(isAnalysisMove, chessPosition).finally(() => {
        isAnalyzing.current = false;
      });
    } else {
      highlightKingSquare(smallGame, "small");
    }
  }, [chessPosition]);

  function handleJumpToMove(index: number) {
    const smallGame = smallGameRef.current;
    if (!smallGame) return;
    const fen = bPosHistory[index];
    if (!fen) return;
    
    setisAnalysisMove("endAnalysis");
    setArrows([]);
    setShowBack2(true);
    setStoreGameResult(gameResult);
    setGameResult("");
    smallGame.load(fen);
    setChessPosition(fen);
    setPosHistory(prev => prev.slice(0, index + 1));
  }

  function dailyHandleJumpToMove(index: number) {
    const chessGame = chessGameRef.current;
    if (!chessGame) return;
    const fen = dailyFens[index];
    if (!fen) return;
    
    setisAnalysisMove("endAnalysis");
    setArrows([]);
    setDailySquares({});
    setShowBack2(true);
    setStoreGameResult(gameResult);
    setGameResult("");
    chessGame.load(fen);
    setBigChessPosition(fen);
    setPosHistory([fen]);
    console.log("PosHistory: " + posHistory);
  }

  async function triggerEnd(finalmessage: string, accuracy: number, result: string, opening: string){
    if (result === "Win" && !userProgress.beaten_openings.includes(opening)) {
      await supabase
      .from("user_progress")
      .update({ beaten_openings: [...userProgress.beaten_openings, opening] })
      .eq("user_id", user!.id);
      if (userProgress.beaten_openings.length === 0){
        setUserProgress(prev => ({
          ...prev,
          beaten_openings: [...prev.beaten_openings, opening, "Random"]
        }));
      }else{
        setUserProgress(prev => ({
          ...prev,
          beaten_openings: [...prev.beaten_openings, opening]
        }));
      }
      if (userProgress.beaten_openings.length === 0 || userProgress.beaten_openings.length === 1 || userProgress.beaten_openings.length === 3 || userProgress.beaten_openings.length === 5 || userProgress.beaten_openings.length === 6){
        levelUp();
        console.log("Level up!" + opening);
      }
    }
    setGameResult(finalmessage);
    await saveGameResult(accuracy, result, opening);
  }

  async function dailyTriggerEnd(finalmessage: string, accuracy: number, daily_score: number){
    setGameResult(finalmessage);
    //await saveDailyGameResult(accuracy, daily_score);
  }

  async function saveGameResult(accuracy: number, result: string, opening: string) {
    if (!user) return; // not logged in, skip
    const { error } = await supabase
      .from("classic_game_results")
      .insert({ user_id: user.id, accuracy, result, opening });
    if (error) console.error("Failed to save game result:", error);
  }

  /*async function saveDailyGameResult(accuracy: number, daily_score: number) {
    if (!user) return; // not logged in, skip
    const daily_id = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("daily_game_results")
      .insert({ user_id: user.id, accuracy, daily_score, daily_id });
    if (error) console.error("Failed to save daily game result:", error);
  }*/

  async function blankAnalysis(chessPos: string): Promise<void> {
    const lines = await workerB.getMultiPV(chessPos, 18, 3);
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
          if (chessPos.split(" ")[1] === "b" && line.cp !== null) {
            line.cp = -line.cp;
          }
          return `${line.cp > 0 ? "+" : ""}${(line.cp / 100).toFixed(2)} ${shortPv}`;
        }

        return null;
      })
      .filter(Boolean)
      .join("\n");

    setDisplayEval(formatted);
    const bestMove = lines[0]?.pv?.split(" ")?.[0];
    const secondMove = lines[1]?.pv?.split(" ")?.[0];
    const thirdMove = lines[2]?.pv?.split(" ")?.[0];
    setArrows(
      bestMove
        ? [
            {
              startSquare: bestMove.substring(0, 2) as Square,
              endSquare: bestMove.substring(2, 4) as Square,
              color: "rgb(0, 128, 0)",
            },
            ...(secondMove ? [{
                startSquare: secondMove.substring(0, 2) as Square,
                endSquare: secondMove.substring(2, 4) as Square,
                color: "rgb(40, 128, 40)",
              }]
            : []),
            ...(thirdMove ? [{
                startSquare: thirdMove.substring(0, 2) as Square,
                endSquare: thirdMove.substring(2, 4) as Square,
                color: "rgb(40, 148, 40)",
              }]
            : []),
        ]
      : []
    );
  }

  async function findBestMove(moveType: string, chessPos: string, beforeFen: string = ""): Promise<void> {
    const chessGame = chessGameRef.current;
    if (!chessGame) return;
    let fenAfterMove = "";
    let fenBeforeMove = "";
    if (moveType === "real"){
      fenAfterMove = chessGame.fen();
      fenBeforeMove = oldFen;
    }else{
      fenAfterMove = chessPos;
      if (screen === "daily"){
        fenBeforeMove = beforeFen;
      }else{
        fenBeforeMove = posHistory[posHistory.length - 1];
      }
    }
    if (movesplayed > -3){
      try {
        console.log("findBestMove started", { moveType, fenAfterMove, fenBeforeMove });
        const [result, result2] = await Promise.all([
          workerA.getBestLine(fenAfterMove, 18).then(r => { console.log("workerA done", r); return r; }),
          workerB.getBestLine(fenBeforeMove, 18).then(r => { console.log("workerB done", r); return r; }),
        ]);
        console.log("Promise.all resolved");
        const pv = result.pv;
        console.log("PV: " + pv);
        const bestMove = pv?.split(" ")?.[0];
        const bestResponse = pv?.split(" ")?.[1];
        const nextResponse = pv?.split(" ")?.[2];
        
        if (showBack2 === true && moveType === "analysis"){
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
          if (screen === "daily"){
            setDailySquares(prev => {
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
            setSmallSquares(prev => {
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
          }
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
            if (screen === "daily"){
              setDailySquares(prev => {
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
            }else{
              setSmallSquares(prev => {
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
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function handleBack() {
    const smallGame = smallGameRef.current;
    if (!smallGame) return;
    setisAnalysisMove("endAnalysis");
    if(posHistory.length > 1){
      smallGame.load(posHistory[posHistory.length - 2]);
      setPosHistory(prev => prev.slice(0, -1));
    }else{
      smallGame.load(oldFen);
    }
    blankAnalysis(smallGame.fen());
    setChessPosition(smallGame.fen());
  }

  async function dailyHandleBack() {
    const chessGame = chessGameRef.current;
    if (!chessGame) {
      console.log("chessGame not found");
      return;
    }
    setisAnalysisMove("endAnalysis");
    chessGame.load(posHistory[posHistory.length - 2]);
    setPosHistory(prev => prev.slice(0, -1));
    console.log("PosHistory: " + posHistory);
    //chessGame.load(oldFen);
    setDailySquares({});
    setArrows([]);
    blankAnalysis(chessGame.fen());
    setBigChessPosition(chessGame.fen());
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

  const PIECE_VALUES: Record<string, number> = {
    p: 1, n: 3, b: 3, r: 5, q: 9, k: 99
  };

  function countAttackedPieces(fen: string): number {
    const fenParts = fen.split(" ");
    const sideToMove = fenParts[1] as "w" | "b";
    const opponent = sideToMove === "w" ? "b" : "w";

    const stmFen = [...fenParts]; stmFen[1] = sideToMove;
    const oppFen = [...fenParts]; oppFen[1] = opponent;
    const stmGame = new Chess(stmFen.join(" "));
    const oppGame = new Chess(oppFen.join(" "));

    // Use moves() only for finding attackers (captures),
    // but use isAttacked() for checking if a square is defended
    function getAttackers(game: Chess, square: string): { from: string, piece: string }[] {
      return game.moves({ verbose: true })
        .filter(m => m.to === square)
        .map(m => ({ from: m.from, piece: m.piece }));
    }

    const board = stmGame.board();
    let attackedCount = 0;

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (!piece) continue;

        const square = (String.fromCharCode(97 + file) + (8 - rank)) as Square;
        const pieceValue = PIECE_VALUES[piece.type];

        // isAttacked() correctly checks all attacked squares including pawn defense
        const isDefended = piece.color === sideToMove
          ? stmGame.isAttacked(square, sideToMove)
          : oppGame.isAttacked(square, opponent);

        if (piece.color === opponent) {
          // Opponent piece: count if defended AND attacked by stm with equal/lesser value
          if (!isDefended) continue;
          const hasValidAttacker = getAttackers(stmGame, square)
            .some(a => PIECE_VALUES[a.piece] <= pieceValue);
          if (hasValidAttacker) attackedCount++;

        } else {
          // Side to move piece: count if defended AND attacker is defended
          if (!isDefended) continue;
          const attackers = getAttackers(oppGame, square)
            .filter(a => PIECE_VALUES[a.piece] <= pieceValue);
          const hasDefendedAttacker = attackers.some(a => 
            oppGame.isAttacked(a.from as Square, opponent)
          );
          if (hasDefendedAttacker) attackedCount++;
        }
      }
    }

    return attackedCount;
  }

  function countPieceSquares(fen: string): number {
    const fenParts = fen.split(" ");
    const sideToMove = fenParts[1] as "w" | "b";
    const opponent = sideToMove === "w" ? "b" : "w";
    const stmFen = [...fenParts]; stmFen[1] = sideToMove;
    const oppFen = [...fenParts]; oppFen[1] = opponent;
    const stmGame = new Chess(stmFen.join(" "));
    const oppGame = new Chess(oppFen.join(" "));

    /*function getMoves(game: Chess, square: string): { to: string }[] {
      return game.moves({ verbose: true })
        .filter(m => m.from === square)
        .map(m => ({ to: m.to}));
    }*/

    const board = stmGame.board();
    let moveCount = 0;

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (!piece) continue;
        if(piece.color !== sideToMove) continue;
        if(piece.type === "p" || piece.type === "k") continue;

        const square = (String.fromCharCode(97 + file) + (8 - rank)) as Square;
        const moves = stmGame.moves({ verbose: true }).filter(m => m.from === square);
        //const moves = getMoves(stmGame, square);
        const unguardedMoves = moves.filter(move => {
          return !oppGame.isAttacked(move.to as Square, opponent);
        }).length;
        moveCount += unguardedMoves;
      }
    }
    return moveCount;
  }

  async function chooseFiveFens(): Promise<string[]> {
    let daDailyFens = await extractFENsFromGames(pgnData,94, "None", 6);
    let chosenFens: string[] = [];
    let chosenMoves: string[] = [];
    const chosenScores: number[] = [];
    const chosenStats: {fen: string, score: number, pieces: number, cps: number, cp2Count: number, cp3Count: number, addScore: number, attacked: number}[] = [];
    for (let i = 0; i < 20; i++){
      const newFen = daDailyFens[Math.floor(Math.random() * daDailyFens.length)];
      if (!newFen){
        console.log("No fen found, skipping iteration " + i);
        continue;
      }
      let score = 0;
      const lines = await workerA.getTop6Lines(newFen, 18);
      //new pieces: amount of unguarded squares that side to move's bishops/knights/rooks/queen can move to, up to 50, .5 per square
      /*let pieces = newFen.split(" ")[0]
        .replace(/[^a-zA-Z]/g, "")
        .length;
      if (pieces > 25) pieces = 25;*/
      let pieces = countPieceSquares(newFen);
      score += pieces;
      let cpCount = 0;
      lines.forEach((line) =>{
        if (line.cp > -9000 && line.cp < 9000){
          if (line.cp - lines[0].cp > -71 && line.cp - lines[0].cp < -31){
            cpCount += 10;
          }
        }
      })
      let cp2Count = 0;
      let cp3Count = 0;
      const bestMovePv = lines[0]?.pv?.split(" ")?.[0];
          if (bestMovePv) {
            const tempGame = new Chess(newFen);
            try {
              const move = tempGame.move(bestMovePv);
              if (!move?.captured) {
                cp2Count = 10;
              }

              if (move) {
                const fenParts = newFen.split(" ");
                const sideToMove = fenParts[1] as "w" | "b";
                const opponent = sideToMove === "w" ? "b" : "w";

                const oppFenParts = [...fenParts];
                oppFenParts[1] = opponent;
                const oppGame = new Chess(oppFenParts.join(" "));

                const movedPieceValue = PIECE_VALUES[move.piece];

                // Use isAttacked() for reliable attack detection
                const isAttackedAtAll = oppGame.isAttacked(move.from as Square, opponent);

                if (isAttackedAtAll) {
                  // Find the lowest value attacker
                  const attackers = oppGame
                    .moves({ verbose: true })
                    .filter(m => m.to === move.from);

                  const isAttackedByLesser = attackers.some(
                    m => PIECE_VALUES[m.piece] < movedPieceValue
                  );

                  // Check if defended using isAttacked() from side to move's perspective
                  const stmFenParts = [...fenParts];
                  stmFenParts[1] = sideToMove;
                  const stmGame = new Chess(stmFenParts.join(" "));
                  const isDefended = stmGame.isAttacked(move.from as Square, sideToMove);

                  const isUndefendedAndAttacked = !isDefended;

                  if (isAttackedByLesser || isUndefendedAndAttacked) {
                    cp3Count = -10;
                    cp2Count = 0;
                  }
                }
              }
            } catch {
              // ignore invalid move
            }
          }


      //score += cpCount;
      let cps = cpCount + cp2Count + cp3Count;
      if (cps > 20) cps = 20;
      if (cps < 0) cps = 0;
      score = score + cps;
      let addScore = 25;
      if(lines[1] !== undefined){
        if(lines[1].cp - lines[0].cp < -81){
          addScore = addScore - Math.trunc(((lines[0].cp - lines[1].cp) - 80) / 5);
        }else if (lines[1].cp - lines[0].cp > -51){
          addScore = addScore - Math.trunc((50 - (lines[0].cp - lines[1].cp)) / 5);
        }
        if (addScore < 0) addScore = 0;
        score += addScore;
      }

      let attacked = countAttackedPieces(newFen) * 10;
      if (attacked > 30){
        attacked = 30;
      }
      score += attacked;
      if (chosenFens.length < 5) {
        if(!chosenFens.includes(newFen)){
          chosenFens.push(newFen);
          chosenScores.push(score);
          chosenMoves.push(lines[0]?.pv?.split(" ")?.[0] || "");
          chosenStats.push({fen: newFen, score, pieces, cps, cp2Count, cp3Count, addScore, attacked});
          console.log ("Chosen fen " + newFen + " with score " + score);
          const formatted = chosenFens.map((fen, index) => `Score: ${chosenScores[index]} Calculation: ${chosenStats[index].pieces}/25 Decision: ${chosenStats[index].cps}/20 ${chosenStats[index].cp2Count}${chosenStats[index].cp3Count}Clarity: ${chosenStats[index].addScore}/25 Onslaught: ${chosenStats[index].attacked}/30`)
            .join("\n");
          setPosList(formatted);
        }
      }else if (score > Math.min(...chosenScores)) {
        if(!chosenFens.includes(newFen)){
          const minIndex = chosenScores.indexOf(Math.min(...chosenScores));
          chosenFens[minIndex] = newFen;
          console.log ("Replacing " + chosenScores[minIndex] + " with score " + score);
          chosenScores[minIndex] = score;
          chosenMoves[minIndex] = lines[0]?.pv?.split(" ")?.[0] || "";
          chosenStats[minIndex] = {fen: newFen, score, pieces, cps, cp2Count, cp3Count, addScore, attacked};
          const formatted = chosenFens.map((fen, index) => `Score: ${chosenScores[index]} Calculation: ${chosenStats[index].pieces}/25 Decision: ${chosenStats[index].cps}/20 ${chosenStats[index].cp2Count}${chosenStats[index].cp3Count}Clarity: ${chosenStats[index].addScore}/25 Onslaught: ${chosenStats[index].attacked}/30`)
            .join("\n");
          setPosList(formatted);
        }else {
          console.log("duplicate fen: " + newFen + " " + chosenFens + " " + chosenFens.includes(newFen));
        }
      }else{
        //console.log (score + " was not higher than " + Math.min(...chosenScores));
      }
      console.log(score + " " + pieces + " " + cpCount + " " + addScore + " " + attacked + " " + newFen);
      console.log(i);
    }
    setDailyFens(chosenFens);
    setFenScores(chosenScores.reduce((a, b) => a + b, 0));
    setDailyBestMoves(chosenMoves);
    return chosenFens;
  }

  async function chooseFirstFen(opening: string = "None", plyLength: number = 6): Promise<string> {
    const daFens = await extractFENsFromGames(pgnData,94, opening, plyLength);

    if (daFens.length === 0) {
      console.warn("No FENs found for opening:", opening, "plyLength:", plyLength);
      // Fall back to no filter
      const fallback = await extractFENsFromGames(pgnData, 94, "None", plyLength);
      if (fallback.length === 0) throw new Error("No FENs found at all");
      daFens.push(...fallback);
    }
    setFens(daFens);

    while (true) {
      const newFen = daFens[Math.floor(Math.random() * daFens.length)];
      const evalB = await workerA.getEval(newFen, 10);
      console.log(evalB);
      if (Math.abs(evalB) < 30) {
        return newFen;
      }
    }
  }

  async function saveAndRankResult(dailyScore: number, accuracy: number) {
    if (!user) return;

    const dailyId = new Date().toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // ✅ Query BEFORE inserting so the new score isn't in the list yet
    const { data: allScores } = await supabase
      .from("daily_game_results")
      .select("daily_score")
      .eq("user_id", user.id)
      .order("daily_score", { ascending: false });

    const { data: todayScores } = await supabase
      .from("daily_game_results")
      .select("daily_score")
      .eq("user_id", user.id)
      .gte("created_at", today)
      .order("daily_score", { ascending: false });

    const { data: weekScores } = await supabase
      .from("daily_game_results")
      .select("daily_score")
      .eq("user_id", user.id)
      .gte("created_at", weekAgo)
      .order("daily_score", { ascending: false });

    // Insert after querying
    const { error } = await supabase
      .from("daily_game_results")
      .insert({ user_id: user.id, daily_score: dailyScore, daily_id: dailyId, accuracy });

    if (error) { console.error(error); return; }

    if (!allScores || !todayScores || !weekScores) return;

    // Rank = number of existing scores strictly higher than new score + 1
    const rankIn = (scores: { daily_score: number }[]) =>
      scores.filter(s => s.daily_score > dailyScore).length + 1;

    setRankInfo({
      today:   { rank: rankIn(todayScores), total: todayScores.length + 1 },
      week:    { rank: rankIn(weekScores),  total: weekScores.length + 1  },
      allTime: { rank: rankIn(allScores),   total: allScores.length + 1   },
    });
  }

  async function dailyNext(fenBeforeMove: string, playerMove: string, fiveFens: string[], fenIndex: number) {
    const chessGame = chessGameRef.current;
    if (!chessGame) {
      console.log("chessGame is not available"); 
      return;
    }
    let tryFenGame = tryFenRef.current;
    if (!tryFenGame) {
      tryFenGame = new Chess(fenBeforeMove);
    }
    /*let [ourEval, stockfishSetup] = await Promise.all([
      workerC.getEval(chessGame.fen(), 20),
      workerD.getBestLine(fenBeforeMove, 20).then(r => { console.log("chooseFen workerB done", r); return r; }),
    ]);*/
    let ourEval = await workerC.getEval(chessGame.fen(), 20);
    const stockfishSetup = dailyBestMoves[fenIndex];
    ourEval = -1 * ourEval;
    let bestEval = ourEval;

    //const pvb = stockfishSetup.pv;
    //yconsole.log("Stockfish PV: " + pvb);
    //let stockfishMove = pvb?.split(" ")?.[0];
    let stockfishMove = stockfishSetup;
    if(stockfishMove !== playerMove){
      tryFenGame.load(fenBeforeMove);
      tryFenGame.move({from: stockfishMove.substring(0, 2), to: stockfishMove.substring(2, 4), promotion: 'q'});
      bestEval = -1 * await workerD.getEval(tryFenGame.fen(), 20);
      console.log(stockfishMove + " not equals " + playerMove);
    }else{
      console.log(stockfishMove + " equals " + playerMove);
    }

    let thisaccuracy = Math.round((100 * Math.exp((ourEval - bestEval) / 200)) * 10);
    if(thisaccuracy > 1100){
      thisaccuracy = 1100;
    }
    if (thisaccuracy > 1000){
      setBColors(prev => [...prev, "rgb(0, 251, 255)"]);
    }else if (thisaccuracy === 1000){
      setBColors(prev => [...prev, "rgb(0, 255, 55)"]);
    }else if (thisaccuracy > 750){
      setBColors(prev => [...prev, "rgb(0, 137, 7)"]);
    }else if (thisaccuracy > 550){
      setBColors(prev => [...prev, "rgb(255, 213, 0)"]);
    }else if (thisaccuracy > 300){
      setBColors(prev => [...prev, "rgb(255, 114, 0)"]);
    }else{
      setBColors(prev => [...prev, "rgb(255, 0, 0)"]);
    }
    const displayAccuracy = Math.round(((accuracy * (movesplayed) + thisaccuracy) / (movesplayed + 1)));
    if (movesplayed !== 0){
      setAccuracy(displayAccuracy);
    }else{
      setAccuracy(thisaccuracy);
    }
    console.log("Accuracy " + accuracy + " this: " + thisaccuracy + " Moves: " + movesplayed);
    if (thisaccuracy > 1000){
      setShowEffex("Brilliant Move! Accuracy: " + thisaccuracy/10);
    }else{
      setShowEffex("Accuracy: " + thisaccuracy/10);
    }
    stopEffex();
    setStreakMsg("Current Accuracy: " + displayAccuracy/10);
    setFenIndex(prev => prev + 1);
    setBPosHistory(prev => [...prev, chessGame.fen()]);
    setEvalHistory(prev => [...prev, thisaccuracy]);
    if (fenIndex + 1 < fiveFens.length) {
      chessGame.load(fiveFens[fenIndex + 1]);
      setBigChessPosition(chessGame.fen());
      highlightKingSquare(chessGame, "daily");
    }else{
      const dailyScore = (displayAccuracy * fenScores / 2500);
      const displayScore = Math.round(dailyScore);
      await saveAndRankResult(dailyScore, displayAccuracy/10);
      dailyTriggerEnd("Daily Challenge Completed! Final Accuracy: " + displayAccuracy/10 + ". Final Score: " + displayScore, displayAccuracy/10, dailyScore);
    }
    return;
  }

  async function chooseFen(fenBeforeMove: string, playerMove: string) {
    const chessGame = chessGameRef.current;
    if (!chessGame) return;
    const tryFenGame = tryFenRef.current;
    if (!tryFenGame) return;
    let ourOldEval = oldEval;
    if (movesplayed === 0){
      ourOldEval = await workerC.getEval(oldFen, 18);//isnt this just the same as stockfishSetup?
      setStartingEval(ourOldEval);
      setEvalHistory(prev => [...prev, ourOldEval]);
      console.log("Starting Eval logged: " + oldFen);
    }

    let evalA = evalHistory[evalHistory.length - 1];
    let displayAccuracy = 0;
    let disbrilcounter = brilcounter;
    let disbmcounter = bmcounter;


    if (reqMove !== "none"){

      if (playerMove === reqMove){
        setDif(50);
        setShowEffex("Correct ✅ +50 eval");
        stopEffex();
        let thisaccuracy = 1000;
        setBColors(prev => [...prev, "rgb(221, 255, 0)"]);
        displayAccuracy = Math.round(((accuracy * (movesplayed) + thisaccuracy) / (movesplayed + 1)));
        if (movesplayed !== 0){
          setAccuracy(displayAccuracy);
        }else{
          setAccuracy(thisaccuracy);
        }
        evalA += 50;
        //console.log("Checkpoint 1");
      }else{
        setDif(-50);
        setShowEffex("Incorrect ❌ (" + reqMove + ") -50 eval");
        stopEffex();
        let thisaccuracy = 0;
        setBColors(prev => [...prev, "rgb(125, 0, 0)"]);
        displayAccuracy = Math.round(((accuracy * (movesplayed) + thisaccuracy) / (movesplayed + 1)));
        if (movesplayed !== 0){
          setAccuracy(displayAccuracy);
        }else{
          setAccuracy(thisaccuracy);
        }
        evalA -= 50;
      }
      setEvalHistory(prev => [...prev, evalA]);

    }else{
      const [result, stockfishSetup] = await Promise.all([
        workerC.getBestLine(chessGame.fen(), 18).then(r => { console.log("chooseFen workerA done", r); return r; }),
        workerD.getBestLine(fenBeforeMove, 18).then(r => { console.log("chooseFen workerB done", r); return r; }),
      ]);
      const mate = result.mate;
      const ourEval = -1 * await workerC.getEval(chessGame.fen(), 18);
      let bestEval = ourEval;
      let streaker = currentStreak;

      const pvb = stockfishSetup.pv;
      const stockfishMove = pvb?.split(" ")?.[0];
      if(stockfishMove !== playerMove){
        
        tryFenGame.load(fenBeforeMove);
        tryFenGame.move({from: stockfishMove.substring(0, 2), to: stockfishMove.substring(2, 4), promotion: 'q'});
        bestEval = -1 * await workerD.getEval(tryFenGame.fen(), 18);
        console.log(stockfishMove + " not equals " + playerMove);
      }else{
        console.log(stockfishMove + " equals " + playerMove);
      }
      let doublemessage = false;
      let bonus = 0;
      let disHighestStreak = highestStreak;
      disbrilcounter = brilcounter;
      disbmcounter = bmcounter;
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
      displayAccuracy = Math.round(((accuracy * (movesplayed) + thisaccuracy) / (movesplayed + 1)));
      if (movesplayed !== 0){
        setAccuracy(displayAccuracy);
      }else{
        setAccuracy(thisaccuracy);
      }
      console.log("Accuracy " + accuracy + " this: " + thisaccuracy + " Moves: " + movesplayed);

      const bonuses: Record<number, number> = { 1: 25, 2: 50, 3: 80, 4: 125, 5: 200 };
      const streakbonus = streaker >= 6 ? 300 : (bonuses[streaker] ?? 0);
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

    
      evalA = (ourOldEval - bestEval + ourEval + bonus + streakbonus + dif);
      console.log("EvalA: " + evalA + " ourOldEval: " + ourOldEval + " BestEval: " + bestEval + " OurEval: " + ourEval + " Bonus: " + bonus + " StreakBonus: " + streakbonus + " Dif: " + dif);
      setEvalHistory(prev => [...prev, evalA]);

      if (mate !== null){
        const pv = result.pv;
        for (let i = 0; i < Math.abs(mate) + 5; i++){
          if (chessGame.isGameOver() === false){
            setBigChessPosition(chessGame.fen());
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
          triggerEnd("You win! Final result: " + (mate > 0 ? "You mate in " + mate : "You mate in " + (-mate)) + " Final stats: " + "Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (highestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter) + ", Starting Eval: " + startingEval, displayAccuracy/10, "Win", gameOpening);
        }else{
          triggerEnd("Game over! Final result: " + (mate > 0 ? "You are mated in " + mate : "You are mated in " + (-mate)) + " Final stats: " + "Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (highestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter)  + ", Starting Eval: " + startingEval, displayAccuracy/10, "Loss", gameOpening);
        }
        return;
      }

    }
    //console.log("Checkpoint 2");
    if(daOpeningFens.length > 0 && Math.random() < 0.25){
      //console.log("Checkpoint 3");
      const randnumb = Math.floor(Math.random() * (daOpeningFens.length - 1))
      //console.log("Checkpoint 3a");
      const newFens = daOpeningFens[randnumb];
      //console.log("Checkpoint 3ab" + newFens);
      const evalB = await workerC.getEval(newFens, 10);
      //console.log("Checkpoint 3b" + evalB + " " + evalA);
      setBigChessPosition(newFens);
      chessGame.load(newFens);
      highlightKingSquare(chessGame, "big");
      //console.log("Checkpoint 3c");
      const newevalB = await workerD.getEval(newFens, 18);
      const difference = evalA - newevalB;
      setOldEval(newevalB);
      setDif(difference);
      console.log("Taking Opening Position. " + evalA + " " + evalB + " " + newevalB + " " + difference);
      setReqMove(daOpeningMoves[randnumb]);
      setBPosHistory(prev => [...prev, newFens]);
      return;
    }else{
      //console.log("Checkpoint 4");
      setReqMove("none");
      let attempts = 0;
      const MAX_ATTEMPTS = 400;
      while (attempts < MAX_ATTEMPTS) {
        const newFens = fens[Math.floor(Math.random() * fens.length)];
        //console.log("Checkpoint 4b " + newFens);
        const evalB = await workerC.getEval(newFens, 10);
        //console.log("Checkpoint 4c " + evalB + " " + evalA);
        //if ((evalA - evalB <= 30) && (evalA - evalB >= -30)){ 
        if (Math.abs(evalA) < 50){
          if ((evalA - evalB <= 30) && (evalA - evalB >= -30)){
            setBigChessPosition(newFens);
            chessGame.load(newFens);
            highlightKingSquare(chessGame, "big");
            const newevalB = await workerD.getEval(newFens, 18);
            const difference = evalA - newevalB;
            setOldEval(newevalB);
            setDif(difference);
            console.log("Success 1! Elo Within 30 " + evalA + " " + evalB + " " + newevalB + " " + difference);
            setBPosHistory(prev => [...prev, newFens]);
            return;
          }
        }else if (((evalA < evalB / 0.6) && (evalA > evalB * 0.6) && (evalA >= 0)) || ((evalA > evalB / 0.6) && (evalA < evalB * 0.6) && (evalA <= 0))){
          const newevalB = await workerC.getEval(newFens, 18);
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
        }else if (((Math.abs(evalA) < Math.abs(evalB) / 0.75) && (Math.abs(evalA) > Math.abs(evalB) * 0.75)) || ((Math.abs(evalA) > Math.abs(evalB) / 0.75) && (Math.abs(evalA) < Math.abs(evalB) * 0.75))){
          const result4 = await workerC.getBestLine(newFens, 18);
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
        triggerEnd("You win! Final stats: Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (highestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter)  + ", Starting Eval: " + startingEval + ", Final Eval: " + evalA, displayAccuracy/10, "Win", gameOpening);
      }else{
        triggerEnd("Game over! Final stats: Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (highestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter)  + ", Starting Eval: " + startingEval + ", Final Eval: " + evalA, displayAccuracy/10, "Loss", gameOpening);
      }
    }
  }

  function getMoveOptions(square: Square, chessInstance: Chess = chessGameRef.current as Chess) {
    const chess = chessInstance;
    if (!chess) return;
    const moves = chess.moves({
      square,
      verbose: true
    });
    if (moves.length === 0) {
      if (screen === "daily") {
        setDailySquares({});
      } else {
        setOptionSquares({});
      }
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
    if (screen === "daily"){
      setDailySquares(newSquares);
    }else{
      setOptionSquares(newSquares);
    }
    return true;
  }

  async function onSquareClick({
    square,
    piece
  }: SquareHandlerArgs){
    const chessGame = chessGameRef.current;
    if (!chessGame) return;
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
      if (reqMove === "add"){
        chessGame.move({
          from: moveFrom,
          to: square,
          promotion: 'q'
        });
        const ourNewFen = chessGame.fen();
        const newMove = moveFrom + square;
        daOpeningFensRef.current = [...daOpeningFensRef.current, ourNewFen];
        setDaOpeningFens(daOpeningFensRef.current);
        setDaOpeningMoves(prev => [...prev, newMove]);
        setShowEffex("Position added to opening pool (" + daOpeningFensRef.current.length + ")");
        stopEffex();
        setBigChessPosition(ourNewFen);
        await addMoveToLine(moveFrom + square, "line_1");
        const infos = await getMoveInfos(ourNewFen);
        setMoveInfos(infos);
        //console.log("\Added fen: " + chessGame.fen() + " Move: " + moveFrom + square);
      }else if (reqMove !== "none" && daOpeningFens.length === 0){
        const sendthatfen = chessGame.fen();
        chessGame.move({
          from: moveFrom,
          to: square,
          promotion: 'q'
        });
        if(moveFrom + square === reqMove){
          chessGameRef.current = chessGame;
          console.log("Requested move played");
          setBigChessPosition(chessGame.fen());
        }else{
          setShowEffex("Incorrect ❌ (" + reqMove + ")");
          stopEffex();
          console.log("Requested move not played: " + moveFrom + square + " reqMove: " + reqMove + "chesspos: " + bigChessPosition);
          setBigChessPosition(sendthatfen);
          chessGame.undo();
        }

      }else{
        const sendthatfen = chessGame.fen();
        setOldFen(chessGame.fen());
        chessGame.move({
          from: moveFrom,
          to: square,
          promotion: 'q'
        });
        setOldMove(moveFrom + square);
        setisAnalysisMove("real");
        if (screen !== "daily"){
          setChessPosition(chessGame.fen());
          setPosHistory([chessPosition]);
        }else{
          setPosHistory(prev => [...prev, chessGame.fen()]);
          setDailySquares({});
        }
        console.log("PosHistory: " + posHistory);
        if(screen === "daily"){
          setMovesPlayed(prev => {
            const next = prev + 1;
            return next;
          });
          setGameStatus("Moves played: " + (movesplayed + 1)); 
          setBigChessPosition(chessGame.fen()); 
          if (movesplayed < 5){
            dailyNext(sendthatfen, moveFrom + square, fiveFens, fenIndex);
            
          }else{
            findBestMove("analysis", chessGame.fen(), sendthatfen);
          }
        }else{
          chooseFen(sendthatfen, moveFrom + square);
        }
      }
    }catch {
      const hasMoveOptions = getMoveOptions(square as Square);
      if (hasMoveOptions){
        setMoveFrom(square);
      }

      return;
    }

    if(reqMove === "none"){
      setSmallSquares(prev => {
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
    }

    setMoveFrom('');
    setOptionSquares({});
    setDailySquares({});
  }

  function onPieceDrop({
      sourceSquare,
      targetSquare
    }: PieceDropHandlerArgs) {
      const chessGame = chessGameRef.current;
      if (!chessGame) return false;
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
        setisAnalysisMove("real");
        setChessPosition(chessGame.fen());

        setSmallSquares(prev => {
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
    const smallGame = smallGameRef.current;
    if (!smallGame) return;
    if (!moveFrom && piece){
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
      setisAnalysisMove("analysis");
      setChessPosition(smallGame.fen());
    }catch (e) {
      console.log(e);
      const hasMoveOptions = getMoveOptions(square as Square, smallGame);
      if (hasMoveOptions){
        setMoveFrom(square);
      }
      return;
    }
    setSmallSquares(prev => {
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
    squareStyles: smallSquares,
    id: 'board1',
  };

  const bigBoardOptions = {
    onPieceDrop,
    onSquareClick,
    position: bigChessPosition,
    squareStyles: optionSquares,
    id: 'board2',
  };

  const dailyBoardOptions = {
    arrows,
    onPieceDrop,
    onSquareClick,
    position: bigChessPosition,
    squareStyles: dailySquares,
    id: 'board3',
  };

  if (screen === "title") {
    return (
      <div className="title-screen">
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
        <h1>Boggart Chess v0.0.0</h1>
        <button onClick={() => {
          setScreen("versus");
        }}>Versus</button>
        <div style={{ position: "relative", display: "inline-block" }}>
          <button onClick={() => setShowOpeningSelect(prev => !prev)}>
            Classic Mode ▾
          </button>

          {showOpeningSelect && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 8,
              zIndex: 100,
              minWidth: 200,
              padding: "8px 0"
            }}>
              {openings
              .filter(opening => userProgress.unlocked_openings.includes(opening))
              .map(opening => {
                const isBeaten = userProgress.beaten_openings.includes(opening);
                //const isUnlocked = userProgress.unlocked_openings.includes(opening);
                return (
                  <div
                    key={opening}
                    onClick={async () => {
                      setScreen("classic");
                      setShowOpeningSelect(false);
                      if(opening === "Random"){
                        opening = openings[Math.floor(Math.random() * (openings.length - 3)) + 2];
                      };
                      let openingMoves: string[];
                      let plyLength = openingPlyLengths[opening];
                      if (opening === "Caro-Kann") {
                        openingMoves = caroKannProgress.line_1.split(" ");
                        plyLength = openingMoves.length;
                      } else {
                        openingMoves = openingMoveMap[opening].split(" ");
                      }
                      const newGame = new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
                      const openingFens = [newGame.fen()];
                      if(opening !== "None"){
                        setBigChessPosition(newGame.fen());
                        for (let i = 0; i < plyLength; i++){
                          await new Promise(resolve => setTimeout(resolve, 1500));
                          const move = openingMoves[i];
                          if (!move) break;
                          newGame.move(move);
                          setBigChessPosition(newGame.fen());
                          openingFens.push(newGame.fen());
                        }
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        newGame.load(openingFens[0]);
                        setBigChessPosition(openingFens[0]);
                        async function playerRunThru(openingFens: string[]){
                          for (let i = 0; i < openingFens.length - 1; i++){
                            newGame.load(openingFens[i]);
                            chessGameRef.current = newGame;
                            setReqMove(openingMoves[i]);
                            while(chessGameRef.current.fen() !== openingFens[i + 1]){
                              //console.log("No. Big Chess Position: " + bigChessPosition + " Opening Fen: " + openingFens[i + 1]);
                              await new Promise(resolve => setTimeout(resolve, 50));
                            }
                            //console.log("Yes. Big Chess Position: " + bigChessPosition + " Opening Fen: " + openingFens[i + 1]);
                          }
                          setShowEffex("Correct ✅");
                          stopEffex();
                        }
                        async function waitAddMoves(minMoves: number) {
                          while (daOpeningFensRef.current.length - 1 < minMoves) {
                            await new Promise(resolve => setTimeout(resolve, 50));
                          }
                        }
                        await playerRunThru(openingFens);
                        setDaOpeningFens(openingFens);
                        setDaOpeningMoves(openingMoves);

                        if (openingFens.length - 1 < userProgress.userMinPly){
                          setReqMove("add");
                          const infos = await getMoveInfos(openingFens[openingFens.length - 1]);
                          setMoveInfos(infos);
                          await waitAddMoves(userProgress.userMinPly);
                          setMoveInfos([]);
                        }
                        setReqMove("none");
                      };
                      if (opening !== "None"){
                        await new Promise(resolve => setTimeout(resolve, 2000));
                      }
                      setGameOpening(opening);
                      const startFen = await chooseFirstFen(opening, plyLength);
                      console.log("startfen" + startFen);
                      newGame.load(startFen);
                      chessGameRef.current = newGame;
                      smallGameRef.current = new Chess(startFen);
                      tryFenRef.current = new Chess(startFen);
                      setChessPosition(newGame.fen());
                      setBigChessPosition(newGame.fen());
                      setOldFen(newGame.fen());
                      highlightKingSquare(newGame, "big");
                      setBPosHistory([newGame.fen()]);
                  }}
                  style={{
                    padding: "10px 16px",
                    //cursor: isUnlocked ? "pointer" : "not-allowed",
                    cursor: "pointer",
                    color: isBeaten ? "rgb(0, 200, 0)" : "#e6edf3",
                    //color: isUnlocked ? "#e6edf3" : "#8b949e",
                    fontSize: "0.9rem",
                    //opacity: isUnlocked ? 1 : 0.4,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#21262d";
                  }}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {opening} {isBeaten}
                </div>
              );
              })}
            </div>
          )}
        </div>
        <button onClick={async () => {
          setScreen("daily");
          setMovesPlayed(0);
          setGameStatus("Moves played: 0");
          setShowPosList(true);
          let fens = await chooseFiveFens();
          setFiveFens(fens);
          setFenIndex(0);
          console.log("Chosen Fens: " + fens);
          //for (let i = 0; i < fens.length; i++){
            chessGameRef.current = new Chess(fens[0]);
            setBigChessPosition(fens[0]);
            const chessGame = chessGameRef.current;
            highlightKingSquare(chessGame, "daily");
          //}
        }}>Daily</button>
        <button onClick={() => setScreen("settings")}>Settings</button>
        <button onClick={() => setScreen("analytics")}>Analytics</button>
      </div>
    );
  }

  if (screen === "settings") {
    return (
      <div>
        <button onClick={() => setScreen("title")}>← Back</button>
        <h2>Settings</h2>
        {/* your settings UI */}
      </div>
    );
  }

  if (screen === "analytics") {
    return (
      <div>
        <button onClick={() => setScreen("title")}>← Back</button>
        <h2>Analytics</h2>
        {gameHistory.map((game) => (
          <li key={game.id}>{new Date(game.created_at).toLocaleDateString()} ({game.result}) — {game.accuracy.toFixed(1)}%, {game.opening}</li>
        ))}
      </div>
    );
  }

  if (screen === "versus") {
    return (
      <div>
        <button onClick={() => setScreen("title")}>← Back</button>
        {/* mode 2 UI */}
      </div>
    );
  }

  if (screen === "daily") {
    return (
      <div>
        <button onClick={async () => {
          setScreen("title");
          }}>← Back</button>
        {/* mode 3 UI */}
        <div className="statusText">{gameStatus}</div>
        <div className="statusText">{streakMsg}</div>
        <div className="game-container">
          <div className="board-layer">
            <div className="dailyboards">
              <div id ="board3">
              <Chessboard
                options={dailyBoardOptions}
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
          <div
            className={`overlay ${gameResult ? "overlay-front" : "overlay-back"}`}
          >
          <div className="result-box">
            <h2>{gameResult}</h2>
            <EvalGraph evals={evalHistory} bPosHistory={bPosHistory} bColors={bColors} onJumpToMove={dailyHandleJumpToMove}/>
            {rankInfo && (
              <div className="rank-info">
                <h3>Your Rankings</h3>
                <p>Today:    #{rankInfo.today.rank}</p>
                <p>This week: #{rankInfo.week.rank}</p>
                <p>All-time:  #{rankInfo.allTime.rank}</p>
              </div>
            )}
            <h3>Past Scores</h3>
            <ul>
              {dailyGameHistory.map((game) => (
                <li key={game.id}>
                  {new Date(game.created_at).toLocaleDateString()} 
                  {game.accuracy != null ? ` — Accuracy: ${game.accuracy.toFixed(1)}%` : ""}
                  {game.daily_score != null ? ` — Score: ${game.daily_score.toFixed(1)}` : ""}
                </li>
              ))}
            </ul>
          </div>
            {/* result UI */}
          </div>
        </div>
        <button className={`back-button ${showBack2 ? "show" : "hide"}`} onClick={dailyHandleBack}>Back</button>
        <button className={`back2-button ${showBack2 ? "show" : "hide"}`} onClick={() => {setShowBack2(false); setGameResult(storeGameResult);}}>Back to Graph</button>
        <div className={`evals-graph ${showBack2 ? "show" : "hide"}`}>{DisplayEval}</div>
        <div className={`pos-list ${showPosList ? "show" : "hide"}`}>{PosList}</div>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setScreen("title")}>← Menu</button>
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
                {new Date(game.created_at).toLocaleDateString()} ({game.result}) — {game.accuracy.toFixed(1)}%, {game.opening}
              </li>
            ))}
          </ul>
        </div>
          {/* result UI */}
        </div>
      {moveInfos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10, padding: "1rem 0", }}>
          {moveInfos.map(m => (
            <div
              key={m.san}
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-lg)",
                padding: 12,
                cursor: "pointer",
                fontSize: 13,
              }}
              onClick={async () => {
                chessGameRef.current?.move({ from: m.from, to: m.to, promotion: "q" });
                setBigChessPosition(chessGameRef.current?.fen() ?? "");
                const ourNewFen = chessGameRef.current?.fen() ?? "";
                const newMove = m.from + m.to;
                daOpeningFensRef.current = [...daOpeningFensRef.current, ourNewFen];
                setDaOpeningFens(daOpeningFensRef.current);
                setDaOpeningMoves(prev => [...prev, newMove]);
                setShowEffex("Position added to opening pool (" + daOpeningFensRef.current.length + ")");
                stopEffex();
                setBigChessPosition(ourNewFen);
                await addMoveToLine(m.from + m.to, "line_1");
                const infos = await getMoveInfos(ourNewFen);
                setMoveInfos(infos);
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 6 }}>
                {m.san}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)" }}>
                <span>Eval</span>
                <span style={{ fontWeight: 500, color: m.eval > 0 ? "#3B6D11" : "#A32D2D" }}>
                  {m.eval > 0 ? "+" : ""}{m.eval.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}  
      </div>
      <button className="back-button" onClick={handleBack}>Back</button>
      <button className={`back2-button ${showBack2 ? "show" : "hide"}`} onClick={() => {setShowBack2(false); setGameResult(storeGameResult);}}>Back to Graph</button>
      <div className={`evals-graph ${showBack2 ? "show" : "hide"}`}>{DisplayEval}</div>
      </>
  ); 
}
export default App;
