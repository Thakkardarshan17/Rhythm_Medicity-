import React from 'react';
import { motion, Variants } from 'framer-motion';

export type AnimationType =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'scale-in'
  | 'blur-clear'
  | 'slide-in';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  viewportMargin?: string;
  staggerChildren?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 0.5,
  className = '',
  viewportMargin = '-50px',
  staggerChildren,
}) => {
  const getVariants = (): Variants => {
    switch (animation) {
      case 'fade-up':
        return {
          hidden: { opacity: 0, y: 30 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration, delay, ease: [0.16, 1, 0.3, 1], staggerChildren },
          },
        };
      case 'fade-down':
        return {
          hidden: { opacity: 0, y: -30 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
          },
        };
      case 'fade-left':
        return {
          hidden: { opacity: 0, x: -30 },
          visible: {
            opacity: 1,
            x: 0,
            transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
          },
        };
      case 'fade-right':
        return {
          hidden: { opacity: 0, x: 30 },
          visible: {
            opacity: 1,
            x: 0,
            transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
          },
        };
      case 'scale-in':
        return {
          hidden: { opacity: 0, scale: 0.94 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
          },
        };
      case 'blur-clear':
        return {
          hidden: { opacity: 0, filter: 'blur(10px)', y: 15 },
          visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: { duration: duration * 1.2, delay, ease: [0.16, 1, 0.3, 1] },
          },
        };
      case 'slide-in':
        return {
          hidden: { opacity: 0, x: -40 },
          visible: {
            opacity: 1,
            x: 0,
            transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
          },
        };
      default:
        return {
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration, delay, ease: 'easeOut' },
          },
        };
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: viewportMargin as any }}
      variants={getVariants()}
      className={className}
    >
      {children}
    </motion.div>
  );
};
