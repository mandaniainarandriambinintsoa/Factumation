import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
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
  SectionTitle,
  FeatureCard,
  AccentLine,
} from "../design-system";

type FactumationFeaturesProps = {
  isConnected: boolean;
};

// ============================================================================
// REGION CARD COMPONENT
// ============================================================================

const RegionCard: React.FC<{
  icon: string;
  name: string;
  detail: string;
  delay: number;
  index: number;
}> = ({ icon, name, detail, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const scale = interpolate(cardSpring, [0, 1], [0.9, 1]);
  const opacity = interpolate(cardSpring, [0, 1], [0, 1]);
  const y = interpolate(cardSpring, [0, 1], [30, 0]);

  return (
    <div
      style={{
        backgroundColor: `${COLORS.light}f8`,
        padding: 44,
        borderRadius: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        transform: `scale(${scale}) translateY(${y}px)`,
        opacity,
        minWidth: 260,
        boxShadow: `0 25px 50px -12px ${COLORS.dark}20`,
        border: `1px solid ${COLORS.sand}`,
      }}
    >
      <span style={{ fontSize: 64 }}>{icon}</span>
      <span
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: COLORS.navy[900],
          fontFamily: FONTS.heading,
          letterSpacing: "-0.02em",
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontSize: 15,
          color: COLORS.neutral[500],
          fontFamily: FONTS.body,
        }}
      >
        {detail}
      </span>
    </div>
  );
};

// ============================================================================
// AUTH METHOD CARD
// ============================================================================

const AuthMethodCard: React.FC<{
  icon: string;
  name: string;
  detail: string;
  delay: number;
  index: number;
}> = ({ icon, name, detail, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const scale = interpolate(cardSpring, [0, 1], [0.9, 1]);
  const opacity = interpolate(cardSpring, [0, 1], [0, 1]);
  const y = interpolate(cardSpring, [0, 1], [30, 0]);

  return (
    <div
      style={{
        backgroundColor: `${COLORS.light}f8`,
        padding: 48,
        borderRadius: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        transform: `scale(${scale}) translateY(${y}px)`,
        opacity,
        minWidth: 300,
        boxShadow: `0 25px 50px -12px ${COLORS.dark}15`,
        border: `1px solid ${COLORS.sand}`,
      }}
    >
      <span style={{ fontSize: 72 }}>{icon}</span>
      <span
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: COLORS.navy[900],
          fontFamily: FONTS.heading,
          letterSpacing: "-0.02em",
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontSize: 17,
          color: COLORS.neutral[500],
          fontFamily: FONTS.body,
        }}
      >
        {detail}
      </span>
    </div>
  );
};

// ============================================================================
// SANS CONNEXION SCENES
// ============================================================================

const SansConnexionIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.sand, COLORS.light]}
      />
      <OrganicParticles count={6} color={COLORS.accent.orange} maxSize={10} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <SectionTitle
          text="Sans Inscription"
          subtitle="Creez vos documents immediatement"
          color={COLORS.dark}
          subtitleColor={COLORS.neutral[500]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SansConnexionFeatures: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const features = [
    {
      icon: "📄",
      title: "Creer des Factures",
      description: "Generez des factures professionnelles avec tous les champs requis",
    },
    {
      icon: "📝",
      title: "Creer des Devis",
      description: "Preparez des devis detailles avec date de validite",
    },
    {
      icon: "💾",
      title: "Export PDF",
      description: "Telechargez vos documents au format PDF instantanement",
    },
    {
      icon: "🌍",
      title: "Multi-Devises",
      description: "EUR, USD, GBP, CAD, CHF, MGA supportees",
    },
  ];

  const titleSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.light, COLORS.sand]}
      />
      <OrganicParticles count={6} color={COLORS.accent.blue} maxSize={8} />
      <AccentLine position="top-left" />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          gap: 50,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: COLORS.dark,
            fontFamily: FONTS.heading,
            opacity: interpolate(titleSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
            letterSpacing: "-0.03em",
          }}
        >
          Fonctionnalites Gratuites
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            maxWidth: 1000,
          }}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={25 + index * 12}
              index={index}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SansConnexionFormats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const regions = [
    { name: "Europe", icon: "🇪🇺", detail: "SIRET, TVA" },
    { name: "Madagascar", icon: "🇲🇬", detail: "NIF, STAT" },
    { name: "International", icon: "🌐", detail: "Sans regime fiscal" },
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
      <OrganicParticles count={8} color={COLORS.light} maxSize={8} />

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
          Regions Fiscales
        </div>
        <div style={{ display: "flex", gap: 36 }}>
          {regions.map((region, index) => (
            <RegionCard
              key={region.name}
              icon={region.icon}
              name={region.name}
              detail={region.detail}
              delay={25 + index * 15}
              index={index}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// AVEC CONNEXION SCENES
// ============================================================================

const AvecConnexionIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.sand, COLORS.light]}
      />
      <OrganicParticles count={6} color={COLORS.accent.blue} maxSize={10} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <SectionTitle
          text="Avec un Compte"
          subtitle="Debloquez toutes les fonctionnalites"
          color={COLORS.dark}
          subtitleColor={COLORS.neutral[500]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const AvecConnexionFeatures: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const features = [
    {
      icon: "📊",
      title: "Historique Complet",
      description: "Retrouvez toutes vos factures et devis avec statuts",
    },
    {
      icon: "👥",
      title: "Carnet Clients",
      description: "Sauvegardez vos clients pour les reutiliser facilement",
    },
    {
      icon: "🏢",
      title: "Multi-Societes",
      description: "Gerez plusieurs entreprises depuis un seul compte",
    },
    {
      icon: "📧",
      title: "Envoi par Email",
      description: "Envoyez vos documents directement par email",
    },
  ];

  const titleSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.light, COLORS.sand]}
      />
      <OrganicParticles count={6} color={COLORS.accent.green} maxSize={8} />
      <AccentLine position="top-left" />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          gap: 50,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: COLORS.dark,
            fontFamily: FONTS.heading,
            opacity: interpolate(titleSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
            letterSpacing: "-0.03em",
          }}
        >
          Fonctionnalites Exclusives
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            maxWidth: 1000,
          }}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={25 + index * 12}
              index={index}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const AvecConnexionAdvanced: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    {
      icon: "🔒",
      title: "Donnees Securisees",
      description: "Vos donnees sont protegees avec Row Level Security",
    },
    {
      icon: "🔄",
      title: "Synchronisation",
      description: "Accedez a vos documents sur tous vos appareils",
    },
    {
      icon: "📈",
      title: "Suivi des Paiements",
      description: "Suivez le statut de vos factures: brouillon, envoye, paye",
    },
    {
      icon: "⚡",
      title: "Webhooks n8n",
      description: "Automatisez vos workflows avec des integrations",
    },
  ];

  const titleSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.navy[900], COLORS.navy[800], COLORS.navy[700]]}
      />
      <OrganicParticles count={8} color={COLORS.light} maxSize={8} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          gap: 50,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: COLORS.light,
            fontFamily: FONTS.heading,
            opacity: interpolate(titleSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
            textShadow: `0 4px 30px ${COLORS.dark}40`,
            letterSpacing: "-0.03em",
          }}
        >
          Fonctionnalites Avancees
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            maxWidth: 1000,
          }}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={25 + index * 12}
              index={index}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const AuthMethodsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const methods = [
    { icon: "📧", name: "Email", detail: "Inscription classique" },
    { icon: "🔵", name: "Google", detail: "Connexion rapide OAuth" },
  ];

  const titleSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.sand, COLORS.light]}
      />
      <OrganicParticles count={6} color={COLORS.accent.orange} maxSize={10} />

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
            color: COLORS.dark,
            fontFamily: FONTS.heading,
            opacity: interpolate(titleSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
            letterSpacing: "-0.03em",
          }}
        >
          Methodes de Connexion
        </div>
        <div style={{ display: "flex", gap: 50 }}>
          {methods.map((method, index) => (
            <AuthMethodCard
              key={method.name}
              icon={method.icon}
              name={method.name}
              detail={method.detail}
              delay={35 + index * 18}
              index={index}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// FINAL CTA SCENES
// ============================================================================

const FinalCTASansConnexion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const buttonSpring = spring({
    frame: frame - 40,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  return (
    <AbsoluteFill>
      <MeshGradientBackground
        colors={[COLORS.cream, COLORS.light, COLORS.sand]}
      />
      <OrganicParticles count={6} color={COLORS.accent.orange} maxSize={10} />

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
            fontSize: 64,
            fontWeight: 800,
            color: COLORS.dark,
            fontFamily: FONTS.heading,
            opacity: interpolate(titleSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
            letterSpacing: "-0.04em",
          }}
        >
          Essayez Gratuitement
        </div>
        <div
          style={{
            fontSize: 32,
            color: COLORS.neutral[500],
            fontFamily: FONTS.body,
            transform: `scale(${buttonSpring})`,
          }}
        >
          factumation.com
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const FinalCTAAvecConnexion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const subtitleSpring = spring({
    frame: frame - 25,
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
          gap: 40,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: COLORS.light,
            fontFamily: FONTS.heading,
            opacity: interpolate(titleSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
            textShadow: `0 4px 30px ${COLORS.dark}40`,
            letterSpacing: "-0.04em",
          }}
        >
          Creez votre compte
        </div>
        <div
          style={{
            fontSize: 32,
            color: COLORS.navy[300],
            fontFamily: FONTS.body,
            opacity: interpolate(subtitleSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(subtitleSpring, [0, 1], [25, 0])}px)`,
          }}
        >
          et commencez a facturer des maintenant
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

export const FactumationFeatures: React.FC<FactumationFeaturesProps> = ({
  isConnected,
}) => {
  if (!isConnected) {
    return (
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120}>
          <SansConnexionIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: SPRING_CONFIGS.smooth, durationInFrames: 30 })}
        />
        <TransitionSeries.Sequence durationInFrames={300}>
          <SansConnexionFeatures />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: SPRING_CONFIGS.snappy, durationInFrames: 30 })}
        />
        <TransitionSeries.Sequence durationInFrames={300}>
          <SansConnexionFormats />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: SPRING_CONFIGS.smooth, durationInFrames: 30 })}
        />
        <TransitionSeries.Sequence durationInFrames={240}>
          <FinalCTASansConnexion />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    );
  }

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={120}>
        <AvecConnexionIntro />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ config: SPRING_CONFIGS.smooth, durationInFrames: 30 })}
      />
      <TransitionSeries.Sequence durationInFrames={300}>
        <AvecConnexionFeatures />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: SPRING_CONFIGS.snappy, durationInFrames: 30 })}
      />
      <TransitionSeries.Sequence durationInFrames={300}>
        <AvecConnexionAdvanced />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ config: SPRING_CONFIGS.smooth, durationInFrames: 30 })}
      />
      <TransitionSeries.Sequence durationInFrames={240}>
        <AuthMethodsScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-bottom" })}
        timing={springTiming({ config: SPRING_CONFIGS.snappy, durationInFrames: 30 })}
      />
      <TransitionSeries.Sequence durationInFrames={300}>
        <FinalCTAAvecConnexion />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
