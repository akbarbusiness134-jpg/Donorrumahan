import { useRef, useEffect } from "react";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link2, ImagePlus, Type } from "lucide-react";
import { compressImage } from "@/lib/utils";
import { uploadBase64ToSupabase } from "@/lib/supabase";
import { toast } from "sonner";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Only update if it's truly different to avoid cursor jumps
      if (value === "" || !editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleLink = () => {
    const url = prompt("Masukkan URL Link (misal: https://pmi.or.id):", "https://");
    if (!url) return;
    
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== "") {
      // Create a special button/link structure if we want, but standard link is fine
      // Since our frontend renders a special button for standard markdown links, 
      // let's just insert a styled anchor tag here to look good in the WYSIWYG
      const a = document.createElement("a");
      a.href = url;
      a.className = "inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md transition-all duration-150 my-3 mx-auto block w-fit text-center font-sans text-sm";
      a.innerText = selection.toString();
      a.target = "_blank";
      
      exec("insertHTML", a.outerHTML);
    } else {
      const label = prompt("Masukkan Teks/Label Tombol:", "Kunjungi Tautan");
      if (!label) return;
      const html = `<a href="${url}" class="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md transition-all duration-150 my-3 mx-auto block w-fit text-center font-sans text-sm" target="_blank" rel="noopener noreferrer">${label}</a>`;
      exec("insertHTML", html);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto terlalu besar. Maksimal 5MB.");
      e.target.value = "";
      return;
    }

    try {
      toast.loading("Mengunggah gambar ke Cloud...", { id: "editor-upload" });
      const compressed = await compressImage(file);
      const finalUrl = await uploadBase64ToSupabase(compressed, 'article');
      toast.success("Foto berhasil diunggah!", { id: "editor-upload" });
      
      const caption = prompt("Masukkan Teks Caption Gambar:", "Keterangan Gambar");
      if (caption === null) return;
      const sizePrompt = prompt("Pilih Ukuran (kecil, sedang, besar, penuh):", "sedang");
      if (sizePrompt === null) return;
      const s = sizePrompt.trim().toLowerCase();
      
      let widthClass = "w-1/2"; // default sedang
      if (s === "kecil") widthClass = "w-1/3 min-w-[200px]";
      else if (s === "besar") widthClass = "w-3/4";
      else if (s === "penuh") widthClass = "w-full";

      const pos = prompt("Pilih Posisi (kiri, kanan, tengah):", "tengah");
      if (pos === null) return;

      const p = pos.trim().toLowerCase();
      let figureClass = `my-6 mx-auto text-center overflow-hidden ${widthClass}`;
      let imgClass = "mx-auto block rounded-xl shadow-md max-w-full h-auto";
      
      if (p === "kiri" || p === "left") {
        figureClass = `float-left mr-6 mb-4 ${widthClass}`;
      } else if (p === "kanan" || p === "right") {
        figureClass = `float-right ml-6 mb-4 ${widthClass}`;
      }

      const html = `<figure class="${figureClass}"><img src="${finalUrl}" alt="${caption}" class="w-full h-auto rounded-xl border object-cover shadow-sm" loading="lazy" /><figcaption class="mt-2.5 text-sm text-gray-500 italic px-4 border-l-2 border-primary/30 inline-block">${caption}</figcaption></figure><p><br/></p>`;
      
      exec("insertHTML", html);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunggah foto", { id: "editor-upload" });
    } finally {
      e.target.value = "";
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Basic fix for enter creating divs instead of paragraphs in some browsers
    if (e.key === "Enter" && !e.shiftKey) {
      document.execCommand("defaultParagraphSeparator", false, "p");
    }
  };

  return (
    <div className="mt-1.5 overflow-hidden rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5">
        <input 
          type="file" 
          id="wysiwyg-image-upload" 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageUpload} 
        />
        {[
          { Icon: Type, action: () => exec("formatBlock", "P"), label: "Teks Normal (Paragraf)" },
          { Icon: Heading2, action: () => exec("formatBlock", "H2"), label: "Judul Besar (H2)" },
          { Icon: Heading3, action: () => exec("formatBlock", "H3"), label: "Judul Sedang (H3)" },
          { type: "divider" },
          { Icon: Bold, action: () => exec("bold"), label: "Tebal" },
          { Icon: Italic, action: () => exec("italic"), label: "Miring" },
          { type: "divider" },
          { Icon: AlignLeft, action: () => exec("justifyLeft"), label: "Rata Kiri" },
          { Icon: AlignCenter, action: () => exec("justifyCenter"), label: "Rata Tengah" },
          { Icon: AlignRight, action: () => exec("justifyRight"), label: "Rata Kanan" },
          { Icon: AlignJustify, action: () => exec("justifyFull"), label: "Rata Kiri Kanan" },
          { type: "divider" },
          { Icon: List, action: () => exec("insertUnorderedList"), label: "Daftar Bulat" },
          { Icon: ListOrdered, action: () => exec("insertOrderedList"), label: "Daftar Angka" },
          { type: "divider" },
          { Icon: Link2, action: handleLink, label: "Buat Tombol Link" },
          { Icon: ImagePlus, action: () => document.getElementById("wysiwyg-image-upload")?.click(), label: "Sisipkan Gambar (Upload)" },
        ].map((item, i) => (
          item.type === "divider" ? (
            <div key={i} className="w-[1px] h-4 bg-border mx-1" />
          ) : (
            <button
              key={i}
              type="button"
              title={item.label}
              onMouseDown={(e) => { e.preventDefault(); item.action!(); }} // use onMouseDown to prevent losing focus
              className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground transition"
            >
              {item.Icon && <item.Icon className="h-3.5 w-3.5" />}
            </button>
          )
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-4 text-[15px] outline-none min-h-[400px] prose prose-red max-w-none [&>p]:mb-4"
      />
    </div>
  );
}
