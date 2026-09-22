import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
  random,
  Easing,
} from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import React from "react";

// ============================================
// CREATIVE DESIGN SYSTEM - Factumation Brand
// Based on frontend-design & brand-guidelines skills
// ============================================

// DISTINCTIVE COLOR PALETTE - Warm & Professional
const COLORS = {
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
};

// TYPOGRAPHY - Distinctive fonts
const FONTS = {
  heading: "'Poppins', system-ui, sans-serif",
  body: "'DM Sans', system-ui, sans-serif",
  mono: "'Space Mono', monospace",
};

// SPRING CONFIGS - From Remotion best practices
const SPRING_CONFIGS = {
  smooth: { damping: 200 },
  snappy: { damping: 20, stiffness: 200 },
  bouncy: { damping: 8 },
  heavy: { damping: 15, stiffness: 80, mass: 2 },
  elastic: { damping: 12, stiffness: 100 },
};

type FactumationPromoProps = {
  title: string;
  subtitle: string;
};

// ============================================
// ATMOSPHERIC BACKGROUND COMPONENTS
// ============================================

// Simple Gradient Background - Optimized for performance
const MeshGradientBackground: React.FC<{
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
const OrganicParticles: React.FC<{
  count?: number;
  color?: string;
  maxSize?: number;
}> = ({ count = 8, color = COLORS.accent.orange, maxSize = 12 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Limit particle count for performance
  const actualCount = Math.min(count, 10);

  const particles = React.useMemo(() => {
    return Array.from({ length: actualCount }, (_, i) => ({
      id: i,
      x: random(`particle-x-${i}`) * width,
      y: random(`particle-y-${i}`) * height,
      size: 6 + random(`particle-size-${i}`) * maxSize,
      speed: 0.3 + random(`particle-speed-${i}`) * 0.3,
      opacity: 0.15 + random(`particle-opacity-${i}`) * 0.2,
    }));
  }, [actualCount, width, height, maxSize]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p) => {
        const y = p.y - (frame * p.speed) % (height + 100);

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: p.x,
              top: y < -50 ? height + y : y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity: p.opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Decorative geometric shapes - Simplified (no rotation)
const GeometricAccents: React.FC<{
  variant?: "circles" | "lines" | "dots";
}> = ({ variant = "circles" }) => {
  if (variant === "circles") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {/* Large decorative circle - top right */}
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
        {/* Bottom left accent */}
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
// LOGO COMPONENT - Simplified for performance
// ============================================
const Logo: React.FC<{ size?: number; variant?: "light" | "dark" }> = ({
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
          boxShadow: `0 ${size * 0.15}px ${size * 0.4}px -${size * 0.08}px ${COLORS.dark}40`,
          border: `1px solid ${COLORS.accent.orange}30`,
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
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>
    </div>
  );
};

// ============================================
// ANIMATED TITLE - Simplified single block animation
// ============================================
const AnimatedTitle: React.FC<{
  text: string;
  startFrame?: number;
  color?: string;
}> = ({ text, startFrame = 0, color = COLORS.dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const y = interpolate(progress, [0, 1], [60, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        fontSize: 110,
        fontWeight: 800,
        color,
        fontFamily: FONTS.heading,
        letterSpacing: "-0.04em",
        transform: `translateY(${y}px)`,
        opacity,
        textShadow: `0 4px 40px ${COLORS.navy[900]}20`,
      }}
    >
      {text}
    </div>
  );
};

// ============================================
// TYPEWRITER SUBTITLE
// ============================================
const TypewriterSubtitle: React.FC<{
  text: string;
  startFrame?: number;
  color?: string;
}> = ({ text, startFrame = 0, color = COLORS.neutral[600] }) => {
  const frame = useCurrentFrame();

  const localFrame = frame - startFrame;
  const charsPerFrame = 0.6;
  const charsToShow = Math.min(Math.floor(localFrame * charsPerFrame), text.length);

  // Cursor blink (16 frames cycle)
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
        fontSize: 32,
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
          height: 36,
          backgroundColor: COLORS.accent.orange,
          marginLeft: 4,
          opacity: cursorOpacity,
          boxShadow: `0 0 15px ${COLORS.accent.orange}, 0 0 30px ${COLORS.accent.orange}50`,
          borderRadius: 2,
        }}
      />
    </div>
  );
};

// ============================================
// FEATURE CARD - Simplified for performance
// ============================================
const FeatureCard: React.FC<{
  icon: string;
  title: string;
  delay: number;
}> = ({ icon, title, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const scale = interpolate(progress, [0, 1], [0.9, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const y = interpolate(progress, [0, 1], [30, 0]);

  return (
    <div
      style={{
        backgroundColor: `${COLORS.light}f5`,
        padding: 32,
        borderRadius: 20,
        boxShadow: `0 20px 50px -12px ${COLORS.dark}15`,
        transform: `scale(${scale}) translateY(${y}px)`,
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        minWidth: 170,
        border: `1px solid ${COLORS.sand}`,
      }}
    >
      <div style={{ fontSize: 48 }}>{icon}</div>
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: COLORS.navy[900],
          fontFamily: FONTS.heading,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </span>
    </div>
  );
};

// ============================================
// CTA BUTTON - Simplified for performance
// ============================================
const CTAButton: React.FC<{ text: string; delay?: number }> = ({
  text,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  return (
    <div
      style={{
        transform: `scale(${progress})`,
        background: `linear-gradient(135deg, ${COLORS.accent.orange} 0%, ${COLORS.accent.orangeDark} 100%)`,
        color: COLORS.light,
        padding: "22px 56px",
        borderRadius: 100,
        fontSize: 24,
        fontWeight: 600,
        fontFamily: FONTS.heading,
        letterSpacing: "-0.01em",
        boxShadow: `0 20px 40px -12px ${COLORS.accent.orangeDark}80`,
        border: `1px solid ${COLORS.accent.orangeLight}30`,
      }}
    >
      {text}
    </div>
  );
};

// ============================================
// SCENES
// ============================================

const IntroScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.sand, COLORS.light]}
      />
      <OrganicParticles count={6} color={COLORS.accent.orange} maxSize={10} />
      <GeometricAccents variant="circles" />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        <Logo size={120} variant="dark" />
        <Sequence from={20} layout="none">
          <AnimatedTitle text="Factumation" color={COLORS.dark} />
        </Sequence>
        <Sequence from={70} layout="none">
          <TypewriterSubtitle
            text="Creez vos factures en quelques clics"
            color={COLORS.neutral[500]}
          />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { icon: "📄", title: "Factures" },
    { icon: "📝", title: "Devis" },
    { icon: "📧", title: "Email" },
    { icon: "💾", title: "PDF" },
  ];

  const titleProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.navy[900], COLORS.navy[800], COLORS.navy[700]]}
      />
      <OrganicParticles count={8} color={COLORS.accent.orange} maxSize={10} />

      {/* Decorative accent line */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 100,
          width: 80,
          height: 4,
          backgroundColor: COLORS.accent.orange,
          borderRadius: 2,
          opacity: titleProgress,
          boxShadow: `0 0 20px ${COLORS.accent.orange}`,
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.light,
            fontFamily: FONTS.heading,
            letterSpacing: "-0.03em",
            transform: `translateY(${interpolate(titleProgress, [0, 1], [40, 0])}px)`,
            opacity: titleProgress,
            textShadow: `0 4px 40px ${COLORS.dark}50`,
          }}
        >
          Tout ce dont vous avez besoin
        </div>

        <div style={{ display: "flex", gap: 32 }}>
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              delay={30 + index * 12}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const subtitleProgress = spring({
    frame: frame - 15,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.light, COLORS.sand]}
      />
      <OrganicParticles count={6} color={COLORS.accent.blue} maxSize={8} />
      <GeometricAccents variant="circles" />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 35,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: COLORS.dark,
            fontFamily: FONTS.heading,
            letterSpacing: "-0.04em",
            textAlign: "center",
            transform: `translateY(${interpolate(titleProgress, [0, 1], [35, 0])}px)`,
            opacity: titleProgress,
            textShadow: `0 4px 30px ${COLORS.navy[900]}15`,
          }}
        >
          Commencez gratuitement
        </div>

        <div
          style={{
            fontSize: 26,
            color: COLORS.neutral[500],
            fontFamily: FONTS.body,
            textAlign: "center",
            maxWidth: 700,
            opacity: subtitleProgress,
            transform: `translateY(${interpolate(subtitleProgress, [0, 1], [20, 0])}px)`,
          }}
        >
          Sans inscription &bull; Export PDF &bull; Multi-devises
        </div>

        <Sequence from={30} layout="none">
          <CTAButton text="Creer une facture →" delay={30} />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================
// MAIN COMPOSITION
// ============================================

export const FactumationPromo: React.FC<FactumationPromoProps> = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={180}>
        <IntroScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ config: SPRING_CONFIGS.smooth, durationInFrames: 25 })}
      />
      <TransitionSeries.Sequence durationInFrames={210}>
        <FeaturesScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 25 })}
      />
      <TransitionSeries.Sequence durationInFrames={240}>
        <CTAScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
