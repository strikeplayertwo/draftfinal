// A single persistent Stockfish worker, shared across all calls.
// Requests are queued so they don't interfere with each other.

import { MultiPVResult } from "./findMultLines";

type ResolveCallback = (result: { pv: string; cp: number | null; mate: number | null }) => void;

let worker: Worker | null = null;
let isReady = false;
const queue: Array<() => void> = [];
let currentResolve: ResolveCallback | null = null;
let currentResults: Record<number, any> = {};

function getWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL("./stockfish.wasm.js", import.meta.url), { type: "module" });

  worker.onmessage = (e) => {
    const text = String(e.data);

    if (text === "uciok") {
      worker!.postMessage("isready");
      return;
    }
    if (text === "readyok") {
      isReady = true;
      processNext(); // drain the queue once ready
      return;
    }
    if (text.includes(" multipv ") || text.includes("score")) {
      const cpMatch = text.match(/score cp (-?\d+)/);
      const mateMatch = text.match(/score mate (-?\d+)/);
      const pvMatch = text.match(/ pv (.+)$/);
      const multipvMatch = text.match(/multipv (\d+)/);
      const index = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;

      if (pvMatch) {
        currentResults[index] = {
          multipv: index,
          pv: pvMatch[1],
          cp: cpMatch ? parseInt(cpMatch[1], 10) : null,
          mate: mateMatch ? parseInt(mateMatch[1], 10) : null,
        };
      }
    }
    if (text.startsWith("bestmove")) {
      const resolve = currentResolve;
      currentResolve = null;
      const results = currentResults;
      currentResults = {};
      resolve?.(results[1]); // for single-PV callers; multiPV callers get all via separate helper
      processNext();
    }
  };

  worker.onerror = (err) => console.error("Stockfish worker error:", err);
  worker.postMessage("uci");
  return worker;
}

function processNext() {
  if (queue.length > 0 && isReady) {
    const next = queue.shift()!;
    next();
  }
}

export function getBestLineFromFen(fen: string, depth = 18) {
  return new Promise<{ pv: string; cp: number | null; mate: number | null }>((resolve) => {
    getWorker();
    queue.push(() => {
      currentResolve = resolve;
      worker!.postMessage(`position fen ${fen}`);
      worker!.postMessage(`go depth ${depth}`);
    });
    processNext();
  });
}

export function createPersistentWorker() {
  let isReady = false;
  const queue: Array<() => void> = [];
  let currentResolve: ((result: { pv: string; cp: number | null; mate: number | null }) => void) | null = null;
  let currentResults: Record<number, any> = {};

  const worker = new Worker(new URL("./stockfish.wasm.js", import.meta.url), { type: "module" });

  worker.onmessage = (e) => {
    const text = String(e.data);
    if (text === "uciok") { worker.postMessage("isready"); return; }
    if (text === "readyok") { isReady = true; processNext(); return; }
    if (text.includes("score") || text.includes(" pv ")) {
      const cpMatch = text.match(/score cp (-?\d+)/);
      const mateMatch = text.match(/score mate (-?\d+)/);
      const pvMatch = text.match(/ pv (.+)$/);
      const multipvMatch = text.match(/multipv (\d+)/);
      const index = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;
      if (pvMatch) {
        currentResults[index] = {
          multipv: index,
          pv: pvMatch[1],
          cp: cpMatch ? parseInt(cpMatch[1], 10) : null,
          mate: mateMatch ? parseInt(mateMatch[1], 10) : null,
        };
      }
    }
    if (text.startsWith("bestmove")) {
      const resolve = currentResolve;
      currentResolve = null;
      const results = { ...currentResults };
      currentResults = {};
      resolve?.(results[1]);
      processNext();
    }
  };

  worker.onerror = (err) => console.error("Stockfish worker error:", err);
  worker.postMessage("uci");

  function processNext() {
    if (queue.length > 0 && isReady) queue.shift()!();
  }

  return {
    getBestLine(fen: string, depth = 18) {
      return new Promise<{ pv: string; cp: number | null; mate: number | null }>((resolve) => {
        queue.push(() => {
          currentResolve = resolve;
          worker.postMessage(`position fen ${fen}`);
          worker.postMessage(`go depth ${depth}`);
        });
        processNext();
      });
    },
    getEval(fen: string, depth = 18): Promise<number> {
        return new Promise((resolve) => {
        queue.push(() => {
            currentResolve = (result) => {
            if (result.mate !== null) {
                // Convert mate to a large cp value: mate in 1 = 10000, mate in 5 = 9996, etc.
                resolve(result.mate > 0 ? 2000 - result.mate * 75 : -2000 - result.mate * 75);
            } else {
                resolve(result.cp ?? 0);
            }
            };
            worker.postMessage(`position fen ${fen}`);
            worker.postMessage(`go depth ${depth}`);
        });
        processNext();
        });
    },
    getMultiPV(fen: string, depth = 18, numLines = 3): Promise<MultiPVResult[]> {
        return new Promise((resolve) => {
            queue.push(() => {
            currentResolve = null; // not used for multiPV
            const multiResults: Record<number, any> = {};

            const originalOnMessage = worker.onmessage;
            worker.onmessage = (e) => {
                const text = String(e.data);
                if (text.includes(" multipv ")) {
                const multipvMatch = text.match(/multipv (\d+)/);
                const cpMatch = text.match(/score cp (-?\d+)/);
                const mateMatch = text.match(/score mate (-?\d+)/);
                const pvMatch = text.match(/ pv (.+)$/);
                if (multipvMatch && pvMatch) {
                    const index = parseInt(multipvMatch[1], 10);
                    multiResults[index] = {
                    multipv: index,
                    pv: pvMatch[1],
                    cp: cpMatch ? parseInt(cpMatch[1], 10) : null,
                    mate: mateMatch ? parseInt(mateMatch[1], 10) : null,
                    };
                }
                }
                if (text.startsWith("bestmove")) {
                worker.onmessage = originalOnMessage; // restore normal handler
                worker.postMessage(`setoption name MultiPV value 1`); // reset to default
                const sorted = Object.values(multiResults).sort((a, b) => a.multipv - b.multipv);
                resolve(sorted);
                processNext();
                }
            };

            worker.postMessage(`setoption name MultiPV value ${numLines}`);
            worker.postMessage(`position fen ${fen}`);
            worker.postMessage(`go depth ${depth}`);
            });
            processNext();
        });
    }
  };
}

// Two persistent workers for parallel analysis
export const workerA = createPersistentWorker();
export const workerB = createPersistentWorker();
export const workerC = createPersistentWorker(); // chooseFen
export const workerD = createPersistentWorker(); // chooseFen
