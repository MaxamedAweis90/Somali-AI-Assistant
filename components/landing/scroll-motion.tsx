"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type ScatterDirection = "up" | "down" | "left" | "right";

interface MotionSectionProps {
  children: ReactNode;
  className?: string;
  direction?: ScatterDirection;
  distance?: number;
  id?: string;
}

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  direction?: ScatterDirection;
  distance?: number;
}

interface FloatingAccentProps {
  className?: string;
  x?: number[];
  y?: number[];
  rotate?: number[];
  duration?: number;
  delay?: number;
}

function resolveAxis(direction: ScatterDirection, distance: number) {
  switch (direction) {
    case "up":
      return { x: [0, 0, 0, 0, 0], y: [distance, distance * 0.3, 0, -distance * 0.22, -distance * 0.75] };
    case "down":
      return { x: [0, 0, 0, 0, 0], y: [-distance, -distance * 0.3, 0, distance * 0.22, distance * 0.75] };
    case "left":
      return { x: [distance, distance * 0.25, 0, -distance * 0.22, -distance * 0.7], y: [26, 10, 0, -8, -22] };
    case "right":
      return { x: [-distance, -distance * 0.25, 0, distance * 0.22, distance * 0.7], y: [26, 10, 0, -8, -22] };
  }
}

function useMotionProfile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const updateProfile = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateProfile();
    mediaQuery.addEventListener("change", updateProfile);

    return () => {
      mediaQuery.removeEventListener("change", updateProfile);
    };
  }, []);

  return isMobile
    ? {
        sectionTranslateScale: 0.4,
        sectionRotateRange: 0.85,
        sectionOpacityMin: 0.5,
        sectionScaleMin: 0.985,
        cardTranslateScale: 0.34,
        cardOpacityMin: 0.56,
        cardScaleMin: 0.988,
      }
    : {
        sectionTranslateScale: 0.72,
        sectionRotateRange: 2,
        sectionOpacityMin: 0.34,
        sectionScaleMin: 0.97,
        cardTranslateScale: 0.68,
        cardOpacityMin: 0.38,
        cardScaleMin: 0.96,
      };
}

export function MotionSection({ children, className, direction = "up", distance = 120, id }: MotionSectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const profile = useMotionProfile();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "end 0.08"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 24,
    mass: 0.32,
  });
  const axis = resolveAxis(direction, distance);
  const opacity = useTransform(
    progress,
    [0, 0.18, 0.5, 0.82, 1],
    [profile.sectionOpacityMin, 0.82, 1, 0.86, profile.sectionOpacityMin]
  );
  const scale = useTransform(
    progress,
    [0, 0.18, 0.5, 0.82, 1],
    [profile.sectionScaleMin, 0.994, 1, 0.994, profile.sectionScaleMin]
  );
  const x = useTransform(
    progress,
    [0, 0.18, 0.5, 0.82, 1],
    axis.x.map((value) => value * profile.sectionTranslateScale)
  );
  const y = useTransform(
    progress,
    [0, 0.18, 0.5, 0.82, 1],
    axis.y.map((value) => value * profile.sectionTranslateScale)
  );
  const rotate = useTransform(
    progress,
    [0, 0.18, 0.5, 0.82, 1],
    [
      direction === "left" ? profile.sectionRotateRange : -profile.sectionRotateRange,
      direction === "left" ? profile.sectionRotateRange * 0.4 : -profile.sectionRotateRange * 0.4,
      0,
      direction === "left" ? -profile.sectionRotateRange * 0.4 : profile.sectionRotateRange * 0.4,
      direction === "left" ? -profile.sectionRotateRange : profile.sectionRotateRange,
    ]
  );

  return (
    <motion.section
      id={id}
      ref={ref}
      className={className}
      style={
        prefersReducedMotion
          ? undefined
          : {
              opacity,
              scale,
              x,
              y,
              rotate,
              willChange: "transform, opacity",
            }
      }
    >
      {children}
    </motion.section>
  );
}

export function MotionCard({ children, className, direction = "up", distance = 72 }: MotionCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const profile = useMotionProfile();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.96", "end 0.08"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 165,
    damping: 26,
    mass: 0.28,
  });
  const axis = resolveAxis(direction, distance);
  const opacity = useTransform(
    progress,
    [0, 0.22, 0.52, 0.82, 1],
    [profile.cardOpacityMin, 0.8, 1, 0.86, profile.cardOpacityMin]
  );
  const scale = useTransform(
    progress,
    [0, 0.22, 0.52, 0.82, 1],
    [profile.cardScaleMin, 0.995, 1, 0.994, profile.cardScaleMin]
  );
  const x = useTransform(
    progress,
    [0, 0.22, 0.52, 0.82, 1],
    axis.x.map((value) => value * profile.cardTranslateScale)
  );
  const y = useTransform(
    progress,
    [0, 0.22, 0.52, 0.82, 1],
    axis.y.map((value) => value * profile.cardTranslateScale)
  );

  return (
    <motion.div
      ref={ref}
      className={className}
      style={prefersReducedMotion ? undefined : { opacity, scale, x, y, willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

export function FloatingAccent({
  className,
  x = [0, 18, -10, 0],
  y = [0, -16, 10, 0],
  rotate = [0, 4, -3, 0],
  duration = 12,
  delay = 0,
}: FloatingAccentProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={cn("pointer-events-none absolute", className)} />;
  }

  return (
    <motion.div
      className={cn("pointer-events-none absolute", className)}
      animate={{ x, y, rotate }}
      transition={{
        duration,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "mirror",
        ease: "easeInOut",
        delay,
      }}
    />
  );
}