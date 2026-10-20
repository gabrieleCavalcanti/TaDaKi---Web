import React, { useId } from "react";

export interface AvatarOpcao {
  id: string;
  nome: string;
  fundo: string;
}

export const AVATARES: AvatarOpcao[] = [
  { id: "urso", nome: "Ursinho", fundo: "#F6E7D6" },
  { id: "gato", nome: "Gatinho", fundo: "#FFE9CF" },
  { id: "coelho", nome: "Coelhinho", fundo: "#FBE3EE" },
  { id: "loja", nome: "Lojinha", fundo: "#DCE6F1" },
  { id: "robo", nome: "Robozinho", fundo: "#E1F0E4" },
];

const PALETAS: Record<string, [string, string, string]> = {
  urso: ["#EDBF93", "#C98B57", "#8F5A32"],
  gato: ["#FFCB8A", "#F59A3E", "#C2681A"],
  coelho: ["#FFFFFF", "#F6E6EE", "#D5B3C5"],
  loja: ["#FFFFFF", "#E3ECF6", "#A2B9D5"],
  robo: ["#EAF3FB", "#A2B9D5", "#6685A8"],
};

const ESCURO = "#2A2438";

interface Props {
  id: string;
  size?: number;
}

export function AvatarBoneco({ id, size = 120 }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [c1, c2, c3] = PALETAS[id] || PALETAS.urso;
  const grad = `${uid}g`;
  const sombra = `${uid}s`;
  const clip = `${uid}c`;
  const robo = id === "robo";

  return (
    <svg
      className="bonecoSvg"
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={AVATARES.find((a) => a.id === id)?.nome || "Avatar"}
    >
      <defs>
        <radialGradient id={grad} cx="35%" cy="28%" r="85%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="55%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </radialGradient>
        <radialGradient id={sombra}>
          <stop offset="0%" stopColor="#000" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={clip}>
          <path d="M44 74 L56 38 H144 L156 74 Z" />
        </clipPath>
      </defs>

      <g transform="translate(100 106) scale(0.88) translate(-100 -106)">
        <ellipse cx="100" cy="190" rx="62" ry="9" fill={`url(#${sombra})`} />

        {/* Corpinho */}
        <ellipse cx="100" cy="170" rx="46" ry="30" fill={`url(#${grad})`} />
        <ellipse cx="100" cy="176" rx="24" ry="16" fill="#fff" opacity="0.28" />

        {/* Orelhas / extras ATRÁS da cabeça */}
        {id === "urso" && (
          <>
            <circle cx="48" cy="64" r="21" fill={`url(#${grad})`} />
            <circle cx="152" cy="64" r="21" fill={`url(#${grad})`} />
            <circle cx="48" cy="66" r="11" fill="#F6DEC2" />
            <circle cx="152" cy="66" r="11" fill="#F6DEC2" />
          </>
        )}
        {id === "gato" && (
          <>
            <path
              d="M42 96 L46 42 L90 68 Z"
              fill={c2}
              stroke={c2}
              strokeWidth="10"
              strokeLinejoin="round"
            />
            <path
              d="M158 96 L154 42 L110 68 Z"
              fill={c2}
              stroke={c2}
              strokeWidth="10"
              strokeLinejoin="round"
            />
            <path
              d="M52 84 L54 56 L76 70 Z"
              fill="#FFB3C1"
              stroke="#FFB3C1"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="M148 84 L146 56 L124 70 Z"
              fill="#FFB3C1"
              stroke="#FFB3C1"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </>
        )}
        {id === "coelho" && (
          <>
            <g transform="rotate(-10 70 48)">
              <ellipse cx="70" cy="46" rx="16" ry="40" fill={`url(#${grad})`} />
              <ellipse cx="70" cy="50" rx="8" ry="28" fill="#FFB6CC" />
            </g>
            <g transform="rotate(10 130 48)">
              <ellipse cx="130" cy="46" rx="16" ry="40" fill={`url(#${grad})`} />
              <ellipse cx="130" cy="50" rx="8" ry="28" fill="#FFB6CC" />
            </g>
          </>
        )}
        {id === "robo" && (
          <>
            <line
              x1="100"
              y1="56"
              x2="100"
              y2="30"
              stroke="#6685A8"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle className="roboLuz" cx="100" cy="26" r="8" fill="#E03A3E" />
            <circle cx="97" cy="23" r="2.5" fill="#fff" opacity="0.8" />
            <rect x="24" y="98" width="18" height="34" rx="9" fill="#6685A8" />
            <rect x="158" y="98" width="18" height="34" rx="9" fill="#6685A8" />
          </>
        )}

        {/* Cabeça */}
        <ellipse cx="100" cy="112" rx="72" ry="64" fill={`url(#${grad})`} />
        <ellipse
          cx="74"
          cy="76"
          rx="24"
          ry="12"
          fill="#fff"
          opacity="0.38"
          transform="rotate(-24 74 76)"
        />

        {/* Detalhes de rosto por personagem */}
        {id === "urso" && (
          <>
            <ellipse cx="100" cy="132" rx="28" ry="20" fill="#F6DEC2" />
            <ellipse cx="100" cy="123" rx="8" ry="6" fill={ESCURO} />
            <ellipse cx="98" cy="121" rx="2.4" ry="1.6" fill="#fff" opacity="0.8" />
          </>
        )}
        {id === "gato" && (
          <>
            <path
              d="M92 56 Q92 70 92 74 M100 54 L100 74 M108 56 Q108 70 108 74"
              stroke="#C2681A"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              opacity="0.65"
            />
            <path d="M94 124 L106 124 L100 131 Z" fill="#FF8FA3" />
            <g stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.9">
              <line x1="48" y1="128" x2="76" y2="130" />
              <line x1="48" y1="138" x2="76" y2="136" />
              <line x1="152" y1="128" x2="124" y2="130" />
              <line x1="152" y1="138" x2="124" y2="136" />
            </g>
          </>
        )}
        {id === "coelho" && (
          <>
            <ellipse cx="100" cy="124" rx="6" ry="4.5" fill="#FF8FA3" />
          </>
        )}
        {id === "loja" && (
          <>
            <g clipPath={`url(#${clip})`}>
              {Array.from({ length: 7 }).map((_, i) => (
                <rect
                  key={i}
                  x={40 + i * 17.15}
                  y="34"
                  width="17.15"
                  height="44"
                  fill={i % 2 === 0 ? "#E03A3E" : "#FFFFFF"}
                />
              ))}
              <rect x="40" y="34" width="120" height="12" fill="#fff" opacity="0.18" />
            </g>
            {Array.from({ length: 7 }).map((_, i) => (
              <circle
                key={i}
                cx={48.6 + i * 17.15}
                cy="74"
                r="8.6"
                fill={i % 2 === 0 ? "#E03A3E" : "#FFFFFF"}
                stroke="#E6D9D9"
                strokeWidth="0.8"
              />
            ))}
          </>
        )}
        {robo && (
          <rect x="52" y="86" width="96" height="56" rx="26" fill="#1F2A3D" />
        )}

        {/* Rosto */}
        {robo ? (
          <>
            <g className="olho">
              <ellipse cx="78" cy="112" rx="8" ry="10" fill="#7FE3FF" />
              <ellipse cx="122" cy="112" rx="8" ry="10" fill="#7FE3FF" />
            </g>
            <path
              d="M90 128 Q100 138 110 128"
              stroke="#7FE3FF"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : (
          <>
            <g className="olho">
              <ellipse cx="76" cy="112" rx="7.5" ry="10" fill={ESCURO} />
              <ellipse cx="124" cy="112" rx="7.5" ry="10" fill={ESCURO} />
              <circle cx="78.5" cy="108" r="3" fill="#fff" />
              <circle cx="126.5" cy="108" r="3" fill="#fff" />
              <circle cx="74" cy="116" r="1.5" fill="#fff" opacity="0.8" />
              <circle cx="122" cy="116" r="1.5" fill="#fff" opacity="0.8" />
            </g>
            <ellipse cx="56" cy="130" rx="11" ry="7" fill="#FF8FA3" opacity="0.5" />
            <ellipse cx="144" cy="130" rx="11" ry="7" fill="#FF8FA3" opacity="0.5" />
            <path
              d={id === "urso" ? "M91 140 Q100 148 109 140" : "M91 134 Q100 143 109 134"}
              stroke={ESCURO}
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
      </g>
    </svg>
  );
}
