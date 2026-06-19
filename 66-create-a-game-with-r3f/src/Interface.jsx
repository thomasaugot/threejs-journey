import { useKeyboardControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import useGame, { DIFFICULTIES } from "./stores/useGame.js";
import { startMusic } from "./utils/audio.js";

function formatTime(seconds) {
  return seconds.toFixed(2);
}

export default function Interface() {
  const time = useRef();

  const forward = useKeyboardControls((state) => state.forward);
  const backward = useKeyboardControls((state) => state.backward);
  const leftward = useKeyboardControls((state) => state.leftward);
  const rightward = useKeyboardControls((state) => state.rightward);
  const jump = useKeyboardControls((state) => state.jump);

  const phase = useGame((state) => state.phase);
  const level = useGame((state) => state.level);
  const bestTimes = useGame((state) => state.bestTimes);
  const play = useGame((state) => state.play);
  const pause = useGame((state) => state.pause);
  const resume = useGame((state) => state.resume);
  const difficulty = useGame((state) => state.difficulty);
  const setDifficulty = useGame((state) => state.setDifficulty);

  const best = bestTimes[level];

  // Live timer via rAF (Interface lives outside the Canvas, so no useFrame).
  useEffect(() => {
    let frame;
    const tick = () => {
      const state = useGame.getState();
      let elapsedTime = 0;
      if (state.phase === "playing") {
        elapsedTime = Date.now() - state.startTime;
      } else if (state.phase === "ended") {
        elapsedTime = state.endTime - state.startTime;
      } else if (state.phase === "paused" && state.prevPhase === "playing") {
        elapsedTime = state.pausedAt - state.startTime;
      }
      elapsedTime /= 1000;
      if (time.current) time.current.textContent = elapsedTime.toFixed(2);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Esc toggles pause during a run.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== "Escape") return;
      const p = useGame.getState().phase;
      if (p === "paused") resume();
      else if (p === "playing" || p === "ready") pause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pause, resume]);

  // ---- Start menu ----
  if (phase === "menu") {
    // Sorted list of levels with recorded best times.
    const records = Object.keys(bestTimes)
      .map((lvl) => [Number(lvl), bestTimes[lvl]])
      .sort((a, b) => a[0] - b[0]);

    return (
      <div className="interface">
        <div className="menu">
          <h1 className="title">PORTAL RUN</h1>
          <p className="subtitle">Roll through the dimensions. Reach the portal.</p>

          <div className="difficulty">
            {Object.keys(DIFFICULTIES).map((key) => (
              <button
                key={key}
                className={`diff-btn ${difficulty === key ? "selected" : ""}`}
                onClick={() => setDifficulty(key)}
              >
                {DIFFICULTIES[key].label}
              </button>
            ))}
          </div>

          <button
            className="play-btn"
            onClick={() => {
              startMusic(); // user gesture unlocks audio
              play();
            }}
          >
            PLAY
          </button>

          {records.length > 0 && (
            <div className="records">
              <div className="records-title">BEST TIMES</div>
              {records.slice(0, 6).map(([lvl, t]) => (
                <div key={lvl} className="record-row">
                  <span>Dimension C-{136 + lvl}</span>
                  <span>{formatTime(t)}s</span>
                </div>
              ))}
            </div>
          )}

          <div className="legend">
            <span>WASD / Arrows — move</span>
            <span>Space — jump</span>
            <span>Esc — pause</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="interface">
      <div className="level">Dimension C-{136 + level}</div>

      <div ref={time} className="time">
        0.00
      </div>

      {best !== undefined && (
        <div className="best">BEST {formatTime(best)}</div>
      )}

      {phase === "ready" && (
        <div className="prompt">Press any key to open the portal</div>
      )}

      {phase === "ended" && <div className="restart">WUBBA LUBBA DUB DUB!</div>}

      {phase === "paused" && (
        <div className="pause-overlay">
          <h2 className="paused-title">PAUSED</h2>
          <button className="play-btn" onClick={resume}>
            RESUME
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        <div className="raw">
          <div className={`key ${forward ? "active" : ""}`}></div>
        </div>
        <div className="raw">
          <div className={`key ${leftward ? "active" : ""}`}></div>
          <div className={`key ${backward ? "active" : ""}`}></div>
          <div className={`key ${rightward ? "active" : ""}`}></div>
        </div>
        <div className="raw">
          <div className={`key large ${jump ? "active" : ""}`}></div>
        </div>
      </div>
    </div>
  );
}
