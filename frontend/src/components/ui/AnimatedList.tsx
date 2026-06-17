import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  delay?: number;
  stagger?: number;
}

export default function AnimatedList({
  children,
  className = "",
  delay = 0,
  stagger = 0.1,
}: AnimatedListProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div className={className} variants={container} initial="hidden" animate="show">
      {children.map((child, index) => (
        <motion.div key={index} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
