export type EngineResult = {
  pv: string;
  mate: number | null;
};
export async function getBestLineFromFen(fen: string, depth = 18): Promise<EngineResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./stockfish.wasm.js", import.meta.url),
      { type: "module" }
    );

    let bestPv = "";
    let mate: number | null = null;

    worker.onmessage = (e) => {
      const text = String(e.data);

      if (text === "uciok") {
        worker.postMessage("isready");
        return;
      }

      if (text === "readyok") {
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);
        return;
      }

      if (text.includes("score mate")) {
        const match = text.match(/score mate (-?\d+)/);
        if (match) {
          mate = parseInt(match[1], 10);
        }
      }

      if (text.includes(" pv ")) {
        const pvMatch = text.match(/ pv (.+)$/);
        if (pvMatch) {
          bestPv = pvMatch[1];
        }
      }

      if (text.startsWith("bestmove")) {
        worker.terminate();
        resolve({ pv: bestPv, mate });
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    worker.postMessage("uci");
  });
}