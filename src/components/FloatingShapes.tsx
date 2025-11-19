import { useEffect, useState } from "react";

interface FloatingShape {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  shape: "circle" | "triangle" | "square";
  opacity: number;
}

const FloatingShapes = () => {
  const [shapes, setShapes] = useState<FloatingShape[]>([]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Initialize shapes
    const initialShapes: FloatingShape[] = [];
    const shapeTypes: ("circle" | "triangle" | "square")[] = [
      "circle",
      "triangle",
      "square",
    ];

    // Reduced shape count for better performance on mobile
    const shapeCount = window.innerWidth < 768 ? 5 : 8;
    
    for (let i = 0; i < shapeCount; i++) {
      initialShapes.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 40 + Math.random() * 60,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.5,
        shape: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        opacity: 0.15 + Math.random() * 0.2,
      });
    }

    setShapes(initialShapes);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      setShapes((prevShapes) =>
        prevShapes.map((shape) => {
          let newX = shape.x + shape.speedX;
          let newY = shape.y + shape.speedY;
          const newRotation = shape.rotation + shape.rotationSpeed;

          // Bounce off edges
          if (newX < 0 || newX > window.innerWidth) {
            shape.speedX = -shape.speedX;
            newX = shape.x;
          }
          if (newY < 0 || newY > window.innerHeight) {
            shape.speedY = -shape.speedY;
            newY = shape.y;
          }

          // Wrap around
          if (newX < 0) newX = window.innerWidth;
          if (newX > window.innerWidth) newX = 0;
          if (newY < 0) newY = window.innerHeight;
          if (newY > window.innerHeight) newY = 0;

          return {
            ...shape,
            x: newX,
            y: newY,
            rotation: newRotation,
          };
        })
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      setShapes((prevShapes) =>
        prevShapes.map((shape) => ({
          ...shape,
          x: Math.min(shape.x, window.innerWidth),
          y: Math.min(shape.y, window.innerHeight),
        }))
      );
    };

    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getShapeColor = (shape: FloatingShape) => {
    const colors = isDark
      ? [
          "hsla(263, 70%, 75%, 0.2)",
          "hsla(263, 90%, 70%, 0.15)",
          "hsla(190, 95%, 75%, 0.2)",
          "hsla(230, 80%, 70%, 0.15)",
        ]
      : [
          "hsla(263, 70%, 60%, 0.15)",
          "hsla(263, 90%, 55%, 0.12)",
          "hsla(190, 95%, 60%, 0.15)",
          "hsla(230, 80%, 55%, 0.12)",
        ];

    return colors[shape.id % colors.length];
  };

  const renderShape = (shape: FloatingShape) => {
    const color = getShapeColor(shape);
    const style: React.CSSProperties = {
      position: "absolute",
      left: `${shape.x}px`,
      top: `${shape.y}px`,
      width: `${shape.size}px`,
      height: `${shape.size}px`,
      transform: `rotate(${shape.rotation}deg)`,
      opacity: shape.opacity,
      transition: "opacity 0.3s ease",
      pointerEvents: "none",
      willChange: "transform, opacity",
    };

    switch (shape.shape) {
      case "circle":
        return (
          <div
            key={shape.id}
            style={{
              ...style,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}, transparent)`,
              boxShadow: `0 0 ${shape.size}px ${color}`,
            }}
          />
        );

      case "triangle":
        return (
          <div
            key={shape.id}
            style={{
              ...style,
              width: 0,
              height: 0,
              borderLeft: `${shape.size / 2}px solid transparent`,
              borderRight: `${shape.size / 2}px solid transparent`,
              borderBottom: `${shape.size}px solid ${color}`,
              background: "none",
            }}
          />
        );

      case "square":
        return (
          <div
            key={shape.id}
            style={{
              ...style,
              borderRadius: "8px",
              background: color,
              boxShadow: `0 0 ${shape.size / 2}px ${color}`,
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {shapes.map(renderShape)}
    </div>
  );
};

export default FloatingShapes;

