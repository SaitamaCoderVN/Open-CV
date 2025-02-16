interface CardGeneratorOptions {
  name?: string;
  title?: string;
  level?: number;
  codeContribute?: string;
  isAnimated?: boolean;
}

export const generateCombinedImage = async (
  canvas: HTMLCanvasElement,
  imageUrl: string,
  options?: CardGeneratorOptions
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const aspectRatio = 0.718;
      const cardWidth = 400;
      const cardHeight = cardWidth / aspectRatio;
      canvas.width = cardWidth;
      canvas.height = cardHeight;

      const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
      gradient.addColorStop(0, '#2a0845');
      gradient.addColorStop(1, '#6441A5');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cardWidth, cardHeight);

      const frameMargin = 20;
      const imageWidth = cardWidth - frameMargin * 2;
      const imageHeight = cardHeight - frameMargin * 3;
      const imageAspectRatio = img.width / img.height;
      let drawWidth, drawHeight, offsetX, offsetY;

      if (imageAspectRatio > imageWidth / imageHeight) {
        drawHeight = imageHeight;
        drawWidth = drawHeight * imageAspectRatio;
        offsetX = frameMargin + (imageWidth - drawWidth) / 2;
        offsetY = frameMargin * 2;
      } else {
        drawWidth = imageWidth;
        drawHeight = drawWidth / imageAspectRatio;
        offsetX = frameMargin;
        offsetY = frameMargin * 2 + (imageHeight - drawHeight) / 2;
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(frameMargin, frameMargin * 2, imageWidth, imageHeight);
      ctx.clip();
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();

      // Vẽ khung và các chi tiết khác
      ctx.strokeStyle = '#8A2BE2';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, cardWidth - 20, cardHeight - 20);

      ctx.strokeStyle = '#4B0082';
      ctx.lineWidth = 4;
      ctx.strokeRect(frameMargin, frameMargin, cardWidth - frameMargin * 2, cardHeight - frameMargin * 2);

      // Vẽ các góc
      ctx.strokeStyle = '#9370DB';
      ctx.lineWidth = 2;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(5, 35);
      ctx.lineTo(5, 5);
      ctx.lineTo(35, 5);
      ctx.stroke();
      // Top-right 
      ctx.beginPath();
      ctx.moveTo(cardWidth - 35, 5);
      ctx.lineTo(cardWidth - 5, 5);
      ctx.lineTo(cardWidth - 5, 35);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(5, cardHeight - 35);
      ctx.lineTo(5, cardHeight - 5);
      ctx.lineTo(35, cardHeight - 5);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(cardWidth - 35, cardHeight - 5);
      ctx.lineTo(cardWidth - 5, cardHeight - 5);
      ctx.lineTo(cardWidth - 5, cardHeight - 35);
      ctx.stroke();

      // Thêm text nếu có
      if (options?.name) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, cardWidth, 40);
        ctx.fillStyle = '#ce8eeb';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(options.name, cardWidth / 2, 28);
      }

      if (options?.title) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, cardHeight - 40, cardWidth, 40);
        ctx.fillStyle = '#E6E6FA';
        ctx.font = '20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(options.title, cardWidth / 2, cardHeight - 15);
      }

      // Thêm phần vẽ text với animation
      if (options?.name || options?.level || options?.codeContribute) {
        // Vẽ overlay cho text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, cardHeight - 80, cardWidth, 80);

        // Vẽ text với hiệu ứng gradient
        const gradient = ctx.createLinearGradient(0, cardHeight - 80, cardWidth, cardHeight);
        gradient.addColorStop(0, '#ce8eeb');
        gradient.addColorStop(1, '#E6E6FA');
        ctx.fillStyle = gradient;
        
        // Vẽ các thông tin
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        
        if (options.name) {
          ctx.fillText(options.name, cardWidth / 2, cardHeight - 55);
        }
        
        if (options.level) {
          ctx.font = '16px "Courier New", monospace';
          ctx.fillText(`Level: ${options.level}`, cardWidth / 2, cardHeight - 35);
        }
        
        if (options.codeContribute) {
          ctx.font = '14px "Courier New", monospace';
          ctx.fillText(`Code: ${options.codeContribute}`, cardWidth / 2, cardHeight - 15);
        }
      }

      canvas.toBlob((blob) => {
        resolve(blob);
      });
    };
    img.src = imageUrl;
  });
}; 