import { useCallback, useEffect, useState, useMemo } from "react";
import Particles from "@tsparticles/react";
// Workaround typing mismatch with @tsparticles/react types in this project
const ParticlesAny: any = Particles;
import type { ParticlesOptions } from "@/types/particles";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

const ParticlesBackground = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is active
    const checkTheme = () => {
      const root = document.documentElement;
      setIsDark(root.classList.contains('dark'));
    };

    // Check initial theme
    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = useMemo<ParticlesOptions>(() => ({
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 120,
        fullScreen: {
          enable: false,
        },
        interactivity: {
          events: {
            onClick: {
              enable: true,
              mode: "push",
            },
            onHover: {
              enable: true,
              mode: "grab",
            },
            resize: { enable: true },
          },
          modes: {
            push: {
              quantity: 6,
            },
            grab: {
              distance: 180,
              links: {
                opacity: 0.8,
                blink: false,
                consent: false,
              },
            },
            repulse: {
              distance: 200,
              duration: 0.4,
            },
          },
        },
        particles: {
          color: {
            value: isDark
              ? [
                  "hsl(263, 70%, 75%)",
                  "hsl(263, 90%, 70%)",
                  "hsl(190, 95%, 75%)",
                  "hsl(230, 80%, 70%)",
                ]
              : [
                  "hsl(263, 70%, 60%)",
                  "hsl(263, 90%, 55%)",
                  "hsl(190, 95%, 60%)",
                  "hsl(230, 80%, 55%)",
                ],
          },
          links: {
            color: {
              value: isDark
                ? "hsl(263, 70%, 70%)"
                : "hsl(263, 70%, 60%)",
            },
            distance: 150,
            enable: true,
            opacity: isDark ? 0.4 : 0.25,
            width: 1.5,
            triangles: {
              enable: false,
            },
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: true,
            speed: {
              min: 0.5,
              max: 2,
            },
            straight: false,
            attract: {
              enable: false,
            },
            trail: {
              enable: true,
              length: 3,
              fill: {
                color: {
                  value: isDark
                    ? "hsl(263, 70%, 50%)"
                    : "hsl(263, 70%, 70%)",
                },
              },
            },
          },
          number: {
            density: {
              enable: true,
              area: 1000,
            },
            value: isDark ? 100 : 80,
          },
          opacity: {
            value: {
              min: 0.3,
              max: isDark ? 0.8 : 0.6,
            },
            random: true,
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 0.2,
              sync: false,
            },
          },
          shape: {
            type: ["circle", "triangle"],
            options: {
              triangle: {
                particles: {
                  color: {
                    value: isDark
                      ? "hsl(190, 95%, 75%)"
                      : "hsl(190, 95%, 60%)",
                  },
                },
              },
            },
          },
          size: {
            value: {
              min: 1,
              max: 4,
            },
            random: true,
            animation: {
              enable: true,
              speed: 3,
              minimumValue: 0.5,
              sync: false,
              destroy: "none",
            },
          },
        },
        detectRetina: true,
        smooth: true,
      }), [isDark]);

  return (
    <ParticlesAny
      id="tsparticles"
      init={particlesInit}
      className="fixed inset-0 -z-10 w-full h-full"
      key={isDark ? 'dark' : 'light'}
      options={particlesOptions}
    />
  );
};

export default ParticlesBackground;
