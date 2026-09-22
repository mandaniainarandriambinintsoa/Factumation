import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  random,
  Easing,
} from "remotion";
// Note: Easing is used in TypewriterText component
import React from "react";

// ============================================
// CREATIVE DESIGN SYSTEM - Factumation Brand
// Based on frontend-design & brand-guidelines skills
// ============================================

// DISTINCTIVE COLOR PALETTE - Warm & Professional
export const COLORS = {
  // Core Brand
  dark: "#141413",
  light: "#faf9f5",
  cream: "#f5f3ed",
  sand: "#e8e6dc",

  // Primary Navy
  navy: {
    50: "#f0f4f8",
    100: "#d9e4f0",
    200: "#b3c9e1",
    300: "#8caed2",
    400: "#6693c3",
    500: "#4078b4",
    600: "#335f90",
    700: "#26476c",
    800: "#1a2f48",
    900: "#0d1724",
    950: "#060b12",
  },

  // Accent - Warm Copper/Terracotta
  accent: {
    orange: "#d97757",
    orangeLight: "#e89a7f",
    orangeDark: "#b85c3f",
    blue: "#6a9bcc",
    green: "#788c5d",
    gold: "#c4a35a",
  },

  // Neutrals
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
  },

  // Semantic
  success: "#4ade80",
  warning: "#fbbf24",
  danger: "#f87171",
};

// TYPOGRAPHY - Distinctive fonts
export const FONTS = {
  heading: "'Poppins', system-ui, sans-serif",
  body: "'DM Sans', system-ui, sans-serif",
  mono: "'Space Mono', monospace",
};

// SPRING CONFIGS - From Remotion best practices
export const SPRING_CONFIGS = {
  smooth: { damping: 200 },
  snappy: { damping: 20, stiffness: 200 },
  bouncy: { damping: 8 },
  heavy: { damping: 15, stiffness: 80, mass: 2 },
  elastic: { damping: 12, stiffness: 100 },
};

// ============================================
// ATMOSPHERIC BACKGROUND COMPONENTS
// ============================================

// Simple Gradient Background - Optimized for performance
export const MeshGradientBackground: React.FC<{
  colors: string[];
  animate?: boolean;
  intensity?: number;
}> = ({ colors }) => {
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1] || colors[0]} 50%, ${colors[2] || colors[1] || colors[0]} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Floating Particles - Simplified for performance
export const OrganicParticles: React.FC<{
  count?: number;
  color?: string;
  maxSize?: number;
}> = ({ count = 8, color = COLORS.accent.orange, maxSize = 12 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Limit particle count for performance
  const actualCount = Math.min(count, 12);

  const particles = React.useMemo(() => {
    return Array.from({ length: actualCount }, (_, i) => ({
      id: i,
      x: random(`particle-x-${i}`) * width,
      y: random(`particle-y-${i}`) * height,
      size: 6 + random(`particle-size-${i}`) * maxSize,
      speed: 0.15 + random(`particle-speed-${i}`) * 0.25,
      phase: random(`particle-phase-${i}`) * Math.PI * 2,
      opacity: 0.15 + random(`particle-opacity-${i}`) * 0.25,
    }));
  }, [actualCount, width, height, maxSize]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p) => {
        const yOffset = ((frame + p.phase * 50) * p.speed) % (height + 100);
        const y = p.y - yOffset < -50 ? height + 50 - (yOffset % height) : p.y - yOffset;

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: p.x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: `${color}30`,
              opacity: p.opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Glowing Orb - Simplified
export const GlowingOrb: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  delay?: number;
}> = ({ x, y, size, color }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: 0.5,
      }}
    />
  );
};

// Decorative geometric shapes - Simplified (no rotation)
export const GeometricAccents: React.FC<{
  variant?: "circles" | "lines" | "dots";
}> = ({ variant = "circles" }) => {
  if (variant === "circles") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            right: -100,
            top: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: `2px solid ${COLORS.accent.orange}20`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -80,
            bottom: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.accent.blue}10 0%, transparent 70%)`,
          }}
        />
      </AbsoluteFill>
    );
  }

  return null;
};

// ============================================
// UI COMPONENTS
// ============================================

// Logo Component - Simplified
export const Logo: React.FC<{ size?: number; variant?: "light" | "dark" }> = ({
  size = 120,
  variant = "dark",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const bgColor = variant === "dark" ? COLORS.navy[900] : COLORS.light;
  const iconColor = variant === "dark" ? COLORS.light : COLORS.navy[900];

  return (
    <div style={{ transform: `scale(${scaleProgress})` }}>
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
          borderRadius: size * 0.22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 ${size * 0.12}px ${size * 0.3}px -${size * 0.06}px ${COLORS.dark}30`,
        }}
      >
        <svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>
    </div>
  );
};

// Animated Title - Simplified for performance
export const AnimatedTitle: React.FC<{
  text: string;
  startFrame?: number;
  color?: string;
  fontSize?: number;
}> = ({ text, startFrame = 0, color = COLORS.dark, fontSize = 110 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const y = interpolate(progress, [0, 1], [40, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        fontSize,
        fontWeight: 800,
        color,
        fontFamily: FONTS.heading,
        letterSpacing: "-0.04em",
        transform: `translateY(${y}px)`,
        opacity,
      }}
    >
      {text}
    </div>
  );
};

// Typewriter Text
export const TypewriterText: React.FC<{
  text: string;
  startFrame?: number;
  color?: string;
  fontSize?: number;
  cursorColor?: string;
}> = ({
  text,
  startFrame = 0,
  color = COLORS.neutral[600],
  fontSize = 32,
  cursorColor = COLORS.accent.orange,
}) => {
  const frame = useCurrentFrame();

  const localFrame = frame - startFrame;
  const charsPerFrame = 0.6;
  const charsToShow = Math.min(Math.floor(localFrame * charsPerFrame), text.length);

  const cursorOpacity = interpolate(
    localFrame % 16,
    [0, 7, 8, 15],
    [1, 1, 0, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const fadeIn = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        fontSize,
        color,
        fontWeight: 500,
        fontFamily: FONTS.body,
        display: "flex",
        alignItems: "center",
        opacity: fadeIn,
        letterSpacing: "-0.01em",
      }}
    >
      <span>{text.slice(0, charsToShow)}</span>
      <span
        style={{
          width: 3,
          height: fontSize * 1.1,
          backgroundColor: cursorColor,
          marginLeft: 4,
          opacity: cursorOpacity,
          boxShadow: `0 0 15px ${cursorColor}, 0 0 30px ${cursorColor}50`,
          borderRadius: 2,
        }}
      />
    </div>
  );
};

// Feature Card - Simplified
export const FeatureCard: React.FC<{
  icon: string;
  title: string;
  description?: string;
  delay: number;
  index?: number;
}> = ({ icon, title, description, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const y = interpolate(progress, [0, 1], [30, 0]);

  return (
    <div
      style={{
        backgroundColor: `${COLORS.light}f5`,
        padding: description ? 28 : 32,
        borderRadius: 20,
        boxShadow: `0 15px 40px -12px ${COLORS.dark}15`,
        transform: `translateY(${y}px)`,
        opacity,
        display: "flex",
        flexDirection: description ? "row" : "column",
        alignItems: description ? "flex-start" : "center",
        gap: description ? 20 : 14,
        minWidth: description ? 460 : 170,
        border: `1px solid ${COLORS.sand}`,
      }}
    >
      <div
        style={{
          width: description ? 56 : undefined,
          height: description ? 56 : undefined,
          background: description
            ? `linear-gradient(135deg, ${COLORS.cream} 0%, ${COLORS.sand} 100%)`
            : "none",
          borderRadius: description ? 14 : 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: description ? 28 : 48,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontSize: description ? 20 : 18,
            fontWeight: 700,
            color: COLORS.navy[900],
            fontFamily: FONTS.heading,
          }}
        >
          {title}
        </span>
        {description && (
          <span
            style={{
              fontSize: 15,
              color: COLORS.neutral[500],
              fontFamily: FONTS.body,
              lineHeight: 1.4,
            }}
          >
            {description}
          </span>
        )}
      </div>
    </div>
  );
};

// CTA Button - Simplified
export const CTAButton: React.FC<{
  text: string;
  delay?: number;
  variant?: "primary" | "secondary";
}> = ({ text, delay = 0, variant = "primary" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const isPrimary = variant === "primary";

  return (
    <div
      style={{
        transform: `scale(${progress})`,
        background: isPrimary
          ? `linear-gradient(135deg, ${COLORS.accent.orange} 0%, ${COLORS.accent.orangeDark} 100%)`
          : COLORS.light,
        color: isPrimary ? COLORS.light : COLORS.navy[900],
        padding: "22px 56px",
        borderRadius: 100,
        fontSize: 24,
        fontWeight: 600,
        fontFamily: FONTS.heading,
        boxShadow: isPrimary
          ? `0 15px 35px -10px ${COLORS.accent.orangeDark}70`
          : `0 10px 25px -10px ${COLORS.dark}15`,
        border: isPrimary ? "none" : `2px solid ${COLORS.sand}`,
      }}
    >
      {text}
    </div>
  );
};

// Section Title
export const SectionTitle: React.FC<{
  text: string;
  subtitle?: string;
  color?: string;
  subtitleColor?: string;
}> = ({
  text,
  subtitle,
  color = COLORS.dark,
  subtitleColor = COLORS.neutral[500],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const y = interpolate(titleSpring, [0, 1], [60, 0]);
  const opacity = interpolate(titleSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        transform: `translateY(${y}px)`,
        opacity,
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 800,
          color,
          fontFamily: FONTS.heading,
          letterSpacing: "-0.04em",
          textAlign: "center",
          textShadow: `0 4px 30px ${COLORS.navy[900]}15`,
        }}
      >
        {text}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 26,
            color: subtitleColor,
            fontFamily: FONTS.body,
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

// Accent Line Decoration
export const AccentLine: React.FC<{
  width?: number;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}> = ({ width = 80, position = "top-left" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame, fps, config: SPRING_CONFIGS.snappy });

  const positionStyles: Record<string, React.CSSProperties> = {
    "top-left": { top: 100, left: 100 },
    "top-right": { top: 100, right: 100 },
    "bottom-left": { bottom: 100, left: 100 },
    "bottom-right": { bottom: 100, right: 100 },
  };

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles[position],
        width: width * progress,
        height: 4,
        backgroundColor: COLORS.accent.orange,
        borderRadius: 2,
        boxShadow: `0 0 20px ${COLORS.accent.orange}`,
      }}
    />
  );
};
