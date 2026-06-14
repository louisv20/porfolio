class RadialGradient {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.centerX = Math.random() * canvas.width;
    this.centerY = Math.random() * canvas.height;
    this.radius = Math.random() * 200 + 100;
    this.angle = Math.random() * Math.PI * 2;
    this.velocity = (Math.random() - 0.5) * 2;
    this.colors = [
      { r: 0, g: 0, b: 0 }, // black
      { r: 255, g: 0, b: 0 }, // red
      { r: 255, g: 255, b: 0 }, // yellow
    ];
    this.currentColorIndex = Math.floor(Math.random() * 3);
    this.nextColorIndex = (this.currentColorIndex + 1) % 3;
    this.transitionProgress = 0;
    this.transitionSpeed = 0.005; // Adjust this value to control transition speed
  }

  update() {
    this.angle += this.velocity * 0.02;
    this.centerX = this.canvas.width / 2 + Math.cos(this.angle) * this.radius;
    this.centerY = this.canvas.height / 2 + Math.sin(this.angle) * this.radius;

    this.transitionProgress += this.transitionSpeed;
    if (this.transitionProgress >= 1) {
      this.currentColorIndex = this.nextColorIndex;
      this.nextColorIndex = (this.nextColorIndex + 1) % 3;
      this.transitionProgress = 0;
    }
  }

  draw() {
    const gradient = this.ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      0,
      this.centerX,
      this.centerY,
      this.radius
    );

    const currentColor = this.interpolateColor(
      this.colors[this.currentColorIndex],
      this.colors[this.nextColorIndex],
      this.transitionProgress
    );

    gradient.addColorStop(
      0,
      `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`
    );
    gradient.addColorStop(1, "transparent");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  interpolateColor(color1, color2, factor) {
    return {
      r: Math.round(color1.r + factor * (color2.r - color1.r)),
      g: Math.round(color1.g + factor * (color2.g - color1.g)),
      b: Math.round(color1.b + factor * (color2.b - color1.b)),
    };
  }
}
// The rest of the code remains the same

function setupGradientBackground() {
  const canvas = document.getElementById("gradient-canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext("2d");
  const gradients = [
    new RadialGradient(canvas),
    new RadialGradient(canvas),
    new RadialGradient(canvas),
  ];

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gradients.forEach((gradient) => {
      gradient.update();
      gradient.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

document.addEventListener("DOMContentLoaded", setupGradientBackground);
