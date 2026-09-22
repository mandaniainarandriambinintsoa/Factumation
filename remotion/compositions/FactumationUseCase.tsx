import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
  Easing,
  random,
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
// USE CASE DATA - Scénario réaliste
// ============================================================================
const USE_CASE_DATA = {
  emitter: {
    name: "TechSolutions SARL",
    address: "45 Avenue des Champs-Élysées",
    city: "75008 Paris, France",
    siret: "123 456 789 00012",
    tva: "FR 12 345678901",
    email: "contact@techsolutions.fr",
    phone: "+33 1 23 45 67 89",
  },
  client: {
    name: "Dupont & Associés",
    address: "12 Rue de la Paix",
    city: "69001 Lyon, France",
    email: "facturation@dupont-associes.fr",
  },
  invoice: {
    number: "FAC-2024-0042",
    date: "15 Janvier 2024",
    dueDate: "15 Février 2024",
  },
  items: [
    { description: "Développement site web e-commerce", quantity: 1, unitPrice: 4500, unit: "forfait" },
    { description: "Design UI/UX responsive", quantity: 40, unitPrice: 85, unit: "heures" },
    { description: "Intégration API paiement", quantity: 1, unitPrice: 1200, unit: "forfait" },
    { description: "Formation utilisateur", quantity: 8, unitPrice: 120, unit: "heures" },
  ],
  tvaRate: 20,
};

// ============================================================================
// SHARED COMPONENTS (re-exported from design system + local ones)
// ============================================================================

// ============================================================================
// TYPEWRITER INPUT COMPONENT
// ============================================================================
const TypewriterInput: React.FC<{
  label: string;
  value: string;
  startFrame: number;
  typingSpeed?: number;
  width?: number | string;
  showLabel?: boolean;
  isFocused?: boolean;
}> = ({ label, value, startFrame, typingSpeed = 0.8, width = "100%", showLabel = true, isFocused = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const inputSpring = spring({
    frame: frame - startFrame + 10,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const typedChars = Math.min(value.length, Math.max(0, Math.floor((frame - startFrame) * typingSpeed)));
  const displayValue = value.slice(0, typedChars);
  const isTyping = typedChars < value.length && frame >= startFrame;

  // Cursor blink
  const cursorOpacity = isTyping ? interpolate(frame % 16, [0, 7, 8, 15], [1, 1, 0, 0]) : 0;

  const focusGlow = isFocused || isTyping;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width,
        opacity: interpolate(inputSpring, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(inputSpring, [0, 1], [10, 0])}px)`,
        fontFamily: FONTS.body,
      }}
    >
      {showLabel && (
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
      )}
      <div
        style={{
          backgroundColor: COLORS.light,
          border: `2px solid ${focusGlow ? COLORS.accent.orange : COLORS.sand}`,
          borderRadius: 10,
          padding: "12px 14px",
          fontSize: 15,
          color: COLORS.neutral[700],
          minHeight: 20,
          display: "flex",
          alignItems: "center",
          boxShadow: focusGlow
            ? `0 0 0 3px ${COLORS.accent.orange}20, 0 2px 8px -2px rgba(0,0,0,0.08)`
            : "0 2px 8px -2px rgba(0,0,0,0.05)",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        <span>{displayValue}</span>
        <span
          style={{
            width: 2,
            height: 18,
            backgroundColor: COLORS.accent.orange,
            marginLeft: 1,
            opacity: cursorOpacity,
            borderRadius: 1,
            boxShadow: `0 0 8px ${COLORS.accent.orange}`,
          }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// ANIMATED CURSOR
// ============================================================================
const AnimatedCursor: React.FC<{
  x: number;
  y: number;
  clicking?: boolean;
  visible?: boolean;
}> = ({ x, y, clicking = false, visible = true }) => {
  const frame = useCurrentFrame();

  if (!visible) return null;

  const clickScale = clicking ? 0.85 : 1;
  const wobble = Math.sin(frame * 0.1) * 2;

  return (
    <div
      style={{
        position: "absolute",
        left: x + wobble,
        top: y,
        transform: `scale(${clickScale})`,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
          fill={COLORS.light}
          stroke={COLORS.neutral[800]}
          strokeWidth="1.5"
        />
      </svg>
      {clicking && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 30,
            height: 30,
            borderRadius: "50%",
            backgroundColor: `${COLORS.accent.orange}30`,
            transform: "translate(-3px, -3px)",
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// INVOICE PREVIEW COMPONENT
// ============================================================================
const InvoicePreview: React.FC<{
  showEmitter: boolean;
  showClient: boolean;
  visibleItems: number;
  showTotals: boolean;
  scale?: number;
}> = ({ showEmitter, showClient, visibleItems, showTotals, scale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const previewSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  const items = USE_CASE_DATA.items.slice(0, visibleItems);
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tva = subtotal * (USE_CASE_DATA.tvaRate / 100);
  const total = subtotal + tva;

  return (
    <div
      style={{
        backgroundColor: `${COLORS.light}fb`,
        backdropFilter: "blur(20px)",
        borderRadius: 20,
        padding: 32,
        boxShadow: `
          0 30px 60px -15px ${COLORS.dark}18,
          0 0 0 1px ${COLORS.sand}
        `,
        width: 480,
        transform: `scale(${scale * interpolate(previewSpring, [0, 1], [0.95, 1])})`,
        opacity: interpolate(previewSpring, [0, 1], [0, 1]),
        fontFamily: FONTS.body,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        border: `1px solid ${COLORS.sand}`,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.navy[900], fontFamily: FONTS.heading, letterSpacing: "-0.03em" }}>
            FACTURE
          </div>
          <div style={{ fontSize: 13, color: COLORS.neutral[500], marginTop: 4 }}>
            {USE_CASE_DATA.invoice.number}
          </div>
        </div>
        <div
          style={{
            width: 50,
            height: 50,
            backgroundColor: COLORS.navy[900],
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 8px 24px -4px ${COLORS.navy[900]}50`,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COLORS.light} strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
      </div>

      {/* Dates */}
      <div style={{ display: "flex", gap: 24, fontSize: 12, color: COLORS.neutral[500] }}>
        <div>
          <span style={{ fontWeight: 600 }}>Date:</span> {USE_CASE_DATA.invoice.date}
        </div>
        <div>
          <span style={{ fontWeight: 600 }}>Echeance:</span> {USE_CASE_DATA.invoice.dueDate}
        </div>
      </div>

      {/* Emitter & Client */}
      <div style={{ display: "flex", gap: 20 }}>
        {/* Emitter */}
        <div
          style={{
            flex: 1,
            padding: 14,
            background: `linear-gradient(135deg, ${COLORS.cream} 0%, ${COLORS.sand}40 100%)`,
            borderRadius: 10,
            opacity: showEmitter ? 1 : 0.3,
            transition: "opacity 0.3s",
            border: `1px solid ${COLORS.sand}80`,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.neutral[400], marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Emetteur
          </div>
          {showEmitter ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy[900] }}>{USE_CASE_DATA.emitter.name}</div>
              <div style={{ fontSize: 11, color: COLORS.neutral[500], marginTop: 4, lineHeight: 1.4 }}>
                {USE_CASE_DATA.emitter.address}<br />
                {USE_CASE_DATA.emitter.city}<br />
                SIRET: {USE_CASE_DATA.emitter.siret}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: COLORS.neutral[400], fontStyle: "italic" }}>En attente...</div>
          )}
        </div>

        {/* Client */}
        <div
          style={{
            flex: 1,
            padding: 14,
            background: `linear-gradient(135deg, ${COLORS.accent.orange}10 0%, ${COLORS.accent.orange}05 100%)`,
            borderRadius: 10,
            opacity: showClient ? 1 : 0.3,
            transition: "opacity 0.3s",
            border: `1px solid ${COLORS.accent.orange}20`,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.accent.orange, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Client
          </div>
          {showClient ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy[900] }}>{USE_CASE_DATA.client.name}</div>
              <div style={{ fontSize: 11, color: COLORS.neutral[500], marginTop: 4, lineHeight: 1.4 }}>
                {USE_CASE_DATA.client.address}<br />
                {USE_CASE_DATA.client.city}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: COLORS.neutral[400], fontStyle: "italic" }}>En attente...</div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div style={{ marginTop: 8 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 0.8fr 1fr 1fr",
            gap: 8,
            padding: "10px 12px",
            backgroundColor: COLORS.navy[900],
            borderRadius: "10px 10px 0 0",
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.light,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          <div>Description</div>
          <div style={{ textAlign: "center" }}>Qte</div>
          <div style={{ textAlign: "right" }}>P.U. HT</div>
          <div style={{ textAlign: "right" }}>Total HT</div>
        </div>

        <div style={{ border: `1px solid ${COLORS.sand}`, borderTop: "none", borderRadius: "0 0 10px 10px" }}>
          {items.length > 0 ? (
            items.map((item, index) => {
              const itemSpring = spring({
                frame: frame - index * 8,
                fps,
                config: SPRING_CONFIGS.snappy,
              });

              return (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 0.8fr 1fr 1fr",
                    gap: 8,
                    padding: "12px",
                    borderBottom: index < items.length - 1 ? `1px solid ${COLORS.sand}80` : "none",
                    fontSize: 12,
                    color: COLORS.neutral[700],
                    opacity: interpolate(itemSpring, [0, 1], [0, 1]),
                    transform: `translateX(${interpolate(itemSpring, [0, 1], [-10, 0])}px)`,
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{item.description}</div>
                  <div style={{ textAlign: "center", color: COLORS.neutral[500] }}>{item.quantity}</div>
                  <div style={{ textAlign: "right", color: COLORS.neutral[500] }}>{item.unitPrice.toLocaleString('fr-FR')} EUR</div>
                  <div style={{ textAlign: "right", fontWeight: 600, color: COLORS.navy[900] }}>
                    {(item.quantity * item.unitPrice).toLocaleString('fr-FR')} EUR
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: 20, textAlign: "center", color: COLORS.neutral[400], fontSize: 12, fontStyle: "italic" }}>
              Ajoutez des lignes...
            </div>
          )}
        </div>
      </div>

      {/* Totals */}
      {showTotals && items.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: 200,
              padding: 16,
              background: `linear-gradient(135deg, ${COLORS.cream} 0%, ${COLORS.sand} 100%)`,
              borderRadius: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.neutral[600], marginBottom: 8 }}>
              <span>Sous-total HT</span>
              <span style={{ fontWeight: 600 }}>{subtotal.toLocaleString('fr-FR')} EUR</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.neutral[600], marginBottom: 8 }}>
              <span>TVA ({USE_CASE_DATA.tvaRate}%)</span>
              <span style={{ fontWeight: 600 }}>{tva.toLocaleString('fr-FR')} EUR</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 16,
                fontWeight: 800,
                color: COLORS.navy[900],
                fontFamily: FONTS.heading,
                paddingTop: 10,
                borderTop: `2px solid ${COLORS.accent.orange}40`,
                marginTop: 4,
              }}
            >
              <span>Total TTC</span>
              <span>{total.toLocaleString('fr-FR')} EUR</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// FORM PANEL COMPONENT
// ============================================================================
const FormPanel: React.FC<{
  title: string;
  children: React.ReactNode;
  active?: boolean;
}> = ({ title, children, active = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  return (
    <div
      style={{
        backgroundColor: `${COLORS.light}f8`,
        backdropFilter: "blur(20px)",
        borderRadius: 20,
        padding: 28,
        boxShadow: active
          ? `0 25px 50px -12px ${COLORS.dark}15, 0 0 0 2px ${COLORS.accent.orange}60`
          : `0 15px 40px -12px ${COLORS.dark}10`,
        width: 380,
        opacity: interpolate(panelSpring, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(panelSpring, [0, 1], [20, 0])}px)`,
        fontFamily: FONTS.body,
        border: `1px solid ${COLORS.sand}`,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: COLORS.navy[900],
          fontFamily: FONTS.heading,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
          letterSpacing: "-0.02em",
        }}
      >
        {active && (
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: COLORS.success,
              boxShadow: `0 0 12px ${COLORS.success}`,
            }}
          />
        )}
        {title}
      </div>
      {children}
    </div>
  );
};

// ============================================================================
// BUTTON COMPONENT
// ============================================================================
const ActionButton: React.FC<{
  label: string;
  icon?: string;
  primary?: boolean;
  startFrame: number;
  onClick?: boolean;
}> = ({ label, icon, primary = false, startFrame, onClick = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const btnSpring = spring({
    frame: frame - startFrame,
    fps,
    config: SPRING_CONFIGS.bouncy,
  });

  const clickEffect = onClick ? 0.95 : 1;

  return (
    <div
      style={{
        background: primary
          ? `linear-gradient(135deg, ${COLORS.accent.orange} 0%, ${COLORS.accent.orangeDark} 100%)`
          : COLORS.light,
        color: primary ? COLORS.light : COLORS.neutral[700],
        border: primary ? "none" : `2px solid ${COLORS.sand}`,
        padding: "14px 24px",
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 600,
        fontFamily: FONTS.heading,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        cursor: "pointer",
        boxShadow: primary
          ? `0 12px 30px -8px ${COLORS.accent.orangeDark}60`
          : "0 4px 12px -4px rgba(0, 0, 0, 0.06)",
        transform: `scale(${interpolate(btnSpring, [0, 1], [0.8, 1]) * clickEffect})`,
        opacity: interpolate(btnSpring, [0, 1], [0, 1]),
      }}
    >
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      {label}
    </div>
  );
};

// ============================================================================
// SCENE 1: INTRO
// ============================================================================
const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const subtitleSpring = spring({
    frame: frame - 20,
    fps,
    config: SPRING_CONFIGS.smooth,
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
          gap: 30,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            transform: `scale(${interpolate(titleSpring, [0, 1], [0.8, 1])})`,
            opacity: interpolate(titleSpring, [0, 1], [0, 1]),
          }}
        >
          <Logo size={90} variant="light" />
          <span
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: COLORS.light,
              fontFamily: FONTS.heading,
              letterSpacing: "-0.04em",
              textShadow: `0 4px 30px ${COLORS.dark}40`,
            }}
          >
            Factumation
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 30,
            fontFamily: FONTS.body,
            color: COLORS.navy[200],
            opacity: interpolate(subtitleSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(subtitleSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          Creez une facture professionnelle en 2 minutes
        </div>

        {/* Play indicator */}
        <Sequence from={60}>
          <div
            style={{
              marginTop: 40,
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: COLORS.light,
              fontSize: 18,
              fontFamily: FONTS.body,
              opacity: interpolate(frame - 60, [0, 30], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                background: `${COLORS.accent.orange}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
                border: `1px solid ${COLORS.accent.orange}40`,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={COLORS.light}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            Demonstration en direct
          </div>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 2: EMITTER INFO
// ============================================================================
const SceneEmitterInfo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.light, COLORS.sand]}
        intensity={0.5}
      />
      <OrganicParticles count={6} color={COLORS.accent.blue} maxSize={8} />

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          padding: 60,
        }}
      >
        {/* Form */}
        <FormPanel title="1. Informations de l'emetteur" active={true}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <TypewriterInput
              label="Nom de la societe"
              value={USE_CASE_DATA.emitter.name}
              startFrame={10}
              typingSpeed={0.9}
            />
            <TypewriterInput
              label="Adresse"
              value={USE_CASE_DATA.emitter.address}
              startFrame={50}
              typingSpeed={1}
            />
            <TypewriterInput
              label="Ville"
              value={USE_CASE_DATA.emitter.city}
              startFrame={90}
              typingSpeed={1}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <TypewriterInput
                label="SIRET"
                value={USE_CASE_DATA.emitter.siret}
                startFrame={130}
                typingSpeed={1.2}
                width="50%"
              />
              <TypewriterInput
                label="N TVA"
                value={USE_CASE_DATA.emitter.tva}
                startFrame={160}
                typingSpeed={1.2}
                width="50%"
              />
            </div>
          </div>
        </FormPanel>

        {/* Preview */}
        <InvoicePreview
          showEmitter={frame > 180}
          showClient={false}
          visibleItems={0}
          showTotals={false}
          scale={0.9}
        />

        {/* Cursor */}
        <AnimatedCursor
          x={interpolate(frame, [0, 50, 90, 130, 170], [300, 280, 280, 240, 350], { extrapolateRight: "clamp" })}
          y={interpolate(frame, [0, 50, 90, 130, 170], [280, 340, 400, 460, 460], { extrapolateRight: "clamp" })}
          visible={frame < 200}
        />
      </AbsoluteFill>

      {/* Step indicator */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${COLORS.accent.orange} 0%, ${COLORS.accent.orangeDark} 100%)`,
            color: COLORS.light,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 18,
            fontFamily: FONTS.heading,
            boxShadow: `0 8px 20px -4px ${COLORS.accent.orangeDark}50`,
          }}
        >
          1
        </div>
        <span style={{ fontSize: 20, fontWeight: 600, color: COLORS.navy[900], fontFamily: FONTS.heading }}>
          Informations emetteur
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 3: CLIENT INFO
// ============================================================================
const SceneClientInfo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.light, COLORS.sand]}
        intensity={0.5}
      />
      <OrganicParticles count={6} color={COLORS.accent.green} maxSize={8} />

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          padding: 60,
        }}
      >
        {/* Form */}
        <FormPanel title="2. Informations du client" active={true}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <TypewriterInput
              label="Nom du client"
              value={USE_CASE_DATA.client.name}
              startFrame={10}
              typingSpeed={0.8}
            />
            <TypewriterInput
              label="Adresse"
              value={USE_CASE_DATA.client.address}
              startFrame={50}
              typingSpeed={0.9}
            />
            <TypewriterInput
              label="Ville"
              value={USE_CASE_DATA.client.city}
              startFrame={85}
              typingSpeed={1}
            />
            <TypewriterInput
              label="Email"
              value={USE_CASE_DATA.client.email}
              startFrame={120}
              typingSpeed={1.1}
            />
          </div>
        </FormPanel>

        {/* Preview */}
        <InvoicePreview
          showEmitter={true}
          showClient={frame > 150}
          visibleItems={0}
          showTotals={false}
          scale={0.9}
        />

        {/* Cursor */}
        <AnimatedCursor
          x={interpolate(frame, [0, 50, 85, 120], [300, 280, 280, 280], { extrapolateRight: "clamp" })}
          y={interpolate(frame, [0, 50, 85, 120], [280, 340, 400, 460], { extrapolateRight: "clamp" })}
          visible={frame < 170}
        />
      </AbsoluteFill>

      {/* Step indicator */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${COLORS.accent.orange} 0%, ${COLORS.accent.orangeDark} 100%)`,
            color: COLORS.light,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 18,
            fontFamily: FONTS.heading,
            boxShadow: `0 8px 20px -4px ${COLORS.accent.orangeDark}50`,
          }}
        >
          2
        </div>
        <span style={{ fontSize: 20, fontWeight: 600, color: COLORS.navy[900], fontFamily: FONTS.heading }}>
          Informations client
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 4: ADD ITEMS
// ============================================================================
const SceneAddItems: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Calculate visible items based on frame
  const itemTimings = [0, 100, 200, 300];
  const visibleItems = itemTimings.filter(t => frame > t).length;

  const currentItem = USE_CASE_DATA.items[Math.min(visibleItems, USE_CASE_DATA.items.length - 1)];
  const itemStartFrame = itemTimings[Math.min(visibleItems, itemTimings.length - 1)] || 0;

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.light, COLORS.sand]}
        intensity={0.5}
      />
      <OrganicParticles count={6} color={COLORS.accent.orange} maxSize={8} />

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          padding: 60,
        }}
      >
        {/* Form */}
        <FormPanel title="3. Ajouter des prestations" active={true}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <TypewriterInput
              label="Description"
              value={currentItem?.description || ""}
              startFrame={itemStartFrame + 5}
              typingSpeed={1}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <TypewriterInput
                label="Quantite"
                value={String(currentItem?.quantity || "")}
                startFrame={itemStartFrame + 40}
                typingSpeed={2}
                width="30%"
              />
              <TypewriterInput
                label="Prix unitaire"
                value={`${currentItem?.unitPrice || ""} EUR`}
                startFrame={itemStartFrame + 55}
                typingSpeed={1.5}
                width="40%"
              />
              <TypewriterInput
                label="Unite"
                value={currentItem?.unit || ""}
                startFrame={itemStartFrame + 70}
                typingSpeed={1.5}
                width="30%"
              />
            </div>
            <ActionButton
              label="+ Ajouter la ligne"
              primary={true}
              startFrame={itemStartFrame + 85}
              onClick={frame > itemStartFrame + 90 && frame < itemStartFrame + 95}
            />
          </div>

          {/* Items counter */}
          <div
            style={{
              marginTop: 20,
              padding: 14,
              background: `linear-gradient(135deg, ${COLORS.cream} 0%, ${COLORS.sand} 100%)`,
              borderRadius: 10,
              fontSize: 14,
              color: COLORS.neutral[600],
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: FONTS.body,
            }}
          >
            <span style={{ fontSize: 18 }}>📋</span>
            {visibleItems} ligne{visibleItems > 1 ? "s" : ""} ajoutee{visibleItems > 1 ? "s" : ""}
          </div>
        </FormPanel>

        {/* Preview */}
        <InvoicePreview
          showEmitter={true}
          showClient={true}
          visibleItems={visibleItems}
          showTotals={visibleItems > 0}
          scale={0.85}
        />

        {/* Cursor */}
        <AnimatedCursor
          x={250}
          y={interpolate(frame % 100, [0, 40, 55, 70, 90], [280, 350, 350, 350, 420], { extrapolateRight: "clamp" })}
          visible={true}
          clicking={frame % 100 > 90 && frame % 100 < 95}
        />
      </AbsoluteFill>

      {/* Step indicator */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${COLORS.accent.orange} 0%, ${COLORS.accent.orangeDark} 100%)`,
            color: COLORS.light,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 18,
            fontFamily: FONTS.heading,
            boxShadow: `0 8px 20px -4px ${COLORS.accent.orangeDark}50`,
          }}
        >
          3
        </div>
        <span style={{ fontSize: 20, fontWeight: 600, color: COLORS.navy[900], fontFamily: FONTS.heading }}>
          Ajouter les prestations
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 5: EXPORT
// ============================================================================
const SceneExport: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const buttonClicked = frame > 80;
  const downloadStarted = frame > 100;
  const downloadComplete = frame > 160;

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.navy[900], COLORS.navy[800], COLORS.navy[700]]}
      />
      <OrganicParticles count={8} color={COLORS.accent.orange} maxSize={10} />

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 80,
          padding: 60,
        }}
      >
        {/* Invoice Preview */}
        <div style={{ position: "relative" }}>
          <InvoicePreview
            showEmitter={true}
            showClient={true}
            visibleItems={4}
            showTotals={true}
            scale={0.85}
          />

          {/* Success overlay */}
          {downloadComplete && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: `${COLORS.success}20`,
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(2px)",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: COLORS.success,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 15px 40px -8px ${COLORS.success}50`,
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={COLORS.light} strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Export Options */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: COLORS.light,
              fontFamily: FONTS.heading,
              letterSpacing: "-0.03em",
              marginBottom: 12,
              textShadow: `0 4px 20px ${COLORS.dark}40`,
            }}
          >
            4. Exporter la facture
          </div>

          {/* Download button */}
          <div
            style={{
              backgroundColor: `${COLORS.light}f8`,
              backdropFilter: "blur(20px)",
              padding: 26,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              gap: 20,
              cursor: "pointer",
              boxShadow: buttonClicked
                ? `0 8px 25px -8px ${COLORS.dark}20`
                : `0 20px 50px -12px ${COLORS.dark}25`,
              transform: `scale(${buttonClicked ? 0.98 : 1})`,
              transition: "transform 0.1s, box-shadow 0.1s",
              border: `1px solid ${COLORS.sand}`,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${COLORS.accent.orange} 0%, ${COLORS.accent.orangeDark} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 8px 20px -4px ${COLORS.accent.orangeDark}50`,
              }}
            >
              <span style={{ fontSize: 28 }}>📄</span>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy[900], fontFamily: FONTS.heading }}>
                Telecharger en PDF
              </div>
              <div style={{ fontSize: 15, color: COLORS.neutral[500], marginTop: 4, fontFamily: FONTS.body }}>
                Facture professionnelle prete a envoyer
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {downloadStarted && !downloadComplete && (
            <div
              style={{
                backgroundColor: `${COLORS.light}20`,
                borderRadius: 10,
                padding: 5,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: 10,
                  borderRadius: 5,
                  background: `linear-gradient(90deg, ${COLORS.success} 0%, ${COLORS.accent.green} 100%)`,
                  width: `${interpolate(frame - 100, [0, 60], [0, 100], { extrapolateRight: "clamp" })}%`,
                  boxShadow: `0 0 25px ${COLORS.success}`,
                }}
              />
            </div>
          )}

          {/* Success message */}
          {downloadComplete && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: COLORS.success,
                fontSize: 20,
                fontWeight: 600,
                fontFamily: FONTS.body,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Facture telechargee avec succes !
            </div>
          )}

          {/* Other options */}
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            <ActionButton label="📧 Envoyer par email" startFrame={40} />
            <ActionButton label="💾 Sauvegarder" startFrame={55} />
          </div>
        </div>

        {/* Cursor */}
        <AnimatedCursor
          x={680}
          y={350}
          visible={frame < 100}
          clicking={frame > 78 && frame < 82}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 6: OUTRO
// ============================================================================
const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const statsSpring = spring({
    frame: frame - 30,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  const ctaSpring = spring({
    frame: frame - 60,
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
        {/* Logo and Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            transform: `scale(${interpolate(titleSpring, [0, 1], [0.8, 1])})`,
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
              textShadow: `0 4px 30px ${COLORS.navy[900]}15`,
            }}
          >
            Factumation
          </span>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: 40,
            opacity: interpolate(statsSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(statsSpring, [0, 1], [30, 0])}px)`,
          }}
        >
          {[
            { value: "2 min", label: "Pour creer une facture" },
            { value: "100%", label: "Gratuit" },
            { value: "PDF", label: "Export professionnel" },
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                textAlign: "center",
                padding: "24px 36px",
                background: `${COLORS.light}f8`,
                backdropFilter: "blur(20px)",
                borderRadius: 18,
                boxShadow: `0 20px 40px -12px ${COLORS.dark}12`,
                border: `1px solid ${COLORS.sand}`,
              }}
            >
              <div style={{ fontSize: 40, fontWeight: 800, color: COLORS.navy[900], fontFamily: FONTS.heading }}>{stat.value}</div>
              <div style={{ fontSize: 15, color: COLORS.neutral[500], marginTop: 10, fontFamily: FONTS.body }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            transform: `scale(${interpolate(ctaSpring, [0, 1], [0.9, 1])})`,
            opacity: interpolate(ctaSpring, [0, 1], [0, 1]),
            background: `linear-gradient(135deg, ${COLORS.accent.orange} 0%, ${COLORS.accent.orangeDark} 100%)`,
            color: COLORS.light,
            padding: "26px 70px",
            borderRadius: 100,
            fontSize: 26,
            fontWeight: 700,
            fontFamily: FONTS.heading,
            letterSpacing: "-0.01em",
            boxShadow: `0 20px 40px -10px ${COLORS.accent.orangeDark}70`,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          Essayez gratuitement
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: 24,
            color: COLORS.neutral[400],
            fontFamily: FONTS.body,
            marginTop: 20,
            opacity: interpolate(ctaSpring, [0, 1], [0, 1]),
          }}
        >
          factumation.com
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// MAIN COMPOSITION
// ============================================================================
export const FactumationUseCase: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Scene 1: Intro - 3s */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <SceneIntro />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ config: SPRING_CONFIGS.smooth, durationInFrames: 20 })}
      />

      {/* Scene 2: Emitter Info - 8s */}
      <TransitionSeries.Sequence durationInFrames={240}>
        <SceneEmitterInfo />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: SPRING_CONFIGS.snappy, durationInFrames: 25 })}
      />

      {/* Scene 3: Client Info - 7s */}
      <TransitionSeries.Sequence durationInFrames={210}>
        <SceneClientInfo />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-bottom" })}
        timing={springTiming({ config: SPRING_CONFIGS.snappy, durationInFrames: 25 })}
      />

      {/* Scene 4: Add Items - 15s */}
      <TransitionSeries.Sequence durationInFrames={450}>
        <SceneAddItems />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ config: SPRING_CONFIGS.smooth, durationInFrames: 25 })}
      />

      {/* Scene 5: Export - 8s */}
      <TransitionSeries.Sequence durationInFrames={240}>
        <SceneExport />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ config: SPRING_CONFIGS.smooth, durationInFrames: 25 })}
      />

      {/* Scene 6: Outro - 5s */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <SceneOutro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
