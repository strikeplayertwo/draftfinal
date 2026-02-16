export async function evaluateFen(fen: string, depth: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./stockfish.wasm.js", import.meta.url),
      { type: "module" }
    );


    let evalScore = 0;
    let ready = false;

    const sideToMove = fen.split(" ")[1]; // "w" or "b"

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("Stockfish timed out"));
    }, 8000);

    worker.onmessage = (e) => {
      const text = String(e.data);

      if (text === "uciok") {
        worker.postMessage("isready");
        return;
      }

      if (text === "readyok") {
        ready = true;
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);
        return;
      }

      if (text.includes("score cp")) {
        const match = text.match(/score cp (-?\d+)/);
        if (match) {
          let cp = parseInt(match[1], 10);

          //normalize
          if (sideToMove === "b") {
            cp = cp; //removed -cp
          }

          evalScore = cp;
        }
      }

      if (text.startsWith("bestmove")) {
        clearTimeout(timeout);
        worker.terminate();
        resolve(evalScore);
      }
    };

    worker.onerror = (err) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(err);
    };

    worker.postMessage("uci");
  });
}


/*export async function evaluateFen(fen: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("/stockfish.wasm.js", import.meta.url),
      { type: "module" }
    );

    let evalScore = 0;
    let ready = false;

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("Stockfish timed out"));
    }, 8000);

    worker.onmessage = (e) => {
      const text = String(e.data);

      // DEBUG: uncomment if needed
      // console.log("SF:", text);

      if (text === "uciok") {
        worker.postMessage("isready");
        return;
      }

      if (text === "readyok") {
        ready = true;
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage("go depth 16");
        return;
      }

      if (text.includes("score cp")) {
        const match = text.match(/score cp (-?\d+)/);
        if (match) evalScore = parseInt(match[1], 10);
      }

      if (text.startsWith("bestmove")) {
        clearTimeout(timeout);
        worker.terminate();
        resolve(evalScore);
      }
    };

    worker.onerror = (err) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(err);
    };

    worker.postMessage("uci");
  });
}*/