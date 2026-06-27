"use client";

import { useRef, useState } from "react";

export default function ImageResizeTool() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(800);
  const [fileName, setFileName] = useState("resized-image.png");
  const [message, setMessage] = useState("Upload an image and resize it for online forms.");

  function drawImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);

        const ratio = Math.min(width / img.width, height / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;
        const x = (width - newWidth) / 2;
        const y = (height - newHeight) / 2;
        ctx.drawImage(img, x, y, newWidth, newHeight);
        setMessage("Image resized. Click Download.");
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name.replace(/\.[^.]+$/, "") + "-resized.png");
    drawImage(file);
  }

  function downloadImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = fileName;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="tool-panel">
      <h2>Image Resize Tool</h2>
      <p className="admin-status">Set width and height, upload image, then download the resized file.</p>
      <div className="form-grid">
        <label>Width in pixels<input type="number" min="50" value={width} onChange={(e) => setWidth(Number(e.target.value))} /></label>
        <label>Height in pixels<input type="number" min="50" value={height} onChange={(e) => setHeight(Number(e.target.value))} /></label>
        <label>Upload Image<input type="file" accept="image/*" onChange={handleUpload} /></label>
        <div className="notice info">{message}</div>
        <div className="canvas-preview"><canvas ref={canvasRef} /></div>
        <button className="btn" type="button" onClick={downloadImage}>Download Image</button>
      </div>
    </div>
  );
}
