import { motion } from 'motion/react';

export default function TypingAnimation() {
  const dotVariants = {
    start: {
      y: '0%',
    },
    end: {
      y: '100%',
    },
  };

  const transitionValues = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut' as const,
  };

  return (
    <div className="flex items-center space-x-1.5 py-2 px-1">
      <motion.span
        className="block h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-500"
        variants={dotVariants}
        initial="start"
        animate="end"
        transition={{
          ...transitionValues,
          delay: 0,
        }}
      />
      <motion.span
        className="block h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-500"
        variants={dotVariants}
        initial="start"
        animate="end"
        transition={{
          ...transitionValues,
          delay: 0.15,
        }}
      />
      <motion.span
        className="block h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-500"
        variants={dotVariants}
        initial="start"
        animate="end"
        transition={{
          ...transitionValues,
          delay: 0.3,
        }}
      />
    </div>
  );
}
