import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Clear canvas with transparent background
        ctx.clearRect(0, 0, width, height);

        // Draw image preserving transparency
        ctx.drawImage(img, 0, 0, width, height);

        // Use WebP for maximum compression while preserving transparency support
        const mimeType = "image/webp";
        const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
        const quality = isPng ? 0.9 : 0.85; // Higher quality to preserve details

        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Alias for backwards compatibility
export const compressImageWithTransparency = compressImage;

export function parseArticleBody(text: string): string {
  if (!text) return "";

  // Escape HTML tags to prevent XSS
  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Inline Images: ![caption|position](url)
  html = html.replace(/!\[([^\]|]+)(?:\|([^\]]+))?\]\((.*?)\)/g, (match, caption, position, url) => {
    const pos = (position || "").trim().toLowerCase();
    let figureClass = "my-6 mx-auto text-center";
    let imgClass = "mx-auto block";
    
    if (pos === "left" || pos === "kiri") {
      figureClass = "float-left mr-6 mb-4 max-w-[50%]";
      imgClass = "";
    } else if (pos === "right" || pos === "kanan") {
      figureClass = "float-right ml-6 mb-4 max-w-[50%]";
      imgClass = "";
    }

    return `<figure class="${figureClass}"><img src="${url}" alt="${caption}" class="rounded-xl shadow-md ${imgClass}" /><figcaption class="text-sm text-muted-foreground mt-2 text-center italic">${caption}</figcaption></figure>`;
  });

  // Align Blocks: [align:center]...[/align]
  html = html.replace(/\[align:(left|center|right|justify)\]([\s\S]*?)\[\/align\]/gi, (match, align, content) => {
    return `<div class="text-${align.toLowerCase()} w-full block">${content}</div>`;
  });

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-display font-bold mt-8 mb-4 text-ink">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-display font-bold mt-10 mb-5 text-ink">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-display font-bold mt-12 mb-6 text-ink">$1</h1>');

  // Links: [Label](url) -> red button link
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" class="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md transition-all duration-150 my-3 mx-auto block w-fit text-center font-sans text-sm" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // Lists processing
  const lines = html.split("\n");
  let inUl = false;
  let inOl = false;

  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    
    // Check Ul
    const ulMatch = trimmed.match(/^[-*]\s+(.*)/);
    // Check Ol
    const olMatch = trimmed.match(/^\d+\.\s+(.*)/);

    if (ulMatch) {
      let prefix = "";
      if (inOl) { inOl = false; prefix += "</ol>"; }
      if (!inUl) {
        inUl = true;
        prefix += '<ul class="list-disc pl-5 my-3 space-y-1">';
      }
      return `${prefix}<li>${ulMatch[1]}</li>`;
    } else if (olMatch) {
      let prefix = "";
      if (inUl) { inUl = false; prefix += "</ul>"; }
      if (!inOl) {
        inOl = true;
        prefix += '<ol class="list-decimal pl-5 my-3 space-y-1">';
      }
      return `${prefix}<li>${olMatch[1]}</li>`;
    } else {
      let suffix = "";
      if (inUl) { inUl = false; suffix = "</ul>"; }
      if (inOl) { inOl = false; suffix = "</ol>"; }
      
      const leadingSpaces = line.match(/^(\s+)/);
      const indent = leadingSpaces ? leadingSpaces[1].length : 0;
      if (indent > 0 && trimmed !== "") {
        const indentHtml = "&nbsp;".repeat(indent);
        return suffix + indentHtml + trimmed;
      }
      return suffix + line;
    }
  });

  if (inUl) processedLines.push("</ul>");
  if (inOl) processedLines.push("</ol>");

  let finalHtml = processedLines.join("\n");
  
  // Clean up <br /> around block elements so they don't break layout
  finalHtml = finalHtml.replace(/<\/h([1-3])>\n/g, "</h$1>");
  finalHtml = finalHtml.replace(/<\/ul>\n/g, "</ul>");
  finalHtml = finalHtml.replace(/<\/ol>\n/g, "</ol>");
  finalHtml = finalHtml.replace(/<\/div>\n/g, "</div>");
  finalHtml = finalHtml.replace(/<\/figure>\n/g, "</figure>");
  
  return finalHtml.replace(/\n/g, "<br />");
}
