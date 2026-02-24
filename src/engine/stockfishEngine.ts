export type EngineLine = {
  multipv: number;
  cp: number | null;
  mate: number | null;
  pv: string;
};

export type EngineScore = {
  cp: number;
  isMate: boolean;
};

class StockfishEngine {
  private searchId = 0;
  private worker: Worker;
  private ready = false;
  private liveCallback?: (lines: EngineLine[]) => void;
  private results: Record<number, EngineLine> = {};
  private queue: (() => Promise<void>)[] = [];
  private running = false;

  constructor() {
    this.worker = new Worker(
      new URL("./stockfish.wasm.js", import.meta.url),
      { type: "module" }
    );

    this.worker.onmessage = this.handleMessage;
    this.worker.postMessage("uci");
  }

  private async runNext() {
    if (this.running || this.queue.length === 0) return;

    this.running = true;

    const job = this.queue.shift()!;
    await job();

    this.running = false;
    this.runNext();
  }

  private handleMessage = (e: MessageEvent) => {
    const text = String(e.data);

    if (text === "uciok") {
      this.worker.postMessage("isready");
      return;
    }

    if (text === "readyok") {
      this.ready = true;
      return;
    }

    if (text.includes(" multipv ")) {
      const multipvMatch = text.match(/multipv (\d+)/);
      const cpMatch = text.match(/score cp (-?\d+)/);
      const mateMatch = text.match(/score mate (-?\d+)/);
      const pvMatch = text.match(/ pv (.+)$/);

      if (multipvMatch && pvMatch) {
        const index = parseInt(multipvMatch[1], 10);

        this.results[index] = {
          multipv: index,
          cp: cpMatch ? parseInt(cpMatch[1], 10) : null,
          mate: mateMatch ? parseInt(mateMatch[1], 10) : null,
          pv: pvMatch[1],
        };

        if (this.liveCallback) {
          this.liveCallback(this.getSorted());
        }
      }
    }
  };

  private getSorted(): EngineLine[] {
    return Object.values(this.results).sort(
      (a, b) => a.multipv - b.multipv
    );
  }

  private prepare(fen: string, lines: number) {
    this.results = {};
    this.worker.postMessage("stop");
    this.worker.postMessage(`setoption name MultiPV value ${lines}`);
    this.worker.postMessage(`position fen ${fen}`);
  }

  async analyze(fen: string, depth = 18, lines = 1) {
    return new Promise<EngineLine[]>((resolve) => {

      this.queue.push(async () => {

        this.results = {};

        this.worker.postMessage("stop");
        this.worker.postMessage(`setoption name MultiPV value ${lines}`);
        this.worker.postMessage(`position fen ${fen}`);

        const handler = (e: MessageEvent) => {
          const text = String(e.data);

          if (text.includes(" multipv ")) {
            const multipvMatch = text.match(/multipv (\d+)/);
            const cpMatch = text.match(/score cp (-?\d+)/);
            const mateMatch = text.match(/score mate (-?\d+)/);
            const pvMatch = text.match(/ pv (.+)$/);

            if (multipvMatch && pvMatch) {
              const index = parseInt(multipvMatch[1], 10);

              this.results[index] = {
                multipv: index,
                cp: cpMatch ? parseInt(cpMatch[1], 10) : null,
                mate: mateMatch ? parseInt(mateMatch[1], 10) : null,
                pv: pvMatch[1],
              };
            }
          }

          if (text.startsWith("bestmove")) {
            this.worker.removeEventListener("message", handler);

            resolve(
              Object.values(this.results).sort(
                (a, b) => a.multipv - b.multipv
              )
            );
          }
        };

        this.worker.addEventListener("message", handler);
        this.worker.postMessage(`go depth ${depth}`);
      });

      this.runNext();
    });
  }

  async evaluate(fen: string, depth = 18): Promise<EngineScore> {
    const lines = await this.analyze(fen, depth, 1);
    const best = lines[0];

    if (!best) return { cp: 0, isMate: false };

    if (best.mate !== null) {
      return {
        cp: best.mate > 0 ? 10000 : -10000,
        isMate: true,
      };
    }

    return {
      cp: best.cp ?? 0,
      isMate: false,
    };
  }

  startLive(
    fen: string,
    lines: number,
    callback: (lines: EngineLine[]) => void
  ) {
    this.liveCallback = callback;
    this.prepare(fen, lines);
    this.worker.postMessage("go infinite");
  }

  stop() {
    this.liveCallback = undefined;
    this.worker.postMessage("stop");
  }
}

export const stockfishEngine = new StockfishEngine();