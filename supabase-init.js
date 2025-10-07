// supabase-init.js (personalizado)
// Carregar ANTES deste arquivo:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

export const URL_DO_PROJETO = "https://vancujvcrurprdfeaiie.supabase.co";
export const CHAVE_PUBLICA_ANONIMA = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbmN1anZjcnVycHJkZmVhaWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjYxNzAsImV4cCI6MjA3NTM0MjE3MH0.AMvEP1ko_8svD_FpWhAnt8OzdMe7vX7pg9qo0rHISEU";
export const sb = supabase.createClient(URL_DO_PROJETO, CHAVE_PUBLICA_ANONIMA);

// ===== Helpers em português =====

export async function salvarSolicitacao(dados) {
  const { data, error } = await sb.from("requests").insert(dados).select().single();
  if (error) throw error;
  return data;
}

export async function salvarHistoricoStatus(request_id, status, nota = "") {
  const { error } = await sb.from("status_history").insert({ request_id, status, nota });
  if (error) throw error;
}

export async function atualizarStatusSolicitacao(request_id, status, nota = "Alterado via site") {
  const { error } = await sb.from("requests").update({ status }).eq("id", request_id);
  if (error) throw error;
  await salvarHistoricoStatus(request_id, status, nota);
}

export async function enviarArquivo(file) {
  const caminho = `${Date.now()}_${file.name}`;
  const { data, error } = await sb.storage.from("uploads").upload(caminho, file);
  if (error) throw error;
  const { data: pub } = sb.storage.from("uploads").getPublicUrl(data.path);
  return pub.publicUrl;
}

export async function salvarOCR({ request_id = null, image_url = null, textoBruto = "", dadosExtraidos = null }) {
  const payload = {
    request_id,
    image_url,
    raw_text: textoBruto,
    parsed: dadosExtraidos
  };
  const { error } = await sb.from("ocr_logs").insert(payload);
  if (error) throw error;
}

export async function listarSolicitacoes() {
  const { data, error } = await sb.from("requests").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Expor no window (se não usar módulos)
window.SB = {
  sb,
  salvarSolicitacao,
  salvarHistoricoStatus,
  atualizarStatusSolicitacao,
  enviarArquivo,
  salvarOCR,
  listarSolicitacoes,
};
