export type MultiPVResult = {
  multipv: number;
  pv: string;
  cp: number | null;
  mate: number | null;
};
export async function getMultiPVFromFen(
  fen: string,
  depth = 18,
  lines = 3
): Promise<MultiPVResult[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./stockfish.wasm.js", import.meta.url),
      { type: "module" }
    );

    const results: Record<number, MultiPVResult> = {};

    worker.onmessage = (e) => {
      const text = String(e.data);

      if (text === "uciok") {
        worker.postMessage(`setoption name MultiPV value ${lines}`);
        worker.postMessage("isready");
        return;
      }

      if (text === "readyok") {
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);
        return;
      }

      if (text.includes(" multipv ")) {
        const multipvMatch = text.match(/multipv (\d+)/);
        const cpMatch = text.match(/score cp (-?\d+)/);
        const mateMatch = text.match(/score mate (-?\d+)/);
        const pvMatch = text.match(/ pv (.+)$/);

        if (multipvMatch && pvMatch) {
          const index = parseInt(multipvMatch[1], 10);

          results[index] = {
            multipv: index,
            pv: pvMatch[1],
            cp: cpMatch ? parseInt(cpMatch[1], 10) : null,
            mate: mateMatch ? parseInt(mateMatch[1], 10) : null,
          };
        }
      }

      if (text.startsWith("bestmove")) {
        worker.terminate();

        // Convert to sorted array
        const sorted = Object.values(results).sort(
          (a, b) => a.multipv - b.multipv
        );

        resolve(sorted);
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    worker.postMessage("uci");
  });
}