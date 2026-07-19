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
//import { C } from 'vitest/dist/chunks/reporters.d.BFLkQcL6.js';

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
  small_level: number;
  openings_level_1: string[];
  openings_level_2: string[];
  openings_level_3: string[];
  openings_level_4: string[];
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
  2: ["Random", "French", "Italian", "Queen's Pawn Game"],
  3: ["Caro-Kann", "Queen's Indian Defense", "King's Indian Defense"],
  4: ["Reti", "London System", "Queen's Gambit Declined"],
  5: ["Benoni", "English", "Gruenfeld"],
  6: ["Ruy Lopez", "Catalan", "Sicilian", "Petrov's"],
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

const DEFAULT_OPENING_LINES: { opening: string; line_key: string; moves: string }[] = [
  // Caro-Kann
  { opening: "Caro-Kann", line_key: "base_line", moves: "1. e4 c6" },
  { opening: "Caro-Kann", line_key: "main_line", moves: "1. e4 c6 2. d4 d5" },
  // English
  { opening: "English", line_key: "base_line", moves: "1. c4" },
  //{ opening: "English", line_key: "main_line", moves: "1. c4" },
  { opening: "English", line_key: "agincourt", moves: "1. c4 e6 2. Nf3 d5 3. g3" },
  { opening: "English", line_key: "neo_catalan", moves: "1. c4 e6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Be7 5. O-O" },
  // French
  { opening: "French", line_key: "base_line", moves: "1. e4 e6 2. d4 d5" },
  //{ opening: "French", line_key: "main_line", moves: "1. e4 e6 2. d4 d5" },
  // Sicilian
  { opening: "Sicilian", line_key: "base_line", moves: "1. e4 c5" },
  //{ opening: "Sicilian", line_key: "main_line", moves: "1. e4 c5" },
  { opening: "Sicilian", line_key: "Dragon", moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6" },
  { opening: "Sicilian", line_key: "sveshnikov", moves: "1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5" },
  { opening: "Sicilian", line_key: "scheveningen", moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6" },
  { opening: "Sicilian", line_key: "alapin", moves: "1. e4 c5 2. c3" },
  { opening: "Sicilian", line_key: "closed", moves: "1. e4 c5 2. Nc3" },
  { opening: "Sicilian", line_key: "Najdorf", moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6" },
  { opening: "Sicilian", line_key: "Najdorf_English_Attack", moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3" },
  { opening: "Sicilian", line_key: "Najdorf_Main_Line", moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6" },
  { opening: "Sicilian", line_key: "Najdorf_Classical", moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2" },
  { opening: "Sicilian", line_key: "Dragon_Yugoslav_Attack", moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3" },
  { opening: "Sicilian", line_key: "Dragon_Classical", moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be2" },
  { opening: "Sicilian", line_key: "Dragon_Fianchetto", moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. g3" },
  { opening: "Sicilian", line_key: "Dragon_Levenfish", moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. f4" },
  { opening: "Sicilian", line_key: "Sveshnikov_Main_Line", moves: "1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 b5" },
  { opening: "Sicilian", line_key: "Scheveningen_Keres_Attack", moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. g4" },
  { opening: "Sicilian", line_key: "Scheveningen_English_Attack", moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. Be3" },
  { opening: "Sicilian", line_key: "Accelerated_Dragon", moves: "1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6" },
  { opening: "Sicilian", line_key: "Alapin_Barmen_Defense", moves: "1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4" },
  { opening: "Sicilian", line_key: "Alapin_Main_Line", moves: "1. e4 c5 2. c3 Nf6" },
  { opening: "Sicilian", line_key: "Alapin_Nc6", moves: "1. e4 c5 2. c3 Nc6 3. d4 cxd4 4. cxd4 d5" },
  { opening: "Sicilian", line_key: "Rossolimo_Attack", moves: "1. e4 c5 2. Nf3 Nc6 3. Bb5" },
  { opening: "Sicilian", line_key: "Rossolimo_Attack_g6", moves: "1. e4 c5 2. Nf3 Nc6 3. Bb5 g6" },
  { opening: "Sicilian", line_key: "Rossolimo_Attack_e6", moves: "1. e4 c5 2. Nf3 Nc6 3. Bb5 e6" },
  { opening: "Sicilian", line_key: "Rossolimo_Attack_d6", moves: "1. e4 c5 2. Nf3 Nc6 3. Bb5 d6" },
  { opening: "Sicilian", line_key: "Rossolimo_Attack_Nf6", moves: "1. e4 c5 2. Nf3 Nc6 3. Bb5 Nf6" },
  { opening: "Sicilian", line_key: "Closed_e6", moves: "1. e4 c5 2. Nc3 e6" },
  { opening: "Sicilian", line_key: "Closed_a6", moves: "1. e4 c5 2. Nc3 a6" },
  { opening: "Sicilian", line_key: "Grand_Prix", moves: "1. e4 c5 2. Nc3 Nc6 3. f4" },
  { opening: "Sicilian", line_key: "Grand_Prix_Accelerated", moves: "1. e4 c5 2. f4 d5" },
  // Ruy Lopez
  { opening: "Ruy Lopez", line_key: "base_line", moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5" },
  //{ opening: "Ruy Lopez", line_key: "main_line", moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5" },
  { opening: "Ruy Lopez", line_key: "closed", moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7" },
  { opening: "Ruy Lopez", line_key: "berlin", moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6" },
  { opening: "Ruy Lopez", line_key: "exchange", moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6" },
  { opening: "Ruy Lopez", line_key: "open", moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4" },
  { opening: "Ruy Lopez", line_key: "marshall", moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5" },
  // King's Indian
  { opening: "King's Indian Defense", line_key: "base_line", moves: "1. d4 Nf6 2. c4 g6" },
  //{ opening: "King's Indian", line_key: "main_line", moves: "1. d4 Nf6 2. c4 g6" },
  // Queen's Pawn Game
  { opening: "Queen's Pawn Game", line_key: "base_line", moves: "1. d4 d5" },
  //{ opening: "Queen's Pawn Game", line_key: "main_line", moves: "1. d4 d5" },
  // Queen's Bishop Game
  { opening: "London System", line_key: "base_line", moves: "1. d4 d5 2. Nf3 Nf6 3. Bf4 c5 4. e3" },
  //{ opening: "Queen's Bishop Game", line_key: "main_line", moves: "1. d4 d5 2. Nf3 Nf6 3. Bf4 c5 4. e3" },
  // Queen's Indian
  { opening: "Queen's Indian Defense", line_key: "base_line", moves: "1. d4 Nf6 2. c4 e6 3. Nf3 b6" },
  //{ opening: "Queen's Indian", line_key: "main_line", moves: "1. d4 Nf6 2. c4 e6 3. Nf3 b6" },
  // Queen's Gambit Declined
  { opening: "Queen's Gambit Declined", line_key: "base_line", moves: "1. d4 d5 2. c4 e6" },
  //{ opening: "Queen's Gambit Declined", line_key: "main_line", moves: "1. d4 d5 2. c4 e6" },
  { opening: "Queen's Gambit Declined", line_key: "charousek", moves: "1. d4 d5 2. c4 e6 3. Nc3 Be7" },
  { opening: "Queen's Gambit Declined", line_key: "three_knights", moves: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3" },
  { opening: "Queen's Gambit Declined", line_key: "ragozin_defense", moves: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Bb4" },
  { opening: "Queen's Gambit Declined", line_key: "barmen", moves: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Nbd7" },
  { opening: "Queen's Gambit Declined", line_key: "modern", moves: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5" },
  { opening: "Queen's Gambit Declined", line_key: "semi_tarrasch", moves: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 c5" },
  { opening: "Queen's Gambit Declined", line_key: "semi_slav", moves: "1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. e3 c6 5. Nbd2" },
  { opening: "Queen's Gambit Declined", line_key: "harrwitz_attack", moves: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bf4" },
  // Grünfeld
  { opening: "Gruenfeld", line_key: "base_line", moves: "1. d4 Nf6 2. c4 g6 3. Nc3 d5" },
  { opening: "Gruenfeld", line_key: "exchange", moves: "1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7" },
  { opening: "Gruenfeld", line_key: "russian", moves: "1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3" },
  { opening: "Gruenfeld", line_key: "petrosian", moves: "1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Bg5" },
  { opening: "Gruenfeld", line_key: "5_cxd5", moves: "1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. cxd5" },
  //{ opening: "Grünfeld", line_key: "main_line", moves: "1. d4 Nf6 2. c4 g6 3. Nc3 d5" },
  // Réti
  { opening: "Reti", line_key: "base_line", moves: "1. Nf3" },
  //{ opening: "Réti", line_key: "main_line", moves: "1. Nf3" },
  // Petrov's
  { opening: "Petrov's", line_key: "base_line", moves: "1. e4 e5 2. Nf3 Nf6" },
  //{ opening: "Petrov's", line_key: "main_line", moves: "1. e4 e5 2. Nf3 Nf6" },
  { opening: "Petrov's", line_key: "modern", moves: "1. e4 e5 2. Nf3 Nf6 3. d4 exd4 4. e5 Ne4" },
  { opening: "Petrov's", line_key: "paulsen_attack", moves: "1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nc4" },
  { opening: "Petrov's", line_key: "classical_karklins_martinovsky", moves: "1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nd3" },
  { opening: "Petrov's", line_key: "kaufmann_attack", moves: "1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. c4" },
  // Benoni
  { opening: "Benoni", line_key: "base_line", moves: "1. d4 Nf6 2. c4 c5" },
  { opening: "Benoni", line_key: "main_line", moves: "1. d4 Nf6 2. c4 c5 3. d5" },
  { opening: "Benoni", line_key: "3_g6", moves: "1. d4 Nf6 2. c4 c5 3. d5 g6 4. Nc3" },
  { opening: "Benoni", line_key: "benko_gambit", moves: "1. d4 Nf6 2. c4 c5 3. d5 b5" },
  { opening: "Benoni", line_key: "czech", moves: "1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3" },
  // Catalan
  { opening: "Catalan", line_key: "base_line", moves: "1. d4 Nf6 2. c4 e6 3. g3" },
  { opening: "Catalan", line_key: "main_line", moves: "1. d4 Nf6 2. c4 e6 3. g3 d5 4. cxd5 exd5 5. Nf3" },
  { opening: "Catalan", line_key: "closed_main_line", moves: "1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O dxc4" },
  // Italian
  { opening: "Italian", line_key: "base_line", moves: "1. e4 e5 2. Nf3 Nc6 3. Bc4" },
  //{ opening: "Italian", line_key: "main_line", moves: "1. e4 e5 2. Nf3 Nc6 3. Bc4" },
];

function App() {
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [practiceLines, setPracticeLines] = useState<string[]>([]);
  const [showLineSelect, setShowLineSelect] = useState(false);
  const [pendingOpening, setPendingOpening] = useState<string>("");
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
  const [DisplayEval, setDisplayEval] = useState("");
  const [DisplayAlerts, setDisplayAlerts] = useState("");
  const [PosList, setPosList] = useState("");
  const chessGameRef = useRef<Chess | null>(null);
  const [fenScores, setFenScores] = useState(0);
  const [bPosHistory, setBPosHistory] = useState<string[]>([]);
  const [bColors, setBColors] = useState<string[]>([]);
  const smallGameRef = useRef<Chess | null>(null);
  const [startingEval, setStartingEval] = useState(0);
  const [dif, setDif] = useState(0);
  const [chessPosition, setChessPosition] = useState("");
  const [bigChessPosition, setBigChessPosition] = useState("");
  const [moveFrom, setMoveFrom] = useState('');
  const [oldMove, setOldMove] = useState('');
  const [oldFen, setOldFen] = useState("");
  const tryFenRef = useRef<Chess | null>(null);
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
  const [resolvedFens, setResolvedFens] = useState<string[]>([]);
  const [showOpeningSelect, setShowOpeningSelect] = useState(false);
  const [gameOpening, setGameOpening] = useState("None");
  const [reqMove, setReqMove] = useState<string>("none");
  const [isChallenge, setIsChallenge] = useState<string>("");
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 1, 
    small_level: 1,
    openings_level_1: ["None"],
    openings_level_2: [],
    openings_level_3: [],
    openings_level_4: [],
  });
  const openings = ["None", "Random", "Italian", "French", "Queen's Pawn Game", "Caro-Kann", "Queen's Indian Defense", "King's Indian Defense", "Reti", "London System", "Queen's Gambit Declined", "Gruenfeld", "Benoni", "English", "Petrov's", "Ruy Lopez", "Catalan", "Sicilian"];
  const [practiceEnded, setPracticeEnded] = useState(false);
  
  const baseLineLengths: Record<string, number> = {"Sicilian": 2, "French": 4, "Caro-Kann": 2, "English": 1, "Ruy Lopez": 5, "King's Indian": 4, "Queen's Pawn Game": 2, "London System": 7, "Queen's Indian": 6, "Queen's Gambit Declined": 4, "Reti": 1, "Petrov's": 4, "Benoni": 4, "Gruenfeld": 6, "Catalan": 5, "Italian": 5 };

 // const pinkMode = false;
   /*[!cSquare]:{
          backgroundColor: 'rgba(255, 0, 204, 0.75)'
        }*/

  type OpeningLine = {
    line_key: string;
    moves: string;
    source_line_key?: string | null;
  };

  const [openingLines, setOpeningLines] = useState<Record<string, OpeningLine[]>>({});

  async function fetchAllOpeningLines() {
    if (!user) return;
    const { data, error } = await supabase
      .from("opening_lines")
      .select("opening, line_key, moves")
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to fetch opening lines:", error);
      return;
    }

    if (!data || data.length === 0) {
      // New user — insert all defaults
      const { error: insertError } = await supabase
        .from("opening_lines")
        .insert(DEFAULT_OPENING_LINES.map(l => ({ ...l, user_id: user!.id })));

      if (insertError) {
        console.error("Failed to initialize opening lines:", insertError);
        return;
      }

      // Set local state from defaults
      const grouped: Record<string, OpeningLine[]> = {};
      for (const l of DEFAULT_OPENING_LINES) {
        if (!grouped[l.opening]) grouped[l.opening] = [];
        grouped[l.opening].push({ line_key: l.line_key, moves: l.moves });
      }
      setOpeningLines(grouped);
      return;
    }

    // Existing user — group and set state as before
    const grouped: Record<string, OpeningLine[]> = {};
    for (const row of data) {
      if (!grouped[row.opening]) grouped[row.opening] = [];
      grouped[row.opening].push({ line_key: row.line_key, moves: row.moves });
    }
    setOpeningLines(grouped);
  }

  useEffect(() => {
    if (!user) return;
    fetchAllOpeningLines();
  }, [user]);



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
        .select("level, small_level, openings_level_1, openings_level_2, openings_level_3, openings_level_4")
        .eq("user_id", user!.id)
        .single();

      if (error || !data) {
        // First time user — create their row
        await supabase.from("user_progress").insert({
          user_id: user!.id,
          level: 1,
          small_level: 1,
          openings_level_1: ["None"],
          openings_level_2: [],
          openings_level_3: [],
          openings_level_4: [],
        });
      } else {
        setUserProgress(data);
      }
    }

    fetchGameHistory();
    fetchDailyGameHistory();
    fetchProgress();
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

  async function levelUp() {
    if (!user) return;
    const newLevel = userProgress.level + 1;
    const newUnlocks = levelUnlocks[newLevel] ?? []; // openings unlocked at this level
    const updated = [...userProgress.openings_level_1, ...newUnlocks];

    const { error } = await supabase
      .from("user_progress")
      .update({ level: newLevel, openings_level_1: updated})
      .eq("user_id", user.id);

    if (!error) {
      setUserProgress({ level: newLevel, small_level: userProgress.small_level, openings_level_1: updated, openings_level_2: userProgress.openings_level_2, openings_level_3: userProgress.openings_level_3, openings_level_4: userProgress.openings_level_4});
      if (newUnlocks.length > 0) {
        //setGameResult(prev => `${prev}\nLevel ${newLevel}! Unlocked: ${newUnlocks.join(", ")}`);
        setGameResult(prev => 
          `${prev}\n Level <span style="color: #3cff00;">${newLevel}</span>! Unlocked: ${newUnlocks.join(", ")}`
        );
      } else {}
    }
  }

  /*async function addMoveToLine(opening: string, lineKey: string, move: string) {
    if (!user) return;
    const line = openingLines[opening]?.find(l => l.line_key === lineKey);
    if (!line) return;
    const updatedMoves = line.moves + " " + move;
    const { error } = await supabase
      .from("opening_lines")
      .update({ moves: updatedMoves })
      .eq("user_id", user.id)
      .eq("opening", opening)
      .eq("line_key", lineKey);

    if (error) {
      console.error("Failed to update line:", error);
      return;
    }
    setOpeningLines(prev => ({
      ...prev,
      [opening]: prev[opening].map(l => l.line_key === lineKey ? { ...l, moves: updatedMoves } : l),
    }));
  }*/

  async function getMoveInfos(fen: string, opening: string): Promise<MoveInfo[]> {
    const game = new Chess(fen);
    const lines = await workerA.getTop6Lines(fen, 16);

    return lines.map(line => {
      const moveSan = line.pv.split(" ")[0];
      const move = game.move(moveSan);
      let isMain = false;
      const lines = openingLines[opening] ?? [];
      const mainLine = lines.find(l => l.line_key === "main_line")?.moves ?? null;
      if (mainLine && mainLine.includes(moveSan)) {
        isMain = true;
      }
      game.undo();
      return {
        san: move.san,
        from: move.from,
        to: move.to,
        piece: move.piece,
        eval: line.cp / 100,
        main: isMain,//true if in main line on table
      };
    });
  }

  function getPlyLength(line: string): number {
    return line
      .replace(/\d+\.\s*/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  function getOpeningLines(opening: string): { key: string; label: string; line: string; plyLength: number }[] {
    const lines = openingLines[opening] ?? [];
    return lines.map(l => ({
      key: l.line_key,
      label: l.line_key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      line: l.moves,
      plyLength: getPlyLength(l.moves),
    }));
  }

  async function updateChallengeLine(opening: string, sourceLineKey: string, newMoveSan: string){
    if (!user) {
      console.log("error: user not logged in");
      return;
    }
    const sourceLine = openingLines[opening]?.find(l => l.line_key === sourceLineKey);
    if (!sourceLine) {
      console.log("error: source line not found");
      return;
    }
    let newMoves = "";
    if(sourceLine.moves.split(" ").length % 3 === 0){
      newMoves = sourceLine.moves + " " + (sourceLine.moves.split(" ").length / 3 + 1) + ". " + newMoveSan;
    }else{
      newMoves = sourceLine.moves + " " + newMoveSan;
    }
    let newLineKey = `${sourceLineKey}_${newMoveSan}`;
    //check if newLineKey already exists in openingLines[opening]
    if (openingLines[opening]?.some(l => l.line_key === newLineKey)) {
      console.log("changing sourceLineKey: " + newLineKey)
      let linekeyparts = newLineKey.split("_");
      linekeyparts[0].replace("e", "e1");
      newLineKey = linekeyparts.join("_");
      console.log("changed line key: " + newLineKey);
    }
    const { error } = await supabase
    .from("opening_lines")
    .update({
      line_key: newLineKey,
      moves: newMoves,
    })
    .eq("user_id", user.id)
    .eq("opening", opening)
    .eq("line_key", sourceLineKey); 

    if (error) {
      console.error("Failed to edit line:", error);
      return;
    }
    setOpeningLines(prev => ({
      ...prev,
      [opening]: prev[opening].map(l =>
        l.line_key === sourceLineKey
          ? { ...l, line_key: newLineKey, moves: newMoves }
          : l
      ),
    }));
  }

  async function createNewLineFromChallenge(opening: string, sourceLineKey: string, newzMove: string, fen: string): Promise<string> {
    if (!user) {
      console.error("User not logged in");
      return "";
    }
    const sourceLine = openingLines[opening]?.find(l => l.line_key === sourceLineKey);
    if (!sourceLine) {
      console.error("Source line not found");
      return "";
    }
    const newMove = uciToSan(newzMove, fen);
    let newMoves = "";
    if(sourceLine.moves.split(" ").length % 3 === 0){
      newMoves = sourceLine.moves + " " + (sourceLine.moves.split(" ").length / 3 + 1) + ". " + newMove;
    }else{
      newMoves = sourceLine.moves + " " + newMove;
    }
    let newLineKey = "";
    if(sourceLineKey.startsWith("challenge")){
      newLineKey = `${sourceLineKey}_${newMove}`;
    }else{
      newLineKey = `challenge_${sourceLineKey}_${newMove}`;
    }

    const { error } = await supabase.from("opening_lines").insert({
      user_id: user.id,
      opening,
      line_key: newLineKey,
      moves: newMoves,
      source_line_key: sourceLineKey,
    });

    if (error) {
      console.error("Failed to save new line:", error);
      return "";
    }

    setOpeningLines(prev => ({
      ...prev,
      [opening]: [...(prev[opening] ?? []), { line_key: newLineKey, moves: newMoves, source_line_key: sourceLineKey }],
    }));
    return newLineKey;
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
    if (result === "Win" && !userProgress.openings_level_4?.includes(opening)) {
      if (userProgress.openings_level_1?.includes(opening)){
        const updatedOpenings = (userProgress.openings_level_1 ?? []).filter(o => o !== opening);
        await supabase
          .from("user_progress")
          .update({ openings_level_1: updatedOpenings })
          .eq("user_id", user!.id);
        await supabase
          .from("user_progress")
          .update({ openings_level_2: [...userProgress.openings_level_2, opening] })
          .eq("user_id", user!.id);
        if (userProgress.openings_level_2.length === 0){
          setUserProgress(prev => ({
            ...prev,
            openings_level_1: updatedOpenings,
            openings_level_2: [...prev.openings_level_2, opening, "Random"],
          }));
          await supabase
            .from("user_progress")
            .update({ small_level: userProgress.small_level + 2 })
            .eq("user_id", user!.id);
        }else{
          setUserProgress(prev => ({
            ...prev,
            openings_level_1: updatedOpenings,
            openings_level_2: [...prev.openings_level_2, opening],
          }));
          await supabase
            .from("user_progress")
            .update({ small_level: userProgress.small_level + 1 })
            .eq("user_id", user!.id);
        }
        //if (userProgress.openings_level_2.length === 0 || userProgress.openings_level_2.length === 2 || userProgress.openings_level_2.length === 4 || userProgress.openings_level_2.length === 6 || userProgress.openings_level_2.length === 7 || userProgress.openings_level_2.length === 17){
        if(userProgress.small_level === 3 || userProgress.small_level === 4 || userProgress.small_level === 6 || userProgress.small_level === 8 || userProgress.small_level === 9 || userProgress.small_level === 19){
          levelUp();
          console.log("Level up!" + opening + " " + userProgress.small_level);
        }
      }else if (userProgress.openings_level_2?.includes(opening)){
        if(userProgress.level >= 6){
          const updatedOpenings = (userProgress.openings_level_2 ?? []).filter(o => o !== opening);
          await supabase
            .from("user_progress")
            .update({ openings_level_2: updatedOpenings })
            .eq("user_id", user!.id);
          const updatedNextOpenings = (userProgress.openings_level_3 ? [...userProgress.openings_level_3, opening] : [opening]);
          await supabase
            .from("user_progress")
            .update({ openings_level_3: updatedNextOpenings })
            .eq("user_id", user!.id);
          setUserProgress(prev => ({
            ...prev,
            openings_level_2: updatedOpenings,
            openings_level_3: updatedNextOpenings,
          }));
          await supabase
            .from("user_progress")
            .update({ small_level: userProgress.small_level + 1 })
            .eq("user_id", user!.id);
          if(userProgress.small_level === 3 || userProgress.small_level === 4 || userProgress.small_level === 6 || userProgress.small_level === 8 || userProgress.small_level === 9 || userProgress.small_level === 19){
            levelUp();
            console.log("Level up!" + opening + " " + userProgress.small_level);
          }
        }
      }else{//3
        if(userProgress.level >= 7){
          const updatedOpenings = (userProgress.openings_level_3 ?? []).filter(o => o !== opening);
          await supabase
            .from("user_progress")
            .update({ openings_level_3: updatedOpenings })
            .eq("user_id", user!.id);
          const updatedNextOpenings = (userProgress.openings_level_4 ? [...userProgress.openings_level_4, opening] : [opening]);
          await supabase
            .from("user_progress")
            .update({ openings_level_4: updatedNextOpenings })
            .eq("user_id", user!.id);
          setUserProgress(prev => ({
            ...prev,
            openings_level_3: updatedOpenings,
            openings_level_4: updatedNextOpenings,
          }));
          await supabase
            .from("user_progress")
            .update({ small_level: userProgress.small_level + 1 })
            .eq("user_id", user!.id);
          if(userProgress.small_level === 3 || userProgress.small_level === 4 || userProgress.small_level === 6 || userProgress.small_level === 8 || userProgress.small_level === 9 || userProgress.small_level === 19){
            levelUp();
            console.log("Level up!" + opening + " " + userProgress.small_level);
          }
        }
      }
    }
    setGameResult(finalmessage);
    await saveGameResult(accuracy, result, opening);
  }

  //async function dailyTriggerEnd(finalmessage: string, accuracy: number, daily_score: number){
  async function dailyTriggerEnd(finalmessage: string){
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

  const PIECE2_VALUES: Record<string, number> = {
    p: 1, n: 3.2, b: 3.3, r: 5.1, q: 8.8, k: 0
  };

  function countAttackedPieces(fen: string): number[] {
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

    let multiplier = 1;
    let stmMaterial = 0;
    let oppMaterial = 0;
    let pieces: string[] = [];
    let side = "s";

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        const square = (String.fromCharCode(97 + file) + (8 - rank)) as Square;

        //multiplier code
        if(square === "a1" || square === "h1" || square === "a8" || square === "h8"){
          if(piece?.type !== "r"){
            multiplier *= 1.05;
            console.log("rook not on edge: " + square + " multiplier: " + multiplier);
          }
        }
        if (!piece) continue;
        if(piece.color === sideToMove){
          side = "s";
        }else{
          side = "o";
        }
        pieces.push((piece.type + square[0] + side));
        /*if(piece.type === "r"){
          if(square === "a1" || square === "h1" || square === "a8" || square === "h8"){
            multiplier *= 0.95;
            console.log("rook on edge: " + square + " multiplier: " + multiplier);
          }*/
        if (piece.type === "n"){
          if((square[0] === "b" || square[0] === "g" || square[0] === "a" || square[0] === "h" || square[1] === "2" || square[1] === "7" || square[1] === "1" || square[1] === "8")){
            multiplier *= 0.95;
            console.log("knight not in center: " + square + " multiplier: " + multiplier);
          }
        }

        const piece2Value = PIECE2_VALUES[piece.type];
        if(piece.color === sideToMove){
          stmMaterial += piece2Value;
        }else{
          oppMaterial += piece2Value;
        }

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
    stmMaterial = Math.round(stmMaterial * 10)
    oppMaterial = Math.round(oppMaterial * 10)
    if (Math.abs(stmMaterial - oppMaterial) > 7) {
      multiplier *= 1.1;
      console.log("material imbalance: stm " + stmMaterial + " vs opp " + oppMaterial + " multiplier: " + multiplier);
    }
    if (stmMaterial % 10 !== oppMaterial % 10) {
      multiplier *= 1.1;
      console.log("material difference: stm " + stmMaterial + " vs opp " + oppMaterial + " multiplier: " + multiplier);
    }
    pieces.sort(a => {
      if (a[0] === "p") return 1;
      if (a[0] === "n") return 2;
      if (a[0] === "b") return 3;
      if (a[0] === "r") return 4;
      if (a[0] === "q") return 5;
      return 0;
    });
    let matchpiececount = 0;
    const piecesNoPawns = pieces.filter(p => p[0] !== "p");
    piecesNoPawns.forEach(p => {
      piecesNoPawns.filter(other => {
        if (p === other) return false;
        if (p[0] !== other[0]) return false;
        if (p[2] === other[2]) return false;
        if (p[1] !== other[1]) return false;
        return true; 
      //note: put in console.logs for multipliers
      }).forEach(match => {
        matchpiececount++;
        console.log("symmetry match: " + p + " vs " + match);
      });
    });
    console.log("total pieces: " + piecesNoPawns.length + " matchpiececount: " + matchpiececount);
    multiplier *= (1 - (matchpiececount / piecesNoPawns.length) * 0.2);
    console.log("symmetry multiplier: " + (1 - (matchpiececount / piecesNoPawns.length) * 0.2) + " multiplier: " + multiplier);

    return [attackedCount, multiplier];
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
        if(piece.type === "p"){
          moveCount++;
          continue;
        }else if(piece.type === "k"){
          continue;
        }

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

  function countPassedPawns(fen: string): { stm: number; opp: number } {
    const fenParts = fen.split(" ");
    const sideToMove = fenParts[1] as "w" | "b";
    //const opponent = sideToMove === "w" ? "b" : "w";
    const game = new Chess(fen);
    const board = game.board();
    let stmPassed = 0;
    let oppPassed = 0;

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (!piece || piece.type !== "p") continue;

        const color = piece.color;

        const isPassed = (() => {
          for (let r = 0; r < 8; r++) {
            if (color === "w" && r >= rank) continue;
            if (color === "b" && r <= rank) continue;
            for (let f = file - 1; f <= file + 1; f++) {
              if (f < 0 || f > 7) continue;
              const blocker = board[r][f];
              if (blocker && blocker.type === "p" && blocker.color !== color) {
                return false;
              }
            }
          }
          return true;
        })();

        if (isPassed) {
          if (color === sideToMove) stmPassed++;
          else oppPassed++;
        }
      }
    }

    return { stm: stmPassed, opp: oppPassed };
  }

  /*function getFensFromPgn(pgn: string): string[] {
    const game = new Chess();
    game.loadPgn(pgn);
    const history = game.history({ verbose: true });
    
    const fens: string[] = [];
    const replay = new Chess();
    
    fens.push(replay.fen()); // starting position
    for (const move of history) {
      replay.move(move.san);
      fens.push(replay.fen());
    }
    
    return fens;
  }

  async function getScoresFromFens(fens: string[]): Promise<number[]> {
    let scores: number[] = [];
    for (const fen of fens) {
      const [score] = await predictCPL(fen, 20, true, -91, -41, 10, -80, -40);
      scores.push(score);
      if (scores.length % 10 === 0) {
        console.log(`Processed ${scores.length} FENs`);
      }
    }
    return scores;
  }*/

  async function predictCPL(fen: string, depth: number, usemultipliers: boolean, cpVal1: number, cpVal2: number, cpAdd: number, clarityVal1: number, clarityVal2: number): Promise<[number, number, number, number, number, number, string]> {
    //standard: depth = 18, usemultipliers = true, cpVal1=-91, cpVal2 = -41, cpAdd = 10, clarityVal1 = -80, clarityVal2 = -40
    let score = 0;
    let multiplier = 1;
    const lines = await workerA.getTop6Lines(fen, depth);
    let pieces = countPieceSquares(fen);
    score += pieces;
    let cpCount = 0;
    lines.forEach((line) =>{
      if (line.cp > -9000 && line.cp < 9000){
        if (line.cp - lines[0].cp > cpVal1 && line.cp - lines[0].cp < cpVal2){
          cpCount += cpAdd;
        }

        if (usemultipliers){
          if (line === lines[0] || line.cp + 100 > lines[0].cp){
            const firstMove = line.pv?.split(" ")?.[0];
            const tempGame = new Chess(fen);
            try {
              const move = tempGame.move(firstMove);
              if (move?.captured != undefined) {
                multiplier *= 0.8; 
                console.log("capture multiplier: " + move.san);
                if(line.cp + 30 > lines[0].cp){
                  multiplier *= 0.8;
                  console.log("best move capture multiplier: " + move.san);
                }
              }else if(move.san.includes("+")){
                multiplier *= 0.9;
                console.log("check multiplier: " + move.san);
                if(line.cp + 30 > lines[0].cp){
                  multiplier *= 0.9;
                  console.log("best move check multiplier: " + move.san);
                }   
              }
              if ((move?.from === "e1" || move?.from === "e8") && move?.piece === "k"){
                multiplier *= 0.8;
                console.log("castle/kingmove multiplier: " + move.san);
                if(line.cp + 30 > lines[0].cp){
                  multiplier *= 0.8;
                  console.log("best move castle/kingmove multiplier: " + move.san);
                }
              }
            }catch{} 
          }
        }
      }
    })
    score += cpCount;

    //below is sort of deletable code
    if (Math.abs(lines[0].cp) > 300){
      multiplier *= 1 - (Math.abs(lines[0].cp) - 300) / 1000;
      if (multiplier < 0.6) multiplier = 0.6;
      console.log("cp multiplier: " + multiplier);
    }
    const bestMovePv = lines[0]?.pv?.split(" ")?.[0];
    if (bestMovePv) {
      const tempGame = new Chess(fen);
      try {
        const move = tempGame.move(bestMovePv);

        if (move) {
          const fenParts = fen.split(" ");
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
            
            const afterFenParts = tempGame.fen().split(" ");
            afterFenParts[1] = sideToMove;
            const stmGameAfter = new Chess(afterFenParts.join(" "));

            const defenders = stmGameAfter
              .moves({ verbose: true })
              .filter(m => m.to === move.from);

            console.log("attackers:", attackers.map(m => m.piece + " from " + m.from));
            console.log("defenders:", defenders.map(m => m.piece + " from " + m.from));
          
            // m.from !== move.to excludes the piece that just moved from being its own defender

            /*const defenders = oppGame // oppGame has opponent to move
              .moves({ verbose: true })
              .filter(m => m.to === move.from); // these are opponent moves TO the square = attackers*/

            // For defenders, flip: stmGame has sideToMove to move
            // but we need pieces that COVER move.from, not pieces ON move.from
            // Use the oppFen but ask which stm pieces attack that square:
            const isDefended = stmGame.isAttacked(move.from as Square, sideToMove);
            

            const isUndefendedAndAttacked = !isDefended;

            if (isAttackedByLesser) {
              multiplier *= 0.8;
              console.log("attacked piece multiplier: " + move.san);
            }else if (isUndefendedAndAttacked){//move involves moving piece attacked by opp piece of less value
              multiplier *= 0.8;
              console.log("hanging piece multiplier: " + move.san);
            }else{//move involves moving hanging piece
              /*const numberOfDefenders = isDefended
              ? stmGame.moves({ verbose: true }).filter(m => m.to === move.from).length
              : 0;*/
              const numberOfDefenders = defenders.length;
              const numberOfAttackers = attackers.length;
              if (numberOfAttackers > numberOfDefenders) {
                multiplier *= 0.8;
                console.log("overwhelmed piece multiplier: " + move.san + " attackers: " + attackers.map((m) => m.piece).join(", ") + " defenders: " + defenders.map((m) => m.piece).join(", "));
              }else{
                console.log("piece not overwhelmed: " + move.san + " attackers: " + attackers.map((m) => m.piece).join(", ") + " defenders: " + defenders.map((m) => m.piece).join(", "));
              }
            }
          }
          //if move threatens a capture of an opponent piece
          const afterFenParts = tempGame.fen().split(" ");
          afterFenParts[1] = sideToMove;
          const afterGame = new Chess(afterFenParts.join(" "));

          const allMovesFromTo = afterGame.moves({ verbose: true }).filter(m => m.from === move.to);
          //console.log("allMovesFromTo:", allMovesFromTo);

          const threatenedSquares = allMovesFromTo.map(m => m.to);

          const isThreateningCapture = threatenedSquares.some(sq => {
            const targetPiece = afterGame.get(sq as Square);
            if(targetPiece?.type === "k") return false; // don't consider moves that threaten the king as threatening captures for this multiplier
            return targetPiece &&
              targetPiece.color !== sideToMove &&
              PIECE_VALUES[targetPiece.type] > movedPieceValue;
          });

          if (isThreateningCapture) {

            multiplier *= 0.8;
            console.log("threatening capture multiplier: " + move.san);
            console.log("threatened squares:", threatenedSquares);
            console.log("pieces on threatened squares:", threatenedSquares.map(sq => ({ sq, piece: tempGame.get(sq as Square) })));
          }else{
            console.log("not threatening capture: " + move.san);
            console.log("threatened squares:", threatenedSquares);
            console.log("pieces on threatened squares:", threatenedSquares.map(sq => ({ sq, piece: tempGame.get(sq as Square) })));
          }
        }
      } catch {}
    }
    //above is sort of deletable code

    let clarity = 25;
    if(lines[1] !== undefined){
      //lines1-lines0 = negative, lines0-lines1 = positive
      if(lines[1].cp - lines[0].cp <= clarityVal1){
        clarity = clarity - Math.trunc(((lines[0].cp - lines[1].cp) + clarityVal1) / 5);
      }else if (lines[1].cp - lines[0].cp >= clarityVal2){
        clarity = clarity - Math.trunc(((clarityVal2 * -1) - (lines[0].cp - lines[1].cp)) / 2);
      }
      if (clarity < 0) clarity = 0;
      score += clarity;
    }
    //5 and 2 above are changeable as well

    let onslaught = -10;
    const [attackedCount, mults] = countAttackedPieces(fen);
    //console.log("mults: " + mults);
    multiplier *= mults;
    onslaught += attackedCount * 10;
    if (onslaught < 0){
      onslaught = 0;
    }
    const { stm, opp } = countPassedPawns(fen);
    const pps = (stm + opp) * 10;
    onslaught += pps;//adds passed pawns
    //-10, 10 and 10 are changeable as well
    score += onslaught;

    score = Math.round(score * multiplier);
    multiplier = Math.round(multiplier * 100) / 100;

    const bestMove = lines[0]?.pv?.split(" ")?.[0] || "";
    return [score, pieces, cpCount, clarity, onslaught, multiplier, bestMove];
  }

  async function chooseFiveFens(): Promise<string[]> {
    let daDailyFens = await extractFENsFromGames(pgnData,94, "None", 10);
    let chosenFens: string[] = [];
    let chosenMoves: string[] = [];
    const chosenScores: number[] = [];
    const chosenStats: {fen: string, score: number, pieces: number, cpCount: number, clarity: number, onslaught: number, multiplier: number}[] = [];
    for (let i = 0; i < 200; i++){
      const newFen = daDailyFens[Math.floor(Math.random() * daDailyFens.length)];
      if ((!newFen) || (chosenFens.includes(newFen))){
        console.log("No fen/duplicate fen found, skipping iteration " + i);
        continue;
      }

      let [score, pieces, cpCount, clarity, onslaught, multiplier, bestMove] = await predictCPL(newFen, 8, true, -91, -41, 10, -80, -40);
      if (score > 60 && score > Math.min(...chosenScores)){
        [score, pieces, cpCount, clarity, onslaught, multiplier] = await predictCPL(newFen, 18, true, -91, -41, 10, -80, -40);
      }
      if (score > 60 && score > Math.min(...chosenScores)){
        [score, pieces, cpCount, clarity, onslaught, multiplier] = await predictCPL(newFen, 21, true, -91, -41, 10, -80, -40);
      }
      if (score > 60 && score > Math.min(...chosenScores)){
        [score, pieces, cpCount, clarity, onslaught, multiplier] = await predictCPL(newFen, 24, true, -91, -41, 10, -80, -40);
      }
      if (chosenFens.length < 5) {
        if(!chosenFens.includes(newFen)){
          chosenFens.push(newFen);
          chosenScores.push(score);
          chosenMoves.push(bestMove);
          chosenStats.push({fen: newFen, score, pieces, cpCount, clarity, onslaught, multiplier});
          console.log ("Chosen fen " + newFen + " with score " + score);
          const formatted = chosenFens.map((_,index) => `: ${chosenScores[index]} Calculation: ${chosenStats[index].pieces}/25 Decision: ${chosenStats[index].cpCount}/20 Clarity: ${chosenStats[index].clarity}/25 Onslaught: ${chosenStats[index].onslaught}/30 Mult: ${chosenStats[index].multiplier}`)
            .join("\n");
          setPosList(formatted);
        }
      }else if (score > Math.min(...chosenScores)) {
        if(!chosenFens.includes(newFen)){
          const minIndex = chosenScores.indexOf(Math.min(...chosenScores));
          chosenFens[minIndex] = newFen;
          console.log ("Replacing " + chosenScores[minIndex] + " with score " + score);
          chosenScores[minIndex] = score;
          chosenMoves[minIndex] = bestMove;
          chosenStats[minIndex] = {fen: newFen, score, pieces, cpCount, clarity, onslaught, multiplier};
          const formatted = chosenFens.map((_, index) => `: ${chosenScores[index]} Calculation: ${chosenStats[index].pieces}/25 Decision: ${chosenStats[index].cpCount}/20 Clarity: ${chosenStats[index].clarity}/25 Onslaught: ${chosenStats[index].onslaught}/30 Mult: ${chosenStats[index].multiplier}`)
            .join("\n");
          setPosList(formatted);
        }else {
          console.log("duplicate fen: " + newFen + " " + chosenFens + " " + chosenFens.includes(newFen));
        }
      }else{
        //console.log (score + " was not higher than " + Math.min(...chosenScores));
      }
      console.log(score + " " + pieces + " " + cpCount + " " + clarity + " " + onslaught + " " + multiplier + " " + newFen);
      console.log(i);
    }
    setDailyFens(chosenFens);
    setFenScores(chosenScores.reduce((a, b) => a + b, 0));
    setDailyBestMoves(chosenMoves);
    return chosenFens;
  }

  /*async function generateFENsFromOpening(mainline: string): Promise<string[]> {
    const fens: string[] = [];
    let mainMoves = mainline.split(" ");
    let genGame = new Chess();
    for (let i = 1; i < 4; i++){
      genGame.reset();
        for (let j = 0; j < mainMoves.length; j++){
          try{
            genGame.move({from: mainMoves[j].substring(0, 2), to: mainMoves[j].substring(2, 4), promotion: 'q'});
          }catch{

          }
        }
        setBigChessPosition(genGame.fen());
        while (fens.length < i * 20){
            const lines = await workerA.getTop6Lines(genGame.fen(), 16);
            if(!lines[1].cp){
              lines[1] = lines[0];
            }
            if(!lines[2].cp){
              lines[2] = lines[1];
            }
            let sidetomove = genGame.fen().split(" ")[1];
            if (sidetomove === "b") {
              //swap line 0 and 2
              const temp = lines[0];
              lines[0] = lines[2];
              lines[2] = temp;
            }
            let secondaccuracy = 0;
            let thirdaccuracy = 0;
            if (sidetomove === "b"){
              secondaccuracy = Math.round((100 * Math.exp((-(lines[1].cp - lines[0].cp)) / 200)));
              thirdaccuracy = Math.round((100 * Math.exp((-(lines[2].cp - lines[0].cp)) / 200)));
            }else{
              secondaccuracy = Math.round((100 * Math.exp((lines[1].cp - lines[0].cp) / 200)));
              thirdaccuracy = Math.round((100 * Math.exp((lines[2].cp - lines[0].cp) / 200)));
            }
            let thirdprobability = 0;
            let probability = 50 + (100 - secondaccuracy);
            if (probability > 100) probability = 100;
            thirdprobability = 50 + (secondaccuracy - thirdaccuracy);
            if (thirdprobability > 100) thirdprobability = 100;
            if (Math.random() * 100 < probability){
                genGame.move(lines[0].pv.split(" ")[0]);
                fens.push(genGame.fen());
                setBigChessPosition(genGame.fen());
            } else {
                //thirdaccuracy = Math.round((100 * Math.exp((lines[2].cp - lines[0].cp) / 200)) * 10);
                if (Math.random() * 100 < thirdprobability){
                    genGame.move(lines[1].pv.split(" ")[0]);
                    fens.push(genGame.fen());
                    setBigChessPosition(genGame.fen());
                } else {
                    genGame.move(lines[2].pv.split(" ")[0]);
                    fens.push(genGame.fen());
                    setBigChessPosition(genGame.fen());
                }
            }
            console.log(fens.length);
            console.log("Move " + lines[0].pv.split(" ")[0] + ": " + lines[0].cp + " Probability: " + probability);
            console.log("Move " + lines[1].pv.split(" ")[0] + ": " + lines[1].cp + " Accuracy: " + secondaccuracy + " Probability: " + ((100 - probability) * (thirdprobability / 100)));
            console.log("Move " + lines[2].pv.split(" ")[0] + ": " + lines[2].cp + " Accuracy: " + thirdaccuracy + " Probability: " + ((100 - probability - ((100 - probability) * (thirdprobability / 100)))));
            console.log("Chosen move: " + genGame.history({ verbose: true }).slice(-1)[0].san);
        }
    }
    return fens;
  }*/

  async function chooseFirstFen(opening: string = "None", plyLength: number = 10): Promise<string> {
    const daFens = await extractFENsFromGames(pgnData,94, opening, plyLength);
    while(daFens.length < 94){
      //const makeupFens = await extractFENsFromGames(pgnData, 94 - daFens.length, "None", plyLength);
      const randoN = Math.floor(Math.random() * 468);
      const makeupFens = await extractFENsFromGames(pgnData, randoN + 1, "None", plyLength, randoN);
      daFens.push(...makeupFens);
    }
    /*const prog = openingProgressMap[opening];
    let mainline = "";
    if (prog) {
      mainline = prog.main_line;
    }
    if (opening !== "None"){
      const generatedFens = await generateFENsFromOpening(mainline);
      daFens.push(...generatedFens);
    }*/
    
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

  function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    const timeout = new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms));
    return Promise.race([promise, timeout]);
  }

  async function resolveEval(fen: string, startDepth: number = 18, fallbackeval: number): Promise<[number, string]> {
    let daEval = 1101;
    let mate = "";
    console.log("resolving eval of " + fen);
    if(resolvedFens.includes(fen)){
      const index = resolvedFens.indexOf(fen);
      daEval = parseFloat(resolvedFens[index + 1]);
      mate = resolvedFens[index + 2];
      console.log("skipping already resolved fen: " + fen + daEval + mate);
    }else{
      while (Math.abs(daEval) > 1100 && startDepth < 26){
        console.log("not yet resolved: " + startDepth + " " + fallbackeval);
        startDepth += 10;
        daEval = await withTimeout(
          workerB.getEval(fen, startDepth),
          3000,
          fallbackeval
        );
        if(Math.abs(daEval) > 1100 || daEval === fallbackeval){
          console.log("resolveworker timed out at depth: " + startDepth);
          break; // stop retrying if we timed out
        }
      }
      if(Math.abs(daEval) < 1101){
        console.log("resolve success: " + daEval + " depth: " + startDepth);
        if (Math.trunc(daEval) !== daEval) {
          const bline = await workerB.getBestLine(fen, startDepth);
          if(bline.mate) mate = bline.pv;
        }
      }else{
        console.log("resolve failure: " + daEval);
      }
      setResolvedFens(prev =>
        prev.concat([fen, daEval.toString(), mate])
      );
    }
    return [daEval, mate];
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
    let ourEval = await workerC.getEval(chessGame.fen(), 24);
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
      bestEval = -1 * await workerD.getEval(tryFenGame.fen(), 24);
      console.log(stockfishMove + " not equals " + playerMove);
    }else{
      console.log(stockfishMove + " equals " + playerMove);
    }

    let thisaccuracy = Math.round((100 * Math.exp((ourEval - bestEval) / 200)) * 10);
    if(thisaccuracy > 1000){
      console.log("Brilliant move! " + playerMove + " Eval: " + ourEval + " Best Eval: " + bestEval + " Accuracy: " + thisaccuracy/10);
      if (thisaccuracy > 1100 && Math.abs(bestEval) < 200){
        thisaccuracy = 1100;
      }else thisaccuracy = 1000;
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
      //dailyTriggerEnd("Daily Challenge Completed! Final Accuracy: " + displayAccuracy/10 + ". Final Score: " + displayScore, displayAccuracy/10, dailyScore);
      dailyTriggerEnd("Daily Challenge Completed! Final Accuracy: " + displayAccuracy/10 + ". Final Score: " + displayScore);
    }
    return;
  }

  function uciToSan(uciMove: string, fen: string): string {
    const chesssGame = new Chess(fen);
    const move = chesssGame.move({ from: uciMove.substring(0, 2), to: uciMove.substring(2, 4), promotion: 'q' });
    return move.san;
  }

  async function generateBranchMove(fen: string): Promise<string[]>{
    let uciFen: string[] = [];
    const genGame = new Chess(fen);
    const lines = await workerA.getTop6Lines(genGame.fen(), 16);
    if(!lines[1].cp) lines[1] = lines[0];
    if(!lines[2].cp) lines[2] = lines[1];
    let sidetomove = genGame.fen().split(" ")[1];
    if (sidetomove === "b") {
      const temp = lines[0];
      lines[0] = lines[2];
      lines[2] = temp;
    }
    let secondaccuracy = 0;
    let thirdaccuracy = 0;
    if (sidetomove === "b"){
      secondaccuracy = Math.round((100 * Math.exp((-(lines[1].cp - lines[0].cp)) / 200)));
      thirdaccuracy = Math.round((100 * Math.exp((-(lines[2].cp - lines[0].cp)) / 200)));
    }else{
      secondaccuracy = Math.round((100 * Math.exp((lines[1].cp - lines[0].cp) / 200)));
      thirdaccuracy = Math.round((100 * Math.exp((lines[2].cp - lines[0].cp) / 200)));
    }
    let thirdprobability = 0;
    let probability = 50 + (100 - secondaccuracy);
    if (probability > 100) probability = 100;
    thirdprobability = 50 + (secondaccuracy - thirdaccuracy);
    if (thirdprobability > 100) thirdprobability = 100;
    if (Math.random() * 100 < probability){
      genGame.move(lines[0].pv.split(" ")[0]);
      uciFen.push(lines[0].pv.split(" ")[0]);
      console.log("uciFen push " + lines[0].pv.split(" ")[0]);
      uciFen.push(genGame.fen());
    } else {
      //thirdaccuracy = Math.round((100 * Math.exp((lines[2].cp - lines[0].cp) / 200)) * 10);
      if (Math.random() * 100 < thirdprobability){
        genGame.move(lines[1].pv.split(" ")[0]);
        uciFen.push(lines[1].pv.split(" ")[0]);
        console.log("uciFen push " + lines[1].pv.split(" ")[0]);
        uciFen.push(genGame.fen());
      } else {
        genGame.move(lines[2].pv.split(" ")[0]);
        uciFen.push(lines[2].pv.split(" ")[0]);
        console.log("uciFen push " + lines[2].pv.split(" ")[0]);
        uciFen.push(genGame.fen());
      }
    }
    return uciFen;
  }

  async function getOpeningMaxPly(opening: string): Promise<number> {
    let openingMinPly = 4;
    if(userProgress.openings_level_2?.includes(opening)){
      openingMinPly = 7;
    }else if(userProgress.openings_level_3?.includes(opening)){
      openingMinPly = 10;
    }else if(userProgress.openings_level_4?.includes(opening)){
      openingMinPly = 20;
    }
    return openingMinPly;
  }

  async function chooseFen(fenBeforeMove: string, playerzMove: string) {
    const playerMove = uciToSan(playerzMove, fenBeforeMove);
    const chessGame = chessGameRef.current;
    if (!chessGame) return;
    const tryFenGame = tryFenRef.current;
    if (!tryFenGame) return;
    let ourOldEval = oldEval;
    if (movesplayed === 0){
      ourOldEval = await workerC.getEval(oldFen, 20);//isnt this just the same as stockfishSetup?
      setStartingEval(ourOldEval);
      setEvalHistory(prev => [...prev, ourOldEval]);
      console.log("Starting Eval logged: " + oldFen);
    }

    let evalA = evalHistory[evalHistory.length - 1];
    let displayAccuracy = 0;
    let disbrilcounter = brilcounter;
    let disbmcounter = bmcounter;

    if(isChallenge !== ""){
      console.log("Evaluating challenge move: " + isChallenge);
      const stockfishSetup = await workerD.getBestLine(fenBeforeMove, 20).then(r => { console.log("chooseFen workerB done", r); return r; });
      const ourEval = -1 * await workerC.getEval(chessGame.fen(), 20);
      let bestEval = ourEval;
      const pvb = stockfishSetup.pv;
      const stockfishMove = pvb?.split(" ")?.[0];
      const stockfishMoveSAN = uciToSan(stockfishMove, fenBeforeMove);
      if(stockfishMoveSAN !== playerMove){       
        tryFenGame.load(fenBeforeMove);
        tryFenGame.move({from: stockfishMove.substring(0, 2), to: stockfishMove.substring(2, 4), promotion: 'q'});
        bestEval = -1 * await workerD.getEval(tryFenGame.fen(), 20);
        console.log(stockfishMove + " not equals " + playerMove);
      }else{
        console.log(stockfishMoveSAN + " equals " + playerMove);
      }
      if(ourEval - bestEval >= -30){
        console.log("good challenge response: " + ourEval + " " + bestEval);
        updateChallengeLine(gameOpening, isChallenge, playerMove);
        setDif(100);
        setShowEffex("Good Move ✅ +100 eval");
        //fix -- show analysis on small board?
        stopEffex();
        let thisaccuracy = 1000;
        setBColors(prev => [...prev, "rgb(221, 255, 0)"]);
        displayAccuracy = Math.round(((accuracy * (movesplayed) + thisaccuracy) / (movesplayed + 1)));
        if (movesplayed !== 0){
          setAccuracy(displayAccuracy);
        }else{
          setAccuracy(thisaccuracy);
        }
        evalA += 100;
      }else if(ourEval - bestEval >= -50){
        console.log("acceptable challenge response: " + ourEval + " " + bestEval);
        setDif(25);
        setShowEffex("Acceptable Move 👍 +25 eval");
        //fix -- show analysis on small board?
        stopEffex();
        let thisaccuracy = 8500;
        setBColors(prev => [...prev, "rgb(221, 255, 0)"]);
        displayAccuracy = Math.round(((accuracy * (movesplayed) + thisaccuracy) / (movesplayed + 1)));
        if (movesplayed !== 0){
          setAccuracy(displayAccuracy);
        }else{
          setAccuracy(thisaccuracy);
        }
        evalA += 25;
      }else{
        console.log("bad challenge response: " + ourEval + " " + bestEval);
        setDif(-100);
        setShowEffex("Bad Move ❌ -100 eval");
        stopEffex();
        let thisaccuracy = 0;
        setBColors(prev => [...prev, "rgb(125, 0, 0)"]);
        displayAccuracy = Math.round(((accuracy * (movesplayed) + thisaccuracy) / (movesplayed + 1)));
        if (movesplayed !== 0){
          setAccuracy(displayAccuracy);
        }else{
          setAccuracy(thisaccuracy);
        }
        evalA -= 100;
      }
      setEvalHistory(prev => [...prev, evalA]);
    }else if (reqMove !== "none"){
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
        workerC.getBestLine(chessGame.fen(), 16).then(r => { console.log("chooseFen workerA done", r); return r; }),
        workerD.getBestLine(fenBeforeMove, 18).then(r => { console.log("chooseFen workerB done", r); return r; }),
      ]);
      let mate = result.mate;
      let stockMate = "";
      let ourMate = "";
      let ourEval = -1 * await workerC.getEval(chessGame.fen(), 20);
      
      let bestEval = ourEval;
      let streaker = currentStreak;

      const pvb = stockfishSetup.pv;
      const stockfishMove = pvb?.split(" ")?.[0];
      const stockfishMoveSAN = uciToSan(stockfishMove, fenBeforeMove);
      if(stockfishMoveSAN !== playerMove){
        if(Math.abs(ourEval) > 1000){
          const [daOurEval, potMate] = await resolveEval(chessGame.fen(), 16, ourEval * -1);
          ourEval = -1 * daOurEval;
          ourMate = potMate;
        }
        tryFenGame.load(fenBeforeMove);
        tryFenGame.move({from: stockfishMove.substring(0, 2), to: stockfishMove.substring(2, 4), promotion: 'q'});
        bestEval = -1 * await workerD.getEval(tryFenGame.fen(), 20);
        if(Math.abs(bestEval) > 1000){
          const [daBestEval, potMate] = await resolveEval(tryFenGame.fen(), 16, bestEval * -1);
          bestEval = -1 * daBestEval;
          stockMate = potMate;
        }
        console.log(stockfishMove + " not equals " + playerMove);
      }else{
        console.log(stockfishMoveSAN + " equals " + playerMove);
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
      }else if (ourMate !== ""){
        const ourMateMoves = ourMate.split(" ");
        for (let i = 0; i < ourMateMoves.length + 5; i++){
          if (chessGame.isGameOver() === false){
            setBigChessPosition(chessGame.fen());
            await new Promise(resolve => setTimeout(resolve, 500));
            const move = ourMateMoves?.[i];
            chessGame.move({from: move?.substring(0, 2) as Square, to: move?.substring(2, 4) as Square, promotion: 'q'});
            flushSync(() => {
              setBigChessPosition(chessGame.fen());
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        if (evalA > 0){
          triggerEnd("You win! Final result: " + (ourEval > 0 ? "You mate in " + ourMateMoves.length : "You mate in " + (-ourMateMoves.length)) + " Final stats: " + "Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (highestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter) + ", Starting Eval: " + startingEval, displayAccuracy/10, "Win", gameOpening);
        }else{
          triggerEnd("Game over! Final result: " + (ourEval > 0 ? "You are mated in " + ourMateMoves.length : "You are mated in " + (-ourMateMoves.length)) + " Final stats: " + "Accuracy: " + displayAccuracy/10 + ", Moves played: " + (movesplayed + 1) + ", Highest Streak: " + (highestStreak) + ", Brilliant Moves Played: " + (disbrilcounter) + ", Best Moves Played: " + (disbmcounter)  + ", Starting Eval: " + startingEval, displayAccuracy/10, "Loss", gameOpening);
        }
        return;
      }else if (stockMate !== ""){
        console.log("player failed to find mate");
        if(ourEval > 800){
          //fix
        }
      }
    }
    
    let posType = "choose random";
    const openingMaxPly = await getOpeningMaxPly(gameOpening);
    
    function getActiveLines(opening: string): string[] {
      let allLines = getOpeningLines(opening);
      const eligible = selectedLines.length > 0
        ? allLines.filter(l => selectedLines.includes(l.key))
        : allLines.filter(l => !(openingMaxPly < l.plyLength)); // default: all unlocked lines

      //console.log("eligible lines: " + eligible);
      return eligible.map(l => l.line);
      //return eligible.map(l => l.label + l.line);
    }
    function getActiveLineLabels(opening: string): string[] {
      const allLines = getOpeningLines(opening);
      const eligible = selectedLines.length > 0
        ? allLines.filter(l => selectedLines.includes(l.key))
        : allLines.filter(l => !(openingMaxPly < l.plyLength && l.key !== "base_line" && l.key !== "main_line"))
      //console.log("eligible lines: " + eligible);
      return eligible.map(l => l.label);
    }
    function getActiveLineKeys(opening: string): string[] {
      const allLines = getOpeningLines(opening);
      const eligible = selectedLines.length > 0
        ? allLines.filter(l => selectedLines.includes(l.key))
        : allLines.filter(l => !(openingMaxPly < l.plyLength && l.key !== "base_line" && l.key !== "main_line"))
      //console.log("eligible lines: " + eligible);
      return eligible.map(l => l.key);
    }
    function sanToUciMultiple(sanMoves: string[]): string[] {
      const openingMover = new Chess();
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

    function getLineUCIs(line: string): string[] {
      const lineMovesSAN = line.split(" ");
      //console.log ("lineMovesSAN: " + lineMovesSAN);
      const lineMovesUCI = lineMovesSAN.filter(m => {
        if (/^[1-9]/.test(m)) return false;
        return m;
      });
      //console.log ("lineMovesSAN filtered: " + lineMovesUCI);
      const lineMovesUCI2 = sanToUciMultiple(lineMovesUCI);
      //console.log ("lineMovesUCI: " + lineMovesUCI2);
      return lineMovesUCI2
    }
    const lines = getActiveLines(gameOpening);
    const lineLabels = getActiveLineLabels(gameOpening);
    const lineKeys = getActiveLineKeys(gameOpening);
    let fen = "";
    let randFens: string[] = [];
    let daLineUcis: string[] = [];
    let daRandLineLabel = "";
    let daRandLineKey = "";
    //console.log("LINES: " + lines);
    let sourceLineKey = "";
    if (selectedLines.length > 0){
      const randN = Math.floor(Math.random() * lines.length)
      const randLine = lines[randN];
      const randLineLabel = lineLabels[randN];
      daRandLineLabel = randLineLabel;
      daRandLineKey = lineKeys[randN];
      console.log("line: " + randLineLabel);
      if (Math.random() < 0.35){
        console.log("35%");
        const randChess = new Chess();
        const lineUCIs = getLineUCIs(randLine);
        daLineUcis = lineUCIs;
        for(let i = 0; i < lineUCIs.length; i++){
          randFens.push(randChess.fen());
          //console.log("loading move: " + lineUCIs[i]);
          randChess.move({from: lineUCIs[i].substring(0, 2), to: lineUCIs[i].substring(2, 4), promotion: 'q'});
        }
        //console.log("randchess fen: " + randChess.fen());
        fen = randChess.fen();
        let openingMinPly = 4;
        if(userProgress.openings_level_2?.includes(gameOpening)){
          openingMinPly = 7;
        }else if(userProgress.openings_level_3?.includes(gameOpening)){
          openingMinPly = 10;
        }else if(userProgress.openings_level_4?.includes(gameOpening)){
          openingMinPly = 20;
        }
        if(randFens.length > openingMinPly){
          console.log("defaulting to choose random: " + randFens.length + " " + openingMinPly + " " + lineUCIs);
          posType = "choose random";
        }else{
          if (randLineLabel.startsWith("Challenge")){
            posType = "challenge line";
            //setShowEffex("CHALLENGE MOVE!");
            //nextEffex("CHALLENGE MOVE!");
            setIsChallenge(daRandLineKey);
            console.log("daRandLineLabel: " + daRandLineLabel);
          }else{
            const challengeChance = (openingMinPly - lineUCIs.length - 1)/openingMinPly;
            console.log("Chance for challenge move: " + challengeChance + " " + openingMinPly + " " + lineUCIs.length);

            if(Math.random() < challengeChance){
              posType = "new challenge line";
              //setShowEffex("CHALLENGE MOVE!");
              //nextEffex("CHALLENGE MOVE!");
              //sourceLineKey = randLineLabel.split("_")[1];
              sourceLineKey = randLineLabel;
            }else{
              posType = "random line position";
              //setShowEffex(daRandLineLabel);
              //nextEffex(daRandLineLabel);
            }
          }
        }
      }else{
        console.log("65%");
      }
    }

    console.log(posType);
    function shortAlerts(fen: string, line: string | null){
      const alerts: string[] = [];
      if(line) alerts.push(line);
      const enPassantSquare = fen.split(" ")[3];
      const castlingRights = fen.split(" ")[2];
      if(enPassantSquare !== "-"){
        alerts.push("En passant square: " + enPassantSquare);
      }
      const alertsGame = new Chess(fen);
      const board = alertsGame.board();
      let e1e8: boolean[] = [false, false, false, false, false, false];//white king on e1, black king on e8, white rooks on a1 + h1, black rooks on a8 + h8
      for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
          const piece = board[rank][file];
          if (!piece) continue;
          //console.log(piece.type + " " + rank + " " + file + " " + piece.color);
          if(piece.type === "r"){
            if(rank === 7 && piece.color === "w"){
              if(file === 0){
                e1e8[2] = true;
              }else if(file === 7){
                e1e8[3] = true;
              }
            }else if(rank === 0 && piece.color === "b"){
              if(file === 0){
                e1e8[4] = true;
              }else if(file === 7){
                e1e8[5] = true;
              }
            }
            continue;
          }else if(piece.type === "k"){
            if(file === 4){
              if(piece.color === "w" && rank === 7){
                e1e8[0] = true;
              }else if(piece.color === "b" && rank === 0){
                e1e8[1] = true;
              }
            }
            continue;
          }
        }
      }
      console.log(e1e8);
      if(e1e8[0] === true){
        if((e1e8[2] && !castlingRights.includes("Q")) || (e1e8[3] && !castlingRights.includes("K"))){
          alerts.push("Castling rights: " + castlingRights);
        }
      }
      if(e1e8[1] === true && !alerts.includes(castlingRights)){
        if((e1e8[4] && !castlingRights.includes("q")) || (e1e8[5] && !castlingRights.includes("k"))){
          alerts.push("Castling rights: " + castlingRights);
        }
      }

      const formatted = alerts.join("\n");
      setDisplayAlerts(formatted);
    }
    let newFenny = "";

    if(posType === "choose random"){
      setReqMove("none");
      setIsChallenge("");
      let attempts = 0;
      const MAX_ATTEMPTS = 400;
      while (attempts < MAX_ATTEMPTS) {
        let newFens = fens[Math.floor(Math.random() * fens.length)];
        while(bPosHistory.includes(newFens) === true || bigChessPosition === newFens){
          console.log("skipping duplicate fen" + newFens);
          if(bigChessPosition === newFens){
            console.log("skipping REPEAT fen" + newFens);
          }
          newFens = fens[Math.floor(Math.random() * fens.length)];
        }
        console.log(bPosHistory + " | " + bigChessPosition + " | " + newFens);
        let evalB = await workerC.getEval(newFens, 10);
        let daMate = "";
        let highRes = false;
        if(Math.abs(evalB) > 1000 && Math.abs(evalA) > 300 && Math.abs(evalA) > Math.abs(evalB) * 0.5){
          const [daEvalB, daDaMate] = await resolveEval(newFens, 16, evalB);
          evalB = daEvalB
          daMate = daDaMate;
          highRes = true;
        }
        if(evalB !== Math.trunc(evalB)){
          console.log("MATE DETECTED");
          if((evalA > evalB && evalB > 0 && (Math.abs(evalB * 10) % 10 === 1)) || (evalA < evalB && evalB < 0 && (Math.abs(evalB * 10) % 10 === 1))){
            console.log("MATE SUCCESSFUL");
            const newevalB = evalB;
            
            setBigChessPosition(newFens);
            chessGame.load(newFens);
            highlightKingSquare(chessGame, "big");
            const difference = evalA - newevalB;
            setOldEval(newevalB);
            setDif(difference);
            console.log("Success 1! Mate found " + evalA + " " + evalB + " " + newevalB + " " + difference);
            setBPosHistory(prev => [...prev, newFens]);
            shortAlerts(newFens, "");
            return;
          }else if((Math.abs(evalA) > Math.abs(evalB) && evalB < 0 && (Math.abs((evalB * 10) % 10) === 1)) || (Math.abs(evalA) > Math.abs(evalB) && evalB > 0 && (Math.abs(evalB * 10) % 10 === 1))){
            //above line can be simplified
            console.log("SWAPMATE DETECTED" + newFens);
            
            //const daMate = await workerC.getBestLine(newFens, 26);
            const matePV = daMate?.split(" ");
            const swapMove = matePV[0];
            chessGame.load(newFens);
            try{
              chessGame.move({from: swapMove.substring(0, 2), to: swapMove.substring(2, 4), promotion: 'q'});
              console.log("swapmate successful?" + evalA + " " + evalB);
            }catch{
              console.log("invalid move in mateSwapFen");
            }
            setBigChessPosition(chessGame.fen());
            highlightKingSquare(chessGame, "big");
            const difference = evalA - evalB;
            setOldEval(evalB);
            setDif(difference);
            setBPosHistory(prev => [...prev, chessGame.fen()]);
            shortAlerts(chessGame.fen(), "");
            return;
          }
        }
        if (Math.abs(evalA) < 50){
          if ((evalA - evalB <= 30) && (evalA - evalB >= -30)){
            setBigChessPosition(newFens);
            chessGame.load(newFens);
            highlightKingSquare(chessGame, "big");
            let newevalB = await workerD.getEval(newFens, 18);
            const difference = evalA - newevalB;
            setOldEval(newevalB);
            setDif(difference);
            console.log("Success 1! Elo Within 30 " + evalA + " " + evalB + " " + newevalB + " " + difference);
            setBPosHistory(prev => [...prev, newFens]);
            shortAlerts(newFens, "");
            return;
          }
        }else if (((evalA < evalB / 0.6) && (evalA > evalB * 0.6) && (evalA >= 0)) || ((evalA > evalB / 0.6) && (evalA < evalB * 0.6) && (evalA <= 0))){
          let newevalB = evalB;
          let deepMate = true;
          if(highRes === true){
            
          }else{
            newevalB = await workerC.getEval(newFens, 18);
            deepMate = false;
            if(Math.abs(newevalB) > 1000 && Math.abs(evalA) > 300 && Math.abs(evalA) > Math.abs(newevalB) * 0.5){
              const [daNewEvalB] = await resolveEval(newFens, 16, newevalB);
              newevalB = daNewEvalB;
              deepMate = true;
            }
          }
          if (((evalA < newevalB / 0.5) && (evalA > newevalB * 0.5) && (evalA >= 0)) || ((evalA > newevalB / 0.5) && (evalA < newevalB * 0.5) && (evalA <= 0))){
            if(!(Math.abs(newevalB) * 10 % 10 === 1 && deepMate === false)){
              setBigChessPosition(newFens);
              chessGame.load(newFens);
              highlightKingSquare(chessGame, "big");
              setOldEval(newevalB);
              const difference = evalA - newevalB;
              setDif(difference);
              console.log("Success 2! Elo within division range" + evalA + " " + evalB + " " + newevalB + " " + difference);
              setBPosHistory(prev => [...prev, newFens]);
              shortAlerts(newFens, "");
              return;
            }else{
              console.log("IGNORING MATE");
            }
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
          let newevalB = evalB;
          let deepMate = true;
          if(highRes === true){
            
          }else{
            newevalB = await workerB.getEval(chessGame.fen(), 18);
            deepMate = false;
            if(Math.abs(newevalB) > 1000 && Math.abs(evalA) > 300 && Math.abs(evalA) > Math.abs(newevalB) * 0.5){
              const [daNewEvalB] = await resolveEval(chessGame.fen(), 16, newevalB);
              newevalB = daNewEvalB;
              deepMate = true;
            }
          }

          if (((evalA < newevalB / 0.5) && (evalA > newevalB * 0.5) && (evalA >= 0)) || ((evalA > newevalB / 0.5) && (evalA < newevalB * 0.5) && (evalA <= 0))){
            if(!(Math.abs(newevalB) * 10 % 10 === 1 && deepMate === false)){
              if(bPosHistory.includes(chessGame.fen()) === true || bigChessPosition === newFens){
                console.log("skipping duplicate swap fen" + chessGame.fen());
                if(bigChessPosition === newFens){
                  console.log("skipping REPEAT swap fen" + chessGame.fen());
                }
              }else{
                setBigChessPosition(chessGame.fen());
                highlightKingSquare(chessGame, "big");
                setOldEval(newevalB);
                const difference = evalA - newevalB;
                setDif(difference);
                console.log("Success 3! Elo swapped" + evalA + " " + evalB + " " + newevalB + " " + difference);
                setBPosHistory(prev => [...prev, chessGame.fen()]);
                shortAlerts(chessGame.fen(), "");
                return;
              }
            }else{
              console.log("IGNORING SWAPMATE");
            }
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
    }else if (posType === "challenge line"){
      setReqMove("none");
      newFenny = fen;
   //fix -- is this right?
    }else if (posType === "new challenge line"){
      setReqMove("none");
      const [newMoveUci, newFens] = await generateBranchMove(fen); 
      newFenny = newFens;
      console.log("newMoveUci: " + newMoveUci + " newFens: " + newFens + " sourceLineKey: " + sourceLineKey + " gameOpening: " + gameOpening);
      const newSourceLineKey = await createNewLineFromChallenge(gameOpening, daRandLineKey, newMoveUci, fen);
      setIsChallenge(newSourceLineKey);
      console.log("newSourceLineKey: " + newSourceLineKey);
    }else{//random line position
      let rand2N = Math.floor(Math.random() * (randFens.length - baseLineLengths[gameOpening])) + baseLineLengths[gameOpening];
      if(daRandLineKey === "base_line"){
        rand2N = Math.floor(Math.random() * randFens.length);
      }
      
      newFenny = randFens[rand2N];
      const daReqMove = uciToSan(daLineUcis[rand2N],randFens[rand2N])
      setReqMove(daReqMove);
      setIsChallenge("");
    }
    if(posType === "random line position"){
      shortAlerts(newFenny, "Line: " + daRandLineLabel);
    }else if(posType === "challenge line" || "new challenge line"){
      shortAlerts(newFenny, "Challenge Move! Play a good move");
    }else{
      if(newFenny !== ""){
        shortAlerts(newFenny, "");
      }
    }
    
    if(posType !== "choose random"){
      setBigChessPosition(newFenny);
      chessGame.load(newFenny);
      highlightKingSquare(chessGame, "big");
      let newevalB = await workerD.getEval(newFenny, 18);//fix --is this line and below needed?
      if(Math.abs(newevalB) > 1000 && Math.abs(evalA) > 300 && Math.abs(evalA) > Math.abs(newevalB) * 0.5){
        const [daNewEvalB] = await resolveEval(newFenny, 16, newevalB);
        newevalB = daNewEvalB;
      }
      const difference = evalA - newevalB;
      setOldEval(newevalB);
      setDif(difference);
      setBPosHistory(prev => [...prev, newFenny]);
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

  /*function sanToUci(sanMove: string): string {
    const openingMover = new Chess();
    try {
      const moveData = openingMover.move(sanMove);
      if (!moveData) return "";
      return `${moveData.from}${moveData.to}${moveData.promotion || ''}`;
    } catch {
      return "";
    }
  }*/

  async function startOpening(opening: string) {
    setScreen("classic");
    setGameOpening(opening);
    const allLines = getOpeningLines(opening);
    const eligiblePracticeLines = allLines.filter(l => practiceLines.includes(l.key));
    function parseMoves(san: string): string[] {
      return san.split(" ")
        .filter(m => !/^[1-9]/.test(m) && m.trim().length > 0)
        .map(m => m)
        .filter(Boolean);
    }
    const newGame = new Chess();
    if (opening !== "None") {
      if(eligiblePracticeLines[0]){
        setShowEffex("Practice: " + eligiblePracticeLines[0]?.label);
        stopEffex();
      }
      if(practiceLines.length !== selectedLines.length){
        const starterLines = getOpeningLines(opening);
        for (const selectedLine of selectedLines){
          if(!practiceLines.includes(selectedLine)){
            const filteredLines = starterLines.filter(l => l.key === selectedLine)
            const filterLines = filteredLines[0];
            const selectedLineMoves = filterLines.line;
            console.log("selecting line: " + selectedLine + " with moves: " + selectedLineMoves);
            newGame.reset();
            const selectedMoves = parseMoves(selectedLineMoves);
            const selectedFens = [newGame.fen()];
            for (let i = 0; i < selectedMoves.length; i++) {
              const move = selectedMoves[i];
              if (!move) break;
              newGame.move(move);
              selectedFens.push(newGame.fen());
            }
          }
        }
      }
      for (const practiceLine of eligiblePracticeLines) {
        console.log("Practicing line: " + practiceLine.label + " Moves: " + practiceLine.line);
        newGame.reset();
        const openingMoves = parseMoves(practiceLine.line);
        const openingFens = [newGame.fen()];
        setBigChessPosition(newGame.fen());
        for (let i = 0; i < openingMoves.length; i++) {
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

        async function playerRunThru(fens: string[]) {
          for (let i = 0; i < fens.length - 1; i++) {
            newGame.load(fens[i]);
            chessGameRef.current = newGame;
            setReqMove(openingMoves[i]);
            while (chessGameRef.current.fen() !== fens[i + 1]) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          //setShowEffex("Correct ✅");
          setShowEffex("Next: " + (eligiblePracticeLines[eligiblePracticeLines.indexOf(practiceLine) + 1]?.label ?? "End of Practice"));
          stopEffex();
        }

        /*async function waitAddMoves(minMoves: number) {
          while (daOpeningFensRef.current.length - 1 < minMoves) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }*/

        await playerRunThru(openingFens);
        setReqMove("none");

        /*if (openingFens.length - 1 < userProgress.userMinPly) {
          setReqMove("add");
          const infos = await getMoveInfos(openingFens[openingFens.length - 1], opening);
          setMoveInfos(infos);
          await waitAddMoves(userProgress.userMinPly);
          setMoveInfos([]);
        }*/
        await new Promise(resolve => setTimeout(resolve, 1000)); // brief pause between lines
      }
      setPracticeEnded(true);
    }
    if (opening !== "None") {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    const startFen = await chooseFirstFen(opening, 10);
    newGame.load(startFen);
    chessGameRef.current = newGame;
    smallGameRef.current = new Chess(startFen);
    tryFenRef.current = new Chess(startFen);
    setChessPosition(newGame.fen());
    setBigChessPosition(newGame.fen());
    setOldFen(newGame.fen());
    highlightKingSquare(newGame, "big");
    setBPosHistory([newGame.fen()]);
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
        setShowEffex("Position added to opening pool");
        stopEffex();
        setBigChessPosition(ourNewFen);
        const lines = openingLines[gameOpening] ?? [];
        if (lines.length > 0) {
          //const line = lines.find(l => l.line_key === "base_line")?.moves ?? "";
          //await addMoveToLine(gameOpening, "base_line", line, moveFrom + square);
        }
        const infos = await getMoveInfos(ourNewFen, gameOpening);
        setMoveInfos(infos);
        //console.log("\Added fen: " + chessGame.fen() + " Move: " + moveFrom + square);
      }else if (reqMove !== "none"){
        if(practiceEnded === false){
          const sendthatfen = chessGame.fen();
          chessGame.move({
            from: moveFrom,
            to: square,
            promotion: 'q'
          });
          let playMove = uciToSan(moveFrom + square, sendthatfen);
          if(playMove === reqMove){
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
          console.log("situation 0");
          const sendthatfen = chessGame.fen();
          setOldFen(chessGame.fen());
          chessGame.move({
            from: moveFrom,
            to: square,
            promotion: 'q'
          });
          setOldMove(moveFrom + square)
          chooseFen(sendthatfen, moveFrom + square);
          setFens(fens.filter(f => f !== sendthatfen));
          //fix-- above is probably wrong
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
          setFens(fens.filter(f => f !== sendthatfen));
          console.log("removed fen: " + sendthatfen);
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
    
    /*let fens = getFensFromPgn("1. c4 e5 2. g3 d6 3. Bg2 c6 4. Nc3 Nf6 5. d4 Qc7 6. Bg5 Nbd7 7. Nf3 Be7 8. O-O h6 9. Bxf6 Nxf6 10. d5 c5 11. e4 Bd7 12. a3 a6 13. Qd3 Rb8 14. Rad1 Qa5 15. Nd2 b5 16. cxb5 axb5 17. f4 exf4 18. gxf4 b4 19. Nc4 Qa7 20. Nb1 bxa3 21. Nbxa3 O-O 22. e5 dxe5 23. fxe5 Ng4 24. Rfe1 Bh4 25. Re2 Ba4 26. Rf1 Rb3 27. Qe4 h5 28. h3 Bd7 29. e6 Qb8 30. hxg4 fxe6 31. Rxf8+ Qxf8 32. gxh5 exd5 33. Qxh4 dxc4 34. Qxc4+ Qf7 35. Bd5");

    let scoreavg = 0;
    let scores: number[] = [];
    getScoresFromFens(fens).then((s) => {
      scores = s;
      scoreavg = scores.reduce((a, b) => a + b, 0) / scores.length;
      console.log(scores);
      console.log(scoreavg);
    });*/

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
              .filter((opening) => userProgress.openings_level_1?.includes(opening) || userProgress.openings_level_2?.includes(opening) || userProgress.openings_level_3?.includes(opening) || userProgress.openings_level_4?.includes(opening) || levelUnlocks[userProgress.level + 1]?.includes(opening))
              //fix--does that work?
              .map(opening => {
                const isBeaten = userProgress.openings_level_2?.includes(opening);
                const isBeatenTwice = userProgress.openings_level_3?.includes(opening);
                const isBeatenThrice = userProgress.openings_level_4?.includes(opening);
                //const isUnlocked = userProgress.openings_level_1.includes(opening);
                return (
                  <div
                    key={opening}
                    onClick={async () => {
                      setShowOpeningSelect(false);
                      if (opening === "Random") {
                        opening = openings[Math.floor(Math.random() * (openings.length - 3)) + 2];
                      }
                      const openingMaxPly = await getOpeningMaxPly(opening);
                      const allUnlocked = getOpeningLines(opening)
                        .filter(l => !(openingMaxPly < l.plyLength && l.key !== "base_line" && l.key !== "main_line"))
                        .map(l => l.key);
                      setSelectedLines(allUnlocked);
                      setPracticeLines([]);
                      
                      setPendingOpening(opening);
                      setShowLineSelect(true); // ← show picker instead of running immediately
                    }}
                  style={{
                    padding: "10px 16px",
                    //cursor: isUnlocked ? "pointer" : "not-allowed",
                    cursor: "pointer",
                    color: isBeaten ? "rgb(0, 200, 0)" : isBeatenTwice ? "rgb(230, 140, 0)" : isBeatenThrice ? "rgb(50, 0, 200)" : "#e6edf3",
                    //color: isUnlocked ? "#e6edf3" : "#8b949e",
                    fontSize: "0.9rem",
                    opacity: levelUnlocks[userProgress.level + 1]?.includes(opening) ? 0.4 : 1,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#21262d";
                  }}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {opening} {isBeaten || isBeatenTwice || isBeatenThrice}
                  {//fix- not sure above works
                  }
                </div>
              );
              })}
            </div>
          )}
          {showLineSelect && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 8,
              zIndex: 100,
              minWidth: 280,
              padding: "12px 16px",
            }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 10px", color: "#e6edf3" }}>
                Select lines for {pendingOpening}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8b949e", marginBottom: 4 }}>
                <span>Line</span>
                <div style={{ display: "flex", gap: 24 }}>
                  <span>Game</span>
                  <span>Practice</span>
                </div>
              </div>
              {getOpeningLines(pendingOpening).map(({ key, label, plyLength }) => {
                let openingMaxPly = 4;
                if(userProgress.openings_level_2?.includes(pendingOpening)){
                  openingMaxPly = 7;
                }else if(userProgress.openings_level_3?.includes(pendingOpening)){
                  openingMaxPly = 10;
                }else if(userProgress.openings_level_4?.includes(pendingOpening)){
                  openingMaxPly = 20;
                }
                const isLocked = (openingMaxPly < plyLength && key !== "base_line" && key !== "main_line");
                const isSelected = selectedLines.includes(key);
                const isPractice = practiceLines.includes(key);
                //const isPractice = false;
                return (
                  <div key={key} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                    opacity: isLocked ? 0.4 : 1,
                    fontSize: 13,
                    color: "#e6edf3",
                  }}>
                    {/* Game checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isLocked}
                      title="Include in game"
                      onChange={() => {
                        setSelectedLines(prev =>
                          isSelected ? prev.filter(k => k !== key) : [...prev, key]
                        );
                      }}
                    />
                    <span style={{ flex: 1 }}>
                      {label}
                      <span style={{ fontSize: 11, color: "#8b949e", marginLeft: 6 }}>{plyLength} plies</span>
                      {//isLocked && <span style={{ marginLeft: 4 }}>🔒</span>}
                      isLocked && <span style={{ marginLeft: 4 }}></span>}
                    </span>
                    {/* Practice checkbox */}
                    <input
                      type="checkbox"
                      checked={isPractice}
                      disabled={isLocked}
                      title="Practice with playerRunThru"
                      onChange={() => {
                        setPracticeLines(prev =>
                          isPractice ? prev.filter(k => k !== key) : [...prev, key]
                        );
                      }}
                    />
                  </div>
                );
              })}
              <button
                style={{ marginTop: 10, width: "100%" }}
                onClick={async () => {
                  setShowLineSelect(false);
                  await startOpening(pendingOpening); // ← extracted function, see Step 4
                }}
              >
                Start
              </button>
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
              {dailyGameHistory
                .filter((_, index) => index < 20)
                .map((game) => (
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
            {gameHistory
            //only take most recent 20 games
              .filter((_, index) => index < 20)
              .map((game) => (
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
                setShowEffex("Position added to opening pool");
                stopEffex();
                setBigChessPosition(ourNewFen);
                const lines = openingLines[gameOpening] ?? [];
                if (lines.length > 0) {
                  //const line = lines.find(l => l.line_key === "base_line")?.moves ?? "";
                  //await addMoveToLine(gameOpening, "base_line", line, moveFrom + square);
                }
                const infos = await getMoveInfos(ourNewFen, gameOpening);
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
              <div>
                {m.main && <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>Main Line</span>}
              </div>
            </div>
          ))}
        </div>
      )}  
      </div>
      <button className="back-button" onClick={handleBack}>Back</button>
      <button className={`back2-button ${showBack2 ? "show" : "hide"}`} onClick={() => {setShowBack2(false); setGameResult(storeGameResult);}}>Back to Graph</button>
      <div className={`evals-graph ${showBack2 ? "show" : "hide"}`}>{DisplayEval}</div>
      <div className={`alerts ${DisplayAlerts ? "show" : "hide"}`}>{DisplayAlerts}</div>
      </>
  ); 
}
export default App;
