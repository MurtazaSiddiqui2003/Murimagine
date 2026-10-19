 "use client";

import { useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Check, ChevronDown, Clock3, ImagePlus, LoaderCircle, LockKeyhole, Plus, Sparkles, WandSparkles, X } from "lucide-react";

type Ratio = "square" | "portrait" | "landscape" | "tall";
type Creation = { id: string; url: string; prompt: string; ratio: Ratio; createdAt: number };

const ratioOptions: { id: Ratio; label: string; size: string }[] = [
  { id: "square", label: "Square", size: "1:1" },
  { id: "portrait", label: "Portrait", size: "2:3" },
  { id: "landscape", label: "Landscape", size: "3:2" },
  { id: "tall", label: "Tall", size: "4:7" },
];

const examples = [
  { title: "Editorial portrait", prompt: "An elegant editorial portrait photographed on medium-format film, natural skin texture, sculptural soft window light, warm ivory studio, understated luxury fashion campaign, 85mm lens, realistic details." },
  { title: "Product photography", prompt: "Premium product photograph of a minimal amber glass perfume bottle on a sculptural limestone plinth, soft directional sunlight, subtle shadows, warm ivory backdrop, luxury beauty campaign, photorealistic, refined composition." },
  { title: "Cinematic landscape", prompt: "A cinematic futuristic Karachi skyline at blue hour, atmospheric haze over the Arabian Sea, contemporary architecture, subtle warm lights, realistic urban detail, premium film still, wide composition." },
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<Ratio>("portrait");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState<Creation | null>(null);
  const [history, setHistory] = useState<Creation[]>([]);
  const [showRatios, setShowRatios] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function saveHistory(next: Creation[]) {
    // Object URLs are intentionally session-only. Do not persist them in localStorage:
    // they are invalid after reload and would create broken history entries.
    setHistory(next);
  }

  async function generate() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), aspectRatio: ratio }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Generation failed. Please try again.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const creation: Creation = {
        id: crypto.randomUUID(),
        url,
        prompt: prompt.trim(),
        ratio,
        createdAt: Date.now(),
      };
      setCurrent(creation);
      saveHistory([creation, ...history.filter((item) => item.id !== creation.id)].slice(0, 12));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function download(creation: Creation | null) {
    if (!creation) return;
    const link = document.createElement("a");
    link.href = creation.url;
    link.download = `image-atelier-${creation.id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function clearHistory() {
    history.forEach((item) => URL.revokeObjectURL(item.url));
    setHistory([]);
    setCurrent(null);
  }

  const selectedRatio = ratioOptions.find((item) => item.id === ratio)!;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-black/[0.06] bg-[#f7f6f3]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-8">
          <a href="#" className="flex items-center gap-3" aria-label="Image Atelier home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#292722] text-[#f5eee3]"><WandSparkles size={18} /></span>
            <span>
              <span className="block text-[15px] font-semibold tracking-[-0.04em]">Image Atelier</span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-[0.2em] text-[#858078]">Private creative studio</span>
            </span>
          </a>
          <div className="hidden items-center gap-2 rounded-full border border-[#e5e1d9] bg-white/70 px-3 py-2 text-xs text-[#69665f] sm:flex">
            <LockKeyhole size={13} /> Private by default
          </div>
          <button onClick={() => { setPrompt(""); setError(""); }} className="flex items-center gap-2 border border-[#dedad2] bg-white px-3 py-2.5 text-xs font-medium transition hover:bg-[#f1eee8] sm:px-4">
            <Plus size={15} /> <span className="hidden sm:inline">New creation</span><span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-10 lg:py-12">
        <section className="min-w-0">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a7956]"><Sparkles size={13} /> Your imagination, rendered</div>
              <h1 className="max-w-2xl text-3xl font-medium leading-tight tracking-[-0.055em] sm:text-4xl lg:text-[46px]">Make something <span className="font-serif italic text-[#9a7956]">remarkable.</span></h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#77736c]">Describe the image in your head. We’ll turn your words into a visual starting point.</p>
            </div>
            <span className="mb-1 inline-flex items-center gap-2 text-[11px] text-[#8a857d]"><span className="h-1.5 w-1.5 rounded-full bg-[#8e9b7c]" /> Early access · Personal workspace</span>
          </div>

          <div className="overflow-hidden border border-[#e5e1da] bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-[#efede8] px-4 py-3 sm:px-5">
              <span className="text-xs font-semibold tracking-wide">Canvas</span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#8c877f]"><LockKeyhole size={12} /> Only saved in this browser</span>
            </div>
            <div className="relative flex min-h-[340px] items-center justify-center bg-[#f0eee9] p-4 sm:min-h-[490px] sm:p-8">
              {current ? (
                <div className="group relative max-h-[660px] max-w-full">
                  <img src={current.url} alt={current.prompt} className="max-h-[620px] max-w-full object-contain shadow-[0_12px_40px_rgba(30,25,18,0.12)]" />
                  <button onClick={() => download(current)} className="absolute bottom-3 right-3 flex items-center gap-2 border border-white/30 bg-[#24231f]/90 px-3 py-2.5 text-xs text-white backdrop-blur transition hover:bg-black"><ArrowDownToLine size={14} /> Download</button>
                </div>
              ) : busy ? (
                <div className="flex max-w-xs flex-col items-center text-center">
                  <div className="mb-5 grid h-16 w-16 place-items-center rounded-full border border-[#d8d0c3] bg-white"><LoaderCircle className="animate-spin text-[#9a7956]" size={26} /></div>
                  <h2 className="text-lg font-medium tracking-tight">Creating your image</h2>
                  <p className="mt-2 text-sm leading-6 text-[#827d74]">The model is working on your prompt. First requests can take longer while the provider wakes up.</p>
                  <div className="mt-5 h-1 w-40 overflow-hidden bg-[#ded9d0]"><div className="h-full w-1/2 animate-pulse bg-[#9a7956]" /></div>
                </div>
              ) : (
                <div className="flex max-w-sm flex-col items-center text-center">
                  <div className="relative mb-5 grid h-[82px] w-[82px] place-items-center border border-[#ded8ce] bg-white shadow-sm">
                    <div className="absolute inset-2 border border-dashed border-[#d6cbbd]" /><ImagePlus size={27} strokeWidth={1.2} className="text-[#9a7956]" />
                  </div>
                  <h2 className="text-lg font-medium tracking-tight">Your next idea starts here</h2>
                  <p className="mt-2 text-sm leading-6 text-[#858078]">Your generated image will appear here. Start with a prompt or choose an idea from the inspiration panel.</p>
                  <div className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#a09a91]"><span className="h-px w-7 bg-[#d9d3c9]" /> Image preview <span className="h-px w-7 bg-[#d9d3c9]" /></div>
                </div>
              )}
            </div>
            {error && <div role="alert" className="flex items-start gap-2 border-t border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"><X size={16} className="mt-0.5 shrink-0" />{error}</div>}
            <div className="p-4 sm:p-5">
              <label htmlFor="prompt" className="mb-2 block text-xs font-semibold">Describe your image</label>
              <textarea id="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={1200} rows={4} placeholder="A beautiful editorial photograph of..." className="w-full resize-y border border-[#e5e1da] bg-[#fdfcfb] px-4 py-3.5 text-sm leading-6 outline-none transition placeholder:text-[#aaa49a] focus:border-[#b49a7b]" />
              <div className="mt-2 flex justify-between text-[10px] text-[#9a958c]"><span>Be specific about lighting, materials, mood and composition.</span><span>{prompt.length}/1200</span></div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="relative">
                  <button onClick={() => setShowRatios(!showRatios)} className="flex items-center gap-2 border border-[#e5e1da] bg-white px-3 py-2.5 text-xs transition hover:bg-[#f8f6f2]" aria-expanded={showRatios}>
                    <span className="inline-block h-3 w-3 border border-[#777168]" /> {selectedRatio.label} <span className="text-[#9a958c]">{selectedRatio.size}</span><ChevronDown size={13} />
                  </button>
                  {showRatios && <div className="absolute bottom-full left-0 z-10 mb-2 min-w-[180px] border border-[#e5e1da] bg-white p-1 shadow-lg">
                    {ratioOptions.map((option) => <button key={option.id} onClick={() => { setRatio(option.id); setShowRatios(false); }} className="flex w-full items-center justify-between px-3 py-2.5 text-xs hover:bg-[#f4f1eb]"><span>{option.label}</span><span className="text-[#9a958c]">{option.size}{ratio === option.id ? " ✓" : ""}</span></button>)}
                  </div>}
                </div>
                <button onClick={generate} disabled={!prompt.trim() || busy} className="flex min-w-[155px] items-center justify-center gap-2 bg-[#292722] px-5 py-3 text-xs font-medium text-white transition hover:bg-[#484238] disabled:cursor-not-allowed disabled:opacity-40">
                  {busy ? <><LoaderCircle size={15} className="animate-spin" /> Generating…</> : <><Sparkles size={15} /> Generate image <ArrowUpRight size={14} /></>}
                </button>
              </div>
              <p className="mt-4 text-[10px] leading-5 text-[#9a958c]">Generation depends on provider availability and free quota. This app never switches to a paid provider automatically.</p>
            </div>
          </div>

          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#9a7956]">A little inspiration</p><h2 className="mt-1 text-lg font-medium tracking-tight">Start with an idea</h2></div>
              <span className="text-[11px] text-[#99938a]">Tap to use a prompt</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {examples.map((example, index) => <button key={example.title} onClick={() => setPrompt(example.prompt)} className="group border border-[#e5e1da] bg-white p-4 text-left transition hover:border-[#c8b69e] hover:shadow-sm">
                <div className="mb-5 flex h-20 items-center justify-center bg-[#f0eee9] text-[#a18c70]">
                  {index === 0 ? <Sparkles size={22} strokeWidth={1.2} /> : index === 1 ? <ImagePlus size={22} strokeWidth={1.2} /> : <WandSparkles size={22} strokeWidth={1.2} />}
                </div>
                <div className="flex items-center justify-between gap-2 text-xs font-semibold"><span>{example.title}</span><ArrowUpRight size={13} className="text-[#a59d92] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#8a857d]">{example.prompt}</p>
              </button>)}
            </div>
          </section>
        </section>

        <aside className="min-w-0">
          <div className="border border-[#e5e1da] bg-white p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#9a7956]">Workspace</p><h2 className="mt-1 text-lg font-medium tracking-tight">Your creations</h2></div>
              <span className="grid h-9 w-9 place-items-center border border-[#eeeae3] bg-[#faf9f6]"><Clock3 size={16} className="text-[#938775]" /></span>
            </div>
            <div className="mt-5 flex items-center justify-between border-y border-[#efede8] py-3 text-xs"><span className="text-[#8a857d]">Recent images</span><span className="font-medium">{history.length} / 12</span></div>
            {history.length ? <div className="mt-4 grid grid-cols-2 gap-2">
              {history.map((item) => <button key={item.id} onClick={() => { setCurrent(item); setPrompt(item.prompt); setRatio(item.ratio); }} className={`group relative overflow-hidden border text-left ${current?.id === item.id ? "border-[#9a7956]" : "border-[#eeeae3]"}`}>
                <img src={item.url} alt="" className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-white/90 px-2 py-2 text-[10px] text-[#5f5a52]">{item.prompt}</span>
                {current?.id === item.id && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center bg-[#292722] text-white"><Check size={12} /></span>}
              </button>)}
            </div> : <div className="mt-4 flex min-h-[180px] flex-col items-center justify-center border border-dashed border-[#e4dfd6] bg-[#fbfaf8] px-5 text-center">
              <ImagePlus size={23} strokeWidth={1.2} className="text-[#a69a88]" />
              <p className="mt-3 text-xs font-medium">Nothing here just yet</p><p className="mt-1 text-[11px] leading-5 text-[#918b82]">Your generated images will appear here during this session.</p>
            </div>}
            {history.length > 0 && <div className="mt-4 flex gap-2">
              <button onClick={() => download(current || history[0])} className="flex flex-1 items-center justify-center gap-2 border border-[#e5e1da] px-3 py-2.5 text-[11px] hover:bg-[#f8f6f2]"><ArrowDownToLine size={13} /> Download selected</button>
              <button onClick={clearHistory} aria-label="Clear local history" className="border border-[#e5e1da] px-3 py-2.5 text-[11px] text-[#8b6259] hover:bg-red-50"><X size={13} /></button>
            </div>}
          </div>
          <div className="mt-4 border border-[#e5e1da] bg-[#eeebe4] p-5">
            <div className="flex items-center gap-2 text-xs font-semibold"><LockKeyhole size={14} /> Privacy note</div>
            <p className="mt-2 text-[11px] leading-5 text-[#777168]">Your prompts and image history are stored in this browser only. Image generation requests go to the configured AI provider. Avoid sending sensitive or confidential photos or prompts.</p>
          </div>
          <div className="mt-4 px-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#a39b90]">MVP status</p>
            <div className="mt-3 space-y-3">
              {[["Studio interface","Ready"],["Secure server route","Ready"],["AI provider access","Needs setup"],["Persistent cloud library","Later"]].map(([label, status]) => <div key={label} className="flex items-center justify-between text-[11px]"><span className="text-[#777168]">{label}</span><span className={status === "Ready" ? "text-[#6f8061]" : "text-[#9a7956]"}>{status}</span></div>)}
            </div>
          </div>
        </aside>
      </div>
      <footer className="border-t border-[#e5e1da] px-4 py-6 text-center text-[10px] tracking-wide text-[#a19a90]">IMAGE ATELIER · A PRIVATE CREATIVE SPACE · EARLY MVP</footer>
    </main>
  );
}
