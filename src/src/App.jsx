import { useState, useRef, useCallback } from “react”;

const BACKGROUNDS = [
{ id: “custom”, label: “Mon propre fond”, icon: “🖼️”, desc: “Uploader votre fond” },
{ id: “marble”, label: “Marbre blanc”, icon: “🤍”, desc: “Sol en marbre blanc luxueux” },
{ id: “wood”, label: “Parquet bois”, icon: “🪵”, desc: “Parquet en bois naturel chaud” },
{ id: “linen”, label: “Lin beige”, icon: “🌾”, desc: “Tissu lin texturé beige” },
{ id: “concrete”, label: “Béton gris”, icon: “🩶”, desc: “Sol béton ciré industriel” },
{ id: “flowers”, label: “Pétales & fleurs”, icon: “🌸”, desc: “Entouré de fleurs fraîches” },
{ id: “terrazzo”, label: “Terrazzo pastel”, icon: “🎨”, desc: “Sol terrazzo coloré tendance” },
{ id: “custom_desc”, label: “Description libre”, icon: “✍️”, desc: “Décrivez votre fond idéal” },
];

const MOODS = [
{ id: “editorial”, label: “Éditorial”, emoji: “🖤” },
{ id: “cozy”, label: “Cosy / Hygge”, emoji: “🕯️” },
{ id: “luxury”, label: “Luxe & raffiné”, emoji: “✨” },
{ id: “summer”, label: “Été vibrant”, emoji: “🌞” },
{ id: “minimal”, label: “Ultra minimaliste”, emoji: “◻️” },
];

const LIGHTING = [
{ id: “natural”, label: “Lumière naturelle”, emoji: “☀️” },
{ id: “golden”, label: “Golden hour”, emoji: “🌅” },
{ id: “studio”, label: “Studio diffus”, emoji: “💡” },
{ id: “moody”, label: “Contraste dramatique”, emoji: “🌑” },
];

function Step({ num, label, active, done }) {
return (
<div style={{ display: “flex”, alignItems: “center”, gap: 8, opacity: active || done ? 1 : 0.35 }}>
<div style={{
width: 28, height: 28, borderRadius: “50%”,
background: done ? “#C8A96E” : active ? “#1a1a1a” : “#e5e7eb”,
color: done || active ? “#fff” : “#9ca3af”,
display: “flex”, alignItems: “center”, justifyContent: “center”,
fontSize: 13, fontWeight: 800, flexShrink: 0,
transition: “all 0.3s”,
}}>
{done ? “✓” : num}
</div>
<span style={{ fontSize: 13, fontWeight: done || active ? 700 : 500, color: active ? “#1a1a1a” : done ? “#C8A96E” : “#9ca3af”, transition: “all 0.3s” }}>{label}</span>
</div>
);
}

function UploadZone({ label, onFile, preview, accept = “image/*”, icon = “📤” }) {
const ref = useRef();
const [drag, setDrag] = useState(false);
return (
<div
onClick={() => ref.current.click()}
onDragOver={e => { e.preventDefault(); setDrag(true); }}
onDragLeave={() => setDrag(false)}
onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
style={{
border: `2px dashed ${drag ? "#C8A96E" : "#d1d5db"}`,
borderRadius: 16,
padding: “24px 20px”,
textAlign: “center”,
cursor: “pointer”,
background: drag ? “#fffbf5” : preview ? “#f9fafb” : “#fafafa”,
transition: “all 0.2s”,
position: “relative”,
overflow: “hidden”,
minHeight: 140,
display: “flex”,
flexDirection: “column”,
alignItems: “center”,
justifyContent: “center”,
gap: 8,
}}
>
<input ref={ref} type=“file” accept={accept} style={{ display: “none” }} onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
{preview ? (
<img src={preview} alt=“preview” style={{ maxHeight: 180, maxWidth: “100%”, borderRadius: 10, objectFit: “contain” }} />
) : (
<>
<span style={{ fontSize: 32 }}>{icon}</span>
<span style={{ fontSize: 14, fontWeight: 700, color: “#374151” }}>{label}</span>
<span style={{ fontSize: 12, color: “#9ca3af” }}>Glisser-déposer ou cliquer</span>
</>
)}
{preview && (
<div style={{ position: “absolute”, bottom: 8, right: 8, background: “#C8A96E”, color: “#fff”, borderRadius: 8, padding: “3px 10px”, fontSize: 11, fontWeight: 800 }}>
✓ Chargé
</div>
)}
</div>
);
}

function Spinner() {
return (
<div style={{ display: “flex”, flexDirection: “column”, alignItems: “center”, gap: 16, padding: “40px 0” }}>
<style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse2{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
<div style={{ width: 56, height: 56, border: “4px solid #f3f4f6”, borderTopColor: “#C8A96E”, borderRadius: “50%”, animation: “spin 1s linear infinite” }} />
<div style={{ fontSize: 14, fontWeight: 700, color: “#9ca3af”, animation: “pulse2 2s infinite” }}>
Génération en cours…
</div>
</div>
);
}

async function toBase64(file) {
return new Promise((res, rej) => {
const r = new FileReader();
r.onload = () => res(r.result.split(”,”)[1]);
r.onerror = rej;
r.readAsDataURL(file);
});
}

async function analyzeGarmentWithVision(garmentBase64, garmentType) {
// Uses Together AI vision model — avoids CORS issues in the browser
const response = await fetch(“https://api.together.xyz/v1/chat/completions”, {
method: “POST”,
headers: {
“Content-Type”: “application/json”,
“Authorization”: “Bearer “ + (window.TOGETHER_API_KEY || “”),
},
body: JSON.stringify({
model: “meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo”,
max_tokens: 300,
messages: [{
role: “user”,
content: [
{ type: “image_url”, image_url: { url: “data:” + garmentType + “;base64,” + garmentBase64 } },
{ type: “text”, text: “Describe this clothing item for a photo prompt: garment type, colors, patterns, material look, key details. Be concise. English only.” }
]
}]
})
});
const rawText = await response.text();
let data;
try { data = JSON.parse(rawText); } catch(e) { throw new Error(“Erreur lecture réponse vision: “ + rawText.slice(0, 100)); }
if (!response.ok) throw new Error(data?.error?.message || “Erreur vision “ + response.status);
return data?.choices?.[0]?.message?.content || “a stylish clothing item”;
}

async function buildFlatLayPrompt(garmentDescription, backgroundChoice, backgroundDesc, customBgBase64, customBgType, mood, lighting) {
const bgMap = {
marble: “pristine white Carrara marble floor surface with subtle veining”,
wood: “warm natural oak parquet wooden floor with fine grain texture”,
linen: “textured beige linen fabric surface, softly draped”,
concrete: “polished grey concrete floor with industrial finish”,
flowers: “scattered fresh flowers and petals (roses, peonies, eucalyptus) arranged artfully”,
terrazzo: “pastel terrazzo floor with colorful stone chips, trendy aesthetic”,
custom_desc: backgroundDesc || “neutral clean surface”,
};

const moodMap = {
editorial: “high fashion editorial magazine style, dramatic composition”,
cozy: “warm cozy hygge aesthetic, inviting and comfortable”,
luxury: “luxury brand campaign, refined and aspirational”,
summer: “vibrant summer energy, bright and fresh”,
minimal: “ultra-minimal Japanese aesthetic, clean and serene”,
};

const lightMap = {
natural: “soft natural daylight from a window, gentle shadows”,
golden: “warm golden hour sunlight, long soft shadows”,
studio: “even diffused studio lighting, professional product photography”,
moody: “dramatic contrast lighting with deep shadows”,
};

const bgDescription = backgroundChoice === “custom” ? “a clean, neutral photographic background” : bgMap[backgroundChoice] || bgMap.custom_desc;
const moodDesc = moodMap[mood] || moodMap.editorial;
const lightDesc = lightMap[lighting] || lightMap.natural;

const prompt = `Hyper-realistic flat lay fashion photography. The garment (${garmentDescription}) is laid flat on ${bgDescription}. The clothing appears naturally arranged as if gently placed by human hands — with organic, realistic folds and wrinkles, not perfectly flat. Photographed from directly above (bird's eye view). ${moodDesc}. ${lightDesc}. Shot on medium format camera, 85mm lens. Ultra-detailed, photorealistic, professional fashion photography, 8K resolution. No mannequin, no model, clothing only.`;

return prompt;
}

async function generateImageWithTogether(prompt) {
const response = await fetch(“https://api.together.xyz/v1/images/generations”, {
method: “POST”,
headers: {
“Content-Type”: “application/json”,
“Authorization”: “Bearer “ + (window.TOGETHER_API_KEY || “”),
},
body: JSON.stringify({
model: “black-forest-labs/FLUX.1-schnell-Free”,
prompt: prompt,
width: 1024,
height: 1024,
steps: 4,
n: 1,
})
});

// Read raw text first for better error diagnosis
const rawText = await response.text();
let data;
try {
data = JSON.parse(rawText);
} catch {
throw new Error(“Réponse illisible de Together AI. Vérifiez votre clé API.”);
}

if (!response.ok) {
const msg = data?.error?.message || data?.message || `Erreur ${response.status}`;
throw new Error(msg);
}

const item = data?.data?.[0];
if (!item) throw new Error(“Aucune image reçue dans la réponse Together AI.”);

// Together AI can return either a URL or base64
if (item.url) return item.url;
if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;

throw new Error(“Format d’image non reconnu dans la réponse Together AI.”);
}

export default function FlatLayBot() {
const [step, setStep] = useState(1);
const [garmentFile, setGarmentFile] = useState(null);
const [garmentPreview, setGarmentPreview] = useState(null);
const [bgChoice, setBgChoice] = useState(null);
const [bgPreview, setBgPreview] = useState(null);
const [bgFile, setBgFile] = useState(null);
const [bgCustomDesc, setBgCustomDesc] = useState(””);
const [mood, setMood] = useState(“editorial”);
const [lighting, setLighting] = useState(“natural”);
const [togetherKey, setTogetherKey] = useState(””);
const [loading, setLoading] = useState(false);
const [loadingMsg, setLoadingMsg] = useState(””);
const [result, setResult] = useState(null);
const [error, setError] = useState(null);
const [generatedPrompt, setGeneratedPrompt] = useState(””);
const [showPrompt, setShowPrompt] = useState(false);

const handleGarment = useCallback((file) => {
setGarmentFile(file);
const url = URL.createObjectURL(file);
setGarmentPreview(url);
}, []);

const handleBgFile = useCallback((file) => {
setBgFile(file);
const url = URL.createObjectURL(file);
setBgPreview(url);
}, []);

const generate = async () => {
if (!garmentFile) return;
setLoading(true);
setError(null);
setResult(null);
try {
setLoadingMsg(“🔍 Analyse du vêtement avec IA vision…”);
const garmentB64 = await toBase64(garmentFile);
const garmentDesc = await analyzeGarmentWithVision(garmentB64, garmentFile.type);

```
  setLoadingMsg("✍️ Création du prompt flat lay optimisé…");
  let bgB64 = null, bgType = null;
  if (bgChoice === "custom" && bgFile) {
    bgB64 = await toBase64(bgFile);
    bgType = bgFile.type;
  }
  const prompt = await buildFlatLayPrompt(garmentDesc, bgChoice, bgCustomDesc, bgB64, bgType, mood, lighting);
  setGeneratedPrompt(prompt);

  setLoadingMsg("🎨 Génération de la photo réaliste…");
  const imageUrl = await generateImageWithTogether(prompt);
  setResult(imageUrl);
  setStep(4);
} catch (e) {
  setError(e.message || "Une erreur est survenue");
}
setLoading(false);
```

};

const reset = () => {
setStep(1); setGarmentFile(null); setGarmentPreview(null);
setBgChoice(null); setBgPreview(null); setBgFile(null);
setBgCustomDesc(””); setMood(“editorial”); setLighting(“natural”);
setResult(null); setError(null); setGeneratedPrompt(””); setShowPrompt(false);
};

const canGenerate = garmentFile && bgChoice && togetherKey;

return (
<div style={{ minHeight: “100vh”, background: “#f8f5f0”, fontFamily: “‘Cormorant Garamond’, ‘Georgia’, serif” }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap'); * { box-sizing: border-box; } @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} } @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} } @keyframes spin { to{transform:rotate(360deg)} } .chip:hover { background: #1a1a1a !important; color: #fff !important; transform: translateY(-1px); } .bg-chip:hover { border-color: #C8A96E !important; background: #fffbf5 !important; } .btn-main:hover { background: #b8945a !important; transform: translateY(-2px); box-shadow: 0 8px 24px #C8A96E44 !important; } .btn-main:active { transform: translateY(0) !important; }`}</style>

```
  {/* Header */}
  <div style={{ background: "#1a1a1a", padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 26 }}>🪡</span>
      <div>
        <div style={{ color: "#C8A96E", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>FLAT LAY BOT</div>
        <div style={{ color: "#666", fontSize: 11, fontFamily: "'DM Sans', sans-serif", letterSpacing: 3, textTransform: "uppercase" }}>AI Fashion Photography</div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
      {[
        { n: 1, l: "Vêtement" },
        { n: 2, l: "Fond" },
        { n: 3, l: "Style" },
        { n: 4, l: "Résultat" },
      ].map(s => (
        <Step key={s.n} num={s.n} label={s.l} active={step === s.n} done={step > s.n} />
      ))}
    </div>
  </div>

  <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px 60px", fontFamily: "'DM Sans', sans-serif" }}>

    {/* API Key Notice */}
    <div style={{ background: "#fffbf5", border: "1.5px solid #C8A96E44", borderRadius: 14, padding: "14px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 12, animation: "fadeIn 0.4s ease" }}>
      <span style={{ fontSize: 20 }}>🔑</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#7c5c1e", marginBottom: 4 }}>Clé API Together AI requise</div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>Gratuit sur <strong>together.ai</strong> — FLUX.1 Schnell Free pour la génération d'images</div>
      </div>
      <input
        type="password"
        placeholder="Coller votre clé Together AI…"
        value={togetherKey}
        onChange={e => { setTogetherKey(e.target.value); window.TOGETHER_API_KEY = e.target.value; }}
        style={{ border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", width: 260, outline: "none", background: "#fff" }}
      />
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

      {/* LEFT — Step 1 & 2 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Step 1 — Garment */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 12px #0000000a", animation: "fadeIn 0.4s ease", border: step === 1 ? "2px solid #C8A96E" : "2px solid transparent", transition: "border 0.3s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a1a1a", color: "#C8A96E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>1</div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}>Votre vêtement</h2>
          </div>
          <UploadZone
            label="Uploader votre vêtement"
            onFile={f => { handleGarment(f); setStep(Math.max(step, 2)); }}
            preview={garmentPreview}
            icon="👕"
          />
          {garmentPreview && (
            <div style={{ marginTop: 10, background: "#f0fdf4", borderRadius: 10, padding: "8px 14px", fontSize: 12, color: "#166834", fontWeight: 600 }}>
              ✓ Claude va analyser ce vêtement automatiquement
            </div>
          )}
        </div>

        {/* Step 2 — Background */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 12px #0000000a", animation: "fadeIn 0.5s ease", border: step === 2 ? "2px solid #C8A96E" : "2px solid transparent", transition: "border 0.3s", opacity: !garmentFile ? 0.5 : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a1a1a", color: "#C8A96E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>2</div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}>Choisir le fond</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {BACKGROUNDS.map(bg => (
              <div
                key={bg.id}
                className="bg-chip"
                onClick={() => { if (garmentFile) { setBgChoice(bg.id); setStep(Math.max(step, 3)); }}}
                style={{
                  border: `2px solid ${bgChoice === bg.id ? "#C8A96E" : "#e5e7eb"}`,
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: garmentFile ? "pointer" : "not-allowed",
                  background: bgChoice === bg.id ? "#fffbf5" : "#fafafa",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 3 }}>{bg.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{bg.label}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{bg.desc}</div>
              </div>
            ))}
          </div>

          {bgChoice === "custom" && (
            <div style={{ marginTop: 14 }}>
              <UploadZone label="Uploader votre fond" onFile={handleBgFile} preview={bgPreview} icon="🖼️" />
            </div>
          )}
          {bgChoice === "custom_desc" && (
            <textarea
              placeholder="Ex: plancher en bois vintage avec de la mousse verte autour…"
              value={bgCustomDesc}
              onChange={e => setBgCustomDesc(e.target.value)}
              style={{ width: "100%", marginTop: 12, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "vertical", minHeight: 80, outline: "none" }}
            />
          )}
        </div>
      </div>

      {/* RIGHT — Step 3 & Generate */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Step 3 — Style */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 12px #0000000a", animation: "fadeIn 0.6s ease", border: step === 3 ? "2px solid #C8A96E" : "2px solid transparent", transition: "border 0.3s", opacity: !bgChoice ? 0.5 : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a1a1a", color: "#C8A96E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>3</div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}>Style & ambiance</h2>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Ambiance</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MOODS.map(m => (
                <button key={m.id} className="chip" onClick={() => setMood(m.id)} style={{
                  border: "none", borderRadius: 99, padding: "7px 14px",
                  background: mood === m.id ? "#1a1a1a" : "#f3f4f6",
                  color: mood === m.id ? "#fff" : "#374151",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                }}>
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Lumière</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LIGHTING.map(l => (
                <button key={l.id} className="chip" onClick={() => setLighting(l.id)} style={{
                  border: "none", borderRadius: 99, padding: "7px 14px",
                  background: lighting === l.id ? "#1a1a1a" : "#f3f4f6",
                  color: lighting === l.id ? "#fff" : "#374151",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                }}>
                  {l.emoji} {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 12px #0000000a", animation: "fadeIn 0.7s ease" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>Récapitulatif</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {[
              { label: "Vêtement", value: garmentFile?.name || "—", ok: !!garmentFile },
              { label: "Fond", value: bgChoice ? BACKGROUNDS.find(b => b.id === bgChoice)?.label : "—", ok: !!bgChoice },
              { label: "Ambiance", value: MOODS.find(m => m.id === mood)?.label, ok: true },
              { label: "Lumière", value: LIGHTING.find(l => l.id === lighting)?.label, ok: true },
              { label: "Clé Together AI", value: togetherKey ? "●●●●●●●●" : "Manquante", ok: !!togetherKey },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span style={{ color: "#9ca3af", fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: r.ok ? "#1a1a1a" : "#EF4444", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ color: r.ok && r.value !== "—" ? "#22c55e" : "#EF4444" }}>{r.ok && r.value !== "—" ? "✓" : "○"}</span>
                  {r.value}
                </span>
              </div>
            ))}
          </div>

          <button
            className="btn-main"
            onClick={generate}
            disabled={!canGenerate || loading}
            style={{
              width: "100%", padding: "16px", background: canGenerate && !loading ? "#C8A96E" : "#e5e7eb",
              color: canGenerate && !loading ? "#fff" : "#9ca3af",
              border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700,
              cursor: canGenerate && !loading ? "pointer" : "not-allowed",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
              boxShadow: canGenerate && !loading ? "0 4px 16px #C8A96E44" : "none",
            }}
          >
            {loading ? "⏳ Génération…" : "✨ Générer le Flat Lay"}
          </button>
        </div>
      </div>
    </div>

    {/* Loading */}
    {loading && (
      <div style={{ background: "#fff", borderRadius: 20, padding: "32px", marginTop: 20, textAlign: "center", boxShadow: "0 2px 12px #0000000a", animation: "fadeIn 0.3s ease" }}>
        <div style={{ width: 56, height: 56, border: "4px solid #f3f4f6", borderTopColor: "#C8A96E", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>{loadingMsg}</div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>Cela peut prendre 20-40 secondes…</div>
      </div>
    )}

    {/* Error */}
    {error && (
      <div style={{ background: "#fff1f2", border: "1.5px solid #fecaca", borderRadius: 16, padding: "16px 20px", marginTop: 20, animation: "fadeIn 0.3s ease" }}>
        <div style={{ fontWeight: 700, color: "#991b1b", marginBottom: 6 }}>❌ Erreur</div>
        <div style={{ fontSize: 13, color: "#7f1d1d" }}>{error}</div>
        {error.includes("together") || error.includes("401") ? (
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>Vérifiez votre clé API Together AI sur together.ai</div>
        ) : null}
      </div>
    )}

    {/* Result */}
    {result && (
      <div style={{ background: "#fff", borderRadius: 20, padding: "28px", marginTop: 20, boxShadow: "0 4px 24px #0000001a", animation: "fadeIn 0.5s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a1a", fontFamily: "'Cormorant Garamond', serif" }}>📸 Votre Flat Lay</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              style={{ background: "#f3f4f6", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "#374151" }}
            >
              {showPrompt ? "Masquer" : "🔍 Voir le prompt"}
            </button>
            <a
              href={result}
              download="flatlaybot-result.png"
              target="_blank"
              rel="noreferrer"
              style={{ background: "#1a1a1a", color: "#C8A96E", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
            >
              ⬇️ Télécharger
            </a>
            <button onClick={reset} style={{ background: "#C8A96E", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              🔄 Nouveau
            </button>
          </div>
        </div>

        <img
          src={result}
          alt="Generated flat lay"
          style={{ width: "100%", borderRadius: 16, display: "block", boxShadow: "0 8px 32px #0000001a" }}
        />

        {showPrompt && (
          <div style={{ marginTop: 16, background: "#f8f5f0", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Prompt généré par Claude</div>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, fontFamily: "monospace" }}>{generatedPrompt}</div>
          </div>
        )}
      </div>
    )}
  </div>
</div>
```

);
}
