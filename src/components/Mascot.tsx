import { motion } from 'framer-motion'
import idleImg from '../assets/mascot/idle.png'
import happyImg from '../assets/mascot/happy.png'
import sadImg from '../assets/mascot/sad.png'
import waveImg from '../assets/mascot/wave.png'
import readingImg from '../assets/mascot/reading.png'
import listeningImg from '../assets/mascot/listening.png'
import typingImg from '../assets/mascot/typing.png'
import confusedImg from '../assets/mascot/confused.png'

export type MascotPose =
  | 'idle'
  | 'happy'
  | 'sad'
  | 'wave'
  | 'reading'
  | 'headphones'
  | 'typing'
  | 'thinking'
  | 'locked'

// 'headphones' and 'thinking' reuse the 'listening'/'confused' artwork —
// same characters, no separate files needed for those pose names.
const POSE_IMAGE: Record<MascotPose, string> = {
  idle: idleImg,
  happy: happyImg,
  sad: sadImg,
  wave: waveImg,
  reading: readingImg,
  headphones: listeningImg,
  typing: typingImg,
  thinking: confusedImg,
  locked: idleImg,
}

const POSE_ANIMATION: Record<MascotPose, { rotate: number[]; y: number[] }> = {
  idle: { rotate: [-2, 2, -2], y: [0, -4, 0] },
  happy: { rotate: [-6, 6, -6], y: [0, -14, 0] },
  sad: { rotate: [0, 0, 0], y: [0, 3, 0] },
  wave: { rotate: [-3, 3, -3], y: [0, -3, 0] },
  reading: { rotate: [-1, 1, -1], y: [0, -2, 0] },
  headphones: { rotate: [-2, 2, -2], y: [0, -3, 0] },
  typing: { rotate: [-1, 1, -1], y: [0, -2, 0] },
  thinking: { rotate: [-2, 2, -2], y: [0, -2, 0] },
  locked: { rotate: [0, 0, 0], y: [0, 0, 0] },
}

export function Mascot({ pose = 'idle', size = 120 }: { pose?: MascotPose; size?: number }) {
  const anim = POSE_ANIMATION[pose]
  const locked = pose === 'locked'

  return (
    <motion.img
      src={POSE_IMAGE[pose]}
      alt=""
      animate={anim}
      transition={{
        duration: pose === 'happy' ? 0.5 : 2,
        repeat: locked ? 0 : pose === 'idle' ? Infinity : 1,
        ease: 'easeInOut',
      }}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: locked ? 'grayscale(1) opacity(0.55)' : undefined,
      }}
    />
  )
}
