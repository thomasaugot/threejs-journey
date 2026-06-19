import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// Best times persist across sessions, keyed by level.
const BEST_KEY = "portal-run-best-times";

function loadBestTimes() {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY)) || {};
  } catch {
    return {};
  }
}

function saveBestTimes(times) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(times));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

// Difficulty presets: starting block count, blocks added per level, obstacle
// speed ramp per level, and the speed cap. Read by Level/obstacles.
export const DIFFICULTIES = {
  easy: { label: "EASY", baseBlocks: 6, blocksPerLevel: 2, speedRamp: 0.08, speedCap: 1.8 },
  normal: { label: "NORMAL", baseBlocks: 8, blocksPerLevel: 3, speedRamp: 0.12, speedCap: 2.4 },
  brutal: { label: "BRUTAL", baseBlocks: 10, blocksPerLevel: 4, speedRamp: 0.18, speedCap: 3.2 },
};

export default create(
  subscribeWithSelector((set, get) => ({
    level: 1,
    difficulty: "brutal",
    blocksCount: DIFFICULTIES.brutal.baseBlocks,
    blocksSeed: 0,

    /**
     * Time
     */
    startTime: 0,
    endTime: 0,
    pausedAt: 0, // wall-clock when paused, to offset startTime on resume
    bestTimes: loadBestTimes(),

    /**
     * Phases: "menu" | "ready" | "playing" | "ended" | "paused"
     */
    phase: "menu",
    prevPhase: null, // phase to resume to after a pause

    // Pick difficulty (menu only). Resets blocksCount to that preset's base.
    setDifficulty: (difficulty) => {
      set((state) => {
        if (state.phase !== "menu" || !DIFFICULTIES[difficulty]) return {};
        return { difficulty, blocksCount: DIFFICULTIES[difficulty].baseBlocks };
      });
    },

    // Leave the start menu and enter the first level.
    play: () => {
      set((state) => {
        if (state.phase === "menu") {
          return { phase: "ready", level: 1, blocksCount: DIFFICULTIES[state.difficulty].baseBlocks };
        }
        return {};
      });
    },

    start: () => {
      set((state) => {
        if (state.phase === "ready") {
          return { phase: "playing", startTime: Date.now() };
        }
        return {};
      });
    },

    restart: () => {
      set((state) => {
        if (state.phase === "playing" || state.phase === "ended") {
          return { phase: "ready", blocksSeed: Math.random() };
        }
        return {};
      });
    },

    end: () => {
      set((state) => {
        if (state.phase === "playing") {
          const endTime = Date.now();
          const elapsed = (endTime - state.startTime) / 1000;

          // Record a new best time for this level if faster.
          const prevBest = state.bestTimes[state.level];
          let bestTimes = state.bestTimes;
          if (prevBest === undefined || elapsed < prevBest) {
            bestTimes = { ...state.bestTimes, [state.level]: elapsed };
            saveBestTimes(bestTimes);
          }

          return { phase: "ended", endTime, bestTimes };
        }
        return {};
      });
    },

    nextLevel: () => {
      set((state) => {
        if (state.phase === "ended") {
          return {
            phase: "ready",
            level: state.level + 1,
            blocksCount:
              state.blocksCount + DIFFICULTIES[state.difficulty].blocksPerLevel,
            blocksSeed: Math.random(),
          };
        }
        return {};
      });
    },

    // Pause/resume — only meaningful mid-run.
    pause: () => {
      set((state) => {
        if (state.phase === "playing" || state.phase === "ready") {
          return { phase: "paused", prevPhase: state.phase, pausedAt: Date.now() };
        }
        return {};
      });
    },

    resume: () => {
      set((state) => {
        if (state.phase !== "paused") return {};
        const prev = state.prevPhase || "ready";
        // Shift startTime forward by the paused duration so the timer doesn't
        // count the time spent paused.
        const startTime =
          prev === "playing"
            ? state.startTime + (Date.now() - state.pausedAt)
            : state.startTime;
        return { phase: prev, prevPhase: null, pausedAt: 0, startTime };
      });
    },
  })),
);
