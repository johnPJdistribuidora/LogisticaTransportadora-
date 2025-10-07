// integracao-supabase.js
// Este arquivo conecta elementos existentes do seu site ao Supabase.
// Regras de mapeamento (personalize os seletores conforme seu HTML):
// - Form de nova solicitação: <form id="form-solicitacao"> com inputs name="cliente", "numero", "endereco", "cep", "cidade", "estado", "data_prevista", "observacoes"
// - Upload de anexo: <form id="form-anexo"> com inputs name="request_id", <input type="file" name="file">, <select name="kind">
// - Select de status: qualquer <select class="js-status" data-request-id="...">

(async () => {
  // Detectar se o arquivo foi carregado como módulo ou por <script> tradicional
  const SB = window.SB || await import('./supabase-init.js');

  // 1) Nova solicitação
  const formSolic = document.getElementById('form-solicitacao');
  if (formSolic) {
    formSolic.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(formSolic);
      const payload = Object.fromEntries(fd.entries());
      try {
        const reg = await SB.salvarSolicitacao(payload);
        await SB.salvarHistoricoStatus(reg.id, reg.status || 'Pendente', 'Criado via site');
        alert('Solicitação salva! ID: ' + reg.id);
        formSolic.reset();
        document.dispatchEvent(new CustomEvent('sb:solicitacao-salva', { detail: reg }));
      } catch (err) {
        console.error(err);
        alert('Erro ao salvar solicitação.');
      }
    });
  }

  // 2) Upload de anexo
  const formAnexo = document.getElementById('form-anexo');
  if (formAnexo) {
    formAnexo.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(formAnexo);
      const file = fd.get('file');
      const request_id = fd.get('request_id');
      const kind = fd.get('kind');
      try {
        const url = await SB.enviarArquivo(file);
        const { error } = await SB.sb.from('attachments').insert({ request_id, file_url: url, kind });
        if (error) throw error;
        alert('Anexo enviado com sucesso!');
        formAnexo.reset();
        document.dispatchEvent(new CustomEvent('sb:anexo-enviado', { detail: { request_id, url, kind } }));
      } catch (err) {
        console.error(err);
        alert('Erro no upload do anexo.');
      }
    });
  }

  // 3) Atualização de status por dropdowns existentes
  document.addEventListener('change', async (e) => {
    const target = e.target;
    if (target && target.classList && target.classList.contains('js-status') && target.dataset.requestId) {
      const status = target.value;
      const id = target.dataset.requestId;
      try {
        await SB.atualizarStatusSolicitacao(id, status, 'Mudado pelo dropdown');
        alert('Status atualizado!');
      } catch (err) {
        console.error(err);
        alert('Erro ao atualizar status.');
      }
    }
  });

  // 4) Listagem (se existir o contêiner)
  async function renderLista() {
    const box = document.getElementById('lista-solicitacoes');
    if (!box) return;
    box.innerHTML = 'Carregando...';
    try {
      const itens = await SB.listarSolicitacoes();
      box.innerHTML = itens.map(r => `
        <div class="card">
          <b>${r.cliente || '-'}</b> — ${r.numero || '-'}<br>
          ${r.endereco || '-'} — ${r.cidade || ''}/${r.estado || ''} — CEP ${r.cep || ''}<br>
          Prevista: ${r.data_prevista || '-'} — Status:
          <select class="js-status" data-request-id="${r.id}">
            ${['Pendente','Cubagem','Solicitado','Coletado','Entregue'].map(s => `<option ${s===r.status?'selected':''}>${s}</option>`).join('')}
          </select>
          <br><small>${new Date(r.created_at).toLocaleString()}</small>
        </div>
      `).join('');
    } catch (err) {
      console.error(err);
      box.innerHTML = 'Erro ao carregar.';
    }
  }

  document.addEventListener('DOMContentLoaded', renderLista);
  document.addEventListener('sb:solicitacao-salva', renderLista);
})();
