// Hook React que se suscribe al estado global de isPlaying del AudioEngine.

import { useEffect, useState } from "react";
import { subscribeIsPlaying } from "../audio/AudioEngine";

export function useIsPlaying() {
  const [playing, setPlaying] = useState(false);
  useEffect(() => subscribeIsPlaying(setPlaying), []);
  return playing;
}
