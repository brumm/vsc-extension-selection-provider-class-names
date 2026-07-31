import {
  AbsoluteFill,
  Composition,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";

const CODE_LINE = '<div className="dark:hover:bg-(--brand)" />';
const CLASS_TOKEN = "dark:hover:bg-(--brand)";
const TOKEN_START = CODE_LINE.indexOf(CLASS_TOKEN);
const TOKEN_END = TOKEN_START + CLASS_TOKEN.length;
const BRAND_START = CODE_LINE.indexOf("--brand");
const BRAND_END = BRAND_START + "--brand".length;
const BG_START = CODE_LINE.indexOf("bg-(--brand)");
const HOVER_START = CODE_LINE.indexOf("hover:bg-(--brand)");

const STAGES = [
  { label: "--brand", start: BRAND_START, end: BRAND_END },
  { label: "bg-(--brand)", start: BG_START, end: TOKEN_END },
  { label: "hover:bg-(--brand)", start: HOVER_START, end: TOKEN_END },
  { label: "dark:hover:bg-(--brand)", start: TOKEN_START, end: TOKEN_END },
] as const;

type Props = Record<string, never>;

const codeFont =
  '"SFMono-Regular", "Cascadia Code", "Roboto Mono", Consolas, monospace';

export const MyComposition = () => {
  return (
    <Composition
      id="ClassNameSelection"
      component={MyComponent}
      durationInFrames={240}
      fps={30}
      width={1000}
      height={286}
      defaultProps={{}}
    />
  );
};

export const MyComponent: React.FC<Props> = () => {
  const frame = useCurrentFrame();

  const activeStage =
    frame < 24 ? 0 : frame < 56 ? 1 : frame < 88 ? 2 : frame < 150 ? 3 : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        color: "#f8fafc",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      <Interactive.Div
        name="Editor window"
        style={{
          backgroundColor: "#111827",
          border: "1px solid #263552",
          borderRadius: 20,
          boxShadow: "0 22px 70px rgba(0, 0, 0, 0.32)",
          height: 196,
          left: 10,
          overflow: "hidden",
          position: "absolute",
          right: 10,
          top: 10,
        }}
      >
        <Interactive.Div
          name="Editor chrome"
          style={{
            alignItems: "center",
            backgroundColor: "#172136",
            borderBottom: "1px solid #263552",
            display: "flex",
            height: 28,
            padding: "0 18px",
          }}
        >
          <Interactive.Div
            name="Window controls"
            style={{ display: "flex", gap: 8 }}
          >
            <span
              style={{
                backgroundColor: "#fb7185",
                borderRadius: "50%",
                height: 10,
                width: 10,
              }}
            />
            <span
              style={{
                backgroundColor: "#fbbf24",
                borderRadius: "50%",
                height: 10,
                width: 10,
              }}
            />
            <span
              style={{
                backgroundColor: "#34d399",
                borderRadius: "50%",
                height: 10,
                width: 10,
              }}
            />
          </Interactive.Div>
        </Interactive.Div>

        <Interactive.Div
          name="Code area"
          style={{
            backgroundColor: "#0f172a",
            boxSizing: "border-box",
            display: "flex",
            height: 168,
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Interactive.Div
            name="Code line"
            style={{
              alignItems: "center",
              display: "flex",
              fontFamily: codeFont,
              fontSize: 25,
              height: 46,
              lineHeight: 1,
              position: "relative",
              whiteSpace: "pre",
            }}
          >
            <div style={{ position: "relative" }}>
              <Interactive.Div
                name="Animated selection"
                style={{
                  backgroundColor: "#2563eb",
                  border: "1px solid #60a5fa",
                  borderRadius: 5,
                  boxShadow: "0 0 24px rgba(37, 99, 235, 0.52)",
                  height: 32,
                  left: `${interpolate(
                    frame,
                    [0, 24, 32, 56, 64, 88, 96, 150, 158, 239],
                    [
                      BRAND_START,
                      BRAND_START,
                      BG_START,
                      BG_START,
                      HOVER_START,
                      HOVER_START,
                      TOKEN_START,
                      TOKEN_START,
                      BRAND_START,
                      BRAND_START,
                    ],
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                    },
                  )}ch`,
                  opacity: 1,
                  position: "absolute",
                  top: -4,
                  width: `${interpolate(
                    frame,
                    [0, 24, 32, 56, 64, 88, 96, 150, 158, 239],
                    [
                      BRAND_END - BRAND_START,
                      BRAND_END - BRAND_START,
                      TOKEN_END - BG_START,
                      TOKEN_END - BG_START,
                      TOKEN_END - HOVER_START,
                      TOKEN_END - HOVER_START,
                      TOKEN_END - TOKEN_START,
                      TOKEN_END - TOKEN_START,
                      BRAND_END - BRAND_START,
                      BRAND_END - BRAND_START,
                    ],
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                    },
                  )}ch`,
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <span style={{ color: "#cbd5e1" }}>
                  {CODE_LINE.slice(0, TOKEN_START)}
                </span>
                <span style={{ color: "#f8fafc" }}>{CLASS_TOKEN}</span>
                <span style={{ color: "#cbd5e1" }}>
                  {CODE_LINE.slice(TOKEN_END)}
                </span>
              </div>
            </div>
          </Interactive.Div>
        </Interactive.Div>
      </Interactive.Div>

      <Interactive.Div
        name="Range progression"
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          left: 10,
          opacity: 1,
          position: "absolute",
          right: 10,
          top: 226,
        }}
      >
        {STAGES.map((stage, index) => (
          <div
            key={stage.label}
            style={{
              alignItems: "center",
              display: "flex",
              flex: 1,
              gap: 10,
            }}
          >
            <Interactive.Div
              name={`Range ${index + 1}`}
              style={{
                backgroundColor: index === activeStage ? "#1d4ed8" : "#111c31",
                border:
                  index === activeStage
                    ? "1px solid #60a5fa"
                    : "1px solid #263552",
                borderRadius: 10,
                boxShadow:
                  index === activeStage
                    ? "0 0 22px rgba(37, 99, 235, 0.28)"
                    : "none",
                color: index === activeStage ? "#eff6ff" : "#94a3b8",
                flex: 1,
                fontFamily: codeFont,
                fontSize: 14,
                overflow: "hidden",
                padding: "14px 12px",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {stage.label}
            </Interactive.Div>
            {index < STAGES.length - 1 ? (
              <span style={{ color: "#475569", fontSize: 20 }}>→</span>
            ) : null}
          </div>
        ))}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
