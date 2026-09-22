import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
  Easing,
} from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import React from "react";
import {
  COLORS,
  FONTS,
  SPRING_CONFIGS,
  MeshGradientBackground,
  OrganicParticles,
  Logo,
} from "../design-system";

// ============================================================================
// DEMO-SPECIFIC COMPONENTS
// ============================================================================

// Mock Invoice Preview
const InvoicePreview: React.FC<{ progress: number }> = ({ progress }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = [
    { name: "Consultation", qty: 2, price: 150 },
    { name: "Developpement Web", qty: 1, price: 800 },
    { name: "Maintenance", qty: 3, price: 50 },
  ];

  const visibleItems = Math.floor(progress * items.length);
  const total = items
    .slice(0, visibleItems)
    .reduce((sum, item) => sum + item.qty * item.price, 0);

  const cardSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  const scale = interpolate(cardSpring, [0, 1], [0.9, 1]);
  const opacity = interpolate(cardSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        backgroundColor: `${COLORS.light}fb`,
        backdropFilter: "blur(20px)",
        borderRadius: 20,
        padding: 40,
        boxShadow: `
          0 30px 60px -15px ${COLORS.dark}18,
          0 0 0 1px ${COLORS.sand}
        `,
        width: 480,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        transform: `scale(${scale})`,
        opacity,
        fontFamily: FONTS.body,
        border: `1px solid ${COLORS.sand}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `2px solid ${COLORS.sand}`,
          paddingBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: COLORS.navy[900],
              fontFamily: FONTS.heading,
              letterSpacing: "-0.03em",
            }}
          >
            FACTURE
          </div>
          <div style={{ fontSize: 14, color: COLORS.neutral[500], marginTop: 4 }}>
            #2024-001
          </div>
        </div>
        <div
          style={{
            width: 56,
            height: 56,
            backgroundColor: COLORS.navy[900],
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 8px 24px -4px ${COLORS.navy[900]}50`,
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke={COLORS.light}
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.slice(0, visibleItems).map((item, index) => {
          const itemSpring = spring({
            frame: frame - index * 8,
            fps,
            config: SPRING_CONFIGS.snappy,
          });

          return (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: `1px solid ${COLORS.sand}80`,
                opacity: interpolate(itemSpring, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(itemSpring, [0, 1], [-20, 0])}px)`,
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.neutral[700] }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 13, color: COLORS.neutral[400], marginTop: 2 }}>
                  {item.qty} x {item.price} EUR
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy[900] }}>
                {item.qty * item.price} EUR
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      {visibleItems > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: `linear-gradient(135deg, ${COLORS.cream} 0%, ${COLORS.sand} 100%)`,
            padding: 20,
            borderRadius: 14,
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy[900] }}>
            Total
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: COLORS.navy[900],
              fontFamily: FONTS.heading,
              letterSpacing: "-0.02em",
            }}
          >
            {total} EUR
          </div>
        </div>
      )}
    </div>
  );
};

// Form Input Component with Typewriter
const FormInput: React.FC<{
  label: string;
  value: string;
  delay: number;
  typing?: boolean;
}> = ({ label, value, delay, typing = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const inputSpring = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const opacity = interpolate(inputSpring, [0, 1], [0, 1]);
  const x = interpolate(inputSpring, [0, 1], [-30, 0]);
  const scale = interpolate(inputSpring, [0, 1], [0.95, 1]);

  // Typewriter effect
  const charsPerFrame = 0.5;
  const typingStartFrame = delay + 10;
  const typedChars = typing
    ? Math.min(value.length, Math.floor((frame - typingStartFrame) * charsPerFrame))
    : value.length;
  const displayValue = typedChars > 0 ? value.slice(0, typedChars) : "";

  // Cursor blink
  const showCursor = typing && typedChars < value.length;
  const cursorOpacity = showCursor
    ? interpolate(frame % 16, [0, 7, 8, 15], [1, 1, 0, 0])
    : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transform: `translateX(${x}px) scale(${scale})`,
        opacity,
        fontFamily: FONTS.body,
      }}
    >
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.neutral[600],
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </label>
      <div
        style={{
          backgroundColor: COLORS.light,
          border: `2px solid ${COLORS.sand}`,
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 15,
          color: COLORS.neutral[700],
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.04)",
        }}
      >
        {displayValue}
        <span
          style={{
            width: 2,
            height: 20,
            backgroundColor: COLORS.accent.orange,
            marginLeft: 2,
            opacity: cursorOpacity,
            boxShadow: `0 0 8px ${COLORS.accent.orange}`,
            borderRadius: 1,
          }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// STEP SCENES
// ============================================================================

const Step1OpenApp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const browserScale = interpolate(browserSpring, [0, 1], [0.9, 1]);
  const browserOpacity = interpolate(browserSpring, [0, 1], [0, 1]);
  const browserY = interpolate(browserSpring, [0, 1], [30, 0]);

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.navy[900], COLORS.navy[800], COLORS.navy[700]]}
      />
      <OrganicParticles count={8} color={COLORS.accent.orange} maxSize={10} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            transform: `scale(${browserScale}) translateY(${browserY}px)`,
            opacity: browserOpacity,
            backgroundColor: COLORS.neutral[800],
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: `
              0 50px 100px -20px ${COLORS.dark}60,
              0 0 60px ${COLORS.accent.orange}15
            `,
          }}
        >
          {/* Browser Header */}
          <div
            style={{
              backgroundColor: COLORS.neutral[700],
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: COLORS.danger,
                }}
              />
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: COLORS.warning,
                }}
              />
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: COLORS.success,
                }}
              />
            </div>
            <div
              style={{
                backgroundColor: COLORS.neutral[800],
                borderRadius: 8,
                padding: "8px 16px",
                color: COLORS.neutral[400],
                fontSize: 13,
                fontFamily: FONTS.mono,
                flex: 1,
              }}
            >
              factumation.com
            </div>
          </div>
          {/* Browser Content */}
          <div
            style={{
              background: `linear-gradient(135deg, ${COLORS.cream} 0%, ${COLORS.light} 100%)`,
              padding: 60,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
              minWidth: 750,
              minHeight: 350,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: COLORS.navy[900],
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 12px 30px -8px ${COLORS.navy[900]}60`,
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={COLORS.light}
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: COLORS.dark,
                  fontFamily: FONTS.heading,
                  letterSpacing: "-0.04em",
                }}
              >
                Factumation
              </span>
            </div>
            <div
              style={{
                fontSize: 20,
                color: COLORS.neutral[500],
                fontFamily: FONTS.body,
              }}
            >
              Creez vos factures en quelques clics
            </div>
          </div>
        </div>
        <Sequence from={70} layout="none">
          <div
            style={{
              position: "absolute",
              bottom: 100,
              fontSize: 32,
              fontWeight: 700,
              color: COLORS.light,
              fontFamily: FONTS.heading,
              opacity: interpolate(frame - 70, [0, 20], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            Etape 1: Ouvrez Factumation
          </div>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Step2FillForm: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = Math.min(1, frame / (fps * 4));

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.light, COLORS.sand]}
      />
      <OrganicParticles count={6} color={COLORS.accent.blue} maxSize={8} />

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          gap: 80,
        }}
      >
        {/* Form Side */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            width: 380,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: COLORS.dark,
              fontFamily: FONTS.heading,
              marginBottom: 12,
              letterSpacing: "-0.03em",
            }}
          >
            Informations Client
          </div>
          <FormInput label="Nom" value="Dupont SARL" delay={0} typing />
          <FormInput label="Email" value="contact@dupont.fr" delay={25} typing />
          <FormInput label="Adresse" value="12 rue de Paris, 75001" delay={50} typing />
        </div>

        {/* Preview Side */}
        <InvoicePreview progress={progress} />

        <div
          style={{
            position: "absolute",
            bottom: 80,
            fontSize: 32,
            fontWeight: 700,
            color: COLORS.dark,
            fontFamily: FONTS.heading,
          }}
        >
          Etape 2: Remplissez les informations
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Step3AddItems: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = Math.min(1, frame / (fps * 3));

  const buttonSpring = spring({
    frame: frame - 60,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.light, COLORS.sand]}
      />
      <OrganicParticles count={6} color={COLORS.accent.green} maxSize={8} />

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          gap: 80,
        }}
      >
        {/* Items Form */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            width: 420,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: COLORS.dark,
              fontFamily: FONTS.heading,
              marginBottom: 12,
              letterSpacing: "-0.03em",
            }}
          >
            Ajouter des Lignes
          </div>
          <FormInput label="Description" value="Consultation" delay={0} typing />
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <FormInput label="Quantite" value="2" delay={20} typing />
            </div>
            <div style={{ flex: 1 }}>
              <FormInput label="Prix unitaire" value="150 EUR" delay={30} typing />
            </div>
          </div>
          <div
            style={{
              background: `linear-gradient(135deg, ${COLORS.accent.orange} 0%, ${COLORS.accent.orangeDark} 100%)`,
              color: COLORS.light,
              padding: "16px 28px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              fontFamily: FONTS.heading,
              textAlign: "center",
              marginTop: 16,
              transform: `scale(${interpolate(buttonSpring, [0, 1], [0.8, 1])})`,
              opacity: interpolate(buttonSpring, [0, 1], [0, 1]),
              boxShadow: `0 12px 30px -8px ${COLORS.accent.orangeDark}60`,
            }}
          >
            + Ajouter une ligne
          </div>
        </div>

        {/* Preview */}
        <InvoicePreview progress={progress} />

        <div
          style={{
            position: "absolute",
            bottom: 80,
            fontSize: 32,
            fontWeight: 700,
            color: COLORS.dark,
            fontFamily: FONTS.heading,
          }}
        >
          Etape 3: Ajoutez vos prestations
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Step4Export: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const buttons = [
    { icon: "💾", label: "Telecharger PDF", color: COLORS.accent.orange },
    { icon: "📧", label: "Envoyer par Email", color: COLORS.accent.blue },
    { icon: "💾", label: "Sauvegarder", color: COLORS.accent.green },
  ];

  const titleSpring = spring({
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

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          gap: 60,
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: COLORS.light,
            fontFamily: FONTS.heading,
            opacity: interpolate(titleSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
            textShadow: `0 4px 30px ${COLORS.dark}40`,
            letterSpacing: "-0.03em",
          }}
        >
          Exportez votre facture
        </div>

        <div style={{ display: "flex", gap: 32 }}>
          {buttons.map((button, index) => {
            const btnSpring = spring({
              frame: frame - 35 - index * 15,
              fps,
              config: SPRING_CONFIGS.snappy,
            });

            const scale = interpolate(btnSpring, [0, 1], [0.9, 1]);
            const opacity = interpolate(btnSpring, [0, 1], [0, 1]);
            const y = interpolate(btnSpring, [0, 1], [30, 0]);

            return (
              <div
                key={button.label}
                style={{
                  backgroundColor: `${COLORS.light}f8`,
                  padding: "36px 48px",
                  borderRadius: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  transform: `scale(${scale}) translateY(${y}px)`,
                  opacity,
                  boxShadow: `0 25px 50px -12px ${COLORS.dark}25`,
                  border: `1px solid ${COLORS.sand}`,
                }}
              >
                <span style={{ fontSize: 48 }}>{button.icon}</span>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: button.color,
                    fontFamily: FONTS.heading,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {button.label}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 80,
            fontSize: 32,
            fontWeight: 700,
            color: COLORS.light,
            fontFamily: FONTS.heading,
          }}
        >
          Etape 4: Exportez en un clic
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const FinalCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const buttonSpring = spring({
    frame: frame - 35,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.light, COLORS.sand]}
      />
      <OrganicParticles count={8} color={COLORS.accent.orange} maxSize={10} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            transform: `scale(${interpolate(titleSpring, [0, 1], [0.9, 1])})`,
            opacity: interpolate(titleSpring, [0, 1], [0, 1]),
          }}
        >
          <Logo size={100} variant="dark" />
          <span
            style={{
              fontSize: 76,
              fontWeight: 800,
              color: COLORS.dark,
              fontFamily: FONTS.heading,
              letterSpacing: "-0.04em",
            }}
          >
            Factumation
          </span>
        </div>

        <div
          style={{
            fontSize: 34,
            color: COLORS.neutral[500],
            fontFamily: FONTS.body,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          La solution simple et gratuite pour vos factures
        </div>

        <div
          style={{
            transform: `scale(${buttonSpring})`,
            background: `linear-gradient(135deg, ${COLORS.accent.orange} 0%, ${COLORS.accent.orangeDark} 100%)`,
            color: COLORS.light,
            padding: "26px 70px",
            borderRadius: 100,
            fontSize: 28,
            fontWeight: 700,
            fontFamily: FONTS.heading,
            letterSpacing: "-0.01em",
            boxShadow: `0 20px 40px -10px ${COLORS.accent.orangeDark}70`,
          }}
        >
          Commencer Maintenant →
        </div>

        <div
          style={{
            fontSize: 22,
            color: COLORS.neutral[400],
            fontFamily: FONTS.body,
            marginTop: 16,
          }}
        >
          factumation.com
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

export const FactumationDemo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={180}>
        <Step1OpenApp />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: SPRING_CONFIGS.snappy, durationInFrames: 30 })}
      />
      <TransitionSeries.Sequence durationInFrames={300}>
        <Step2FillForm />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ config: SPRING_CONFIGS.smooth, durationInFrames: 30 })}
      />
      <TransitionSeries.Sequence durationInFrames={300}>
        <Step3AddItems />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-bottom" })}
        timing={springTiming({ config: SPRING_CONFIGS.snappy, durationInFrames: 30 })}
      />
      <TransitionSeries.Sequence durationInFrames={240}>
        <Step4Export />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ config: SPRING_CONFIGS.smooth, durationInFrames: 30 })}
      />
      <TransitionSeries.Sequence durationInFrames={330}>
        <FinalCTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
