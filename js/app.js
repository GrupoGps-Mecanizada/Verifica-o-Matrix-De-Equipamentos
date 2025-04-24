// URL do seu Web App publicado do Google Apps Script (SUBSTITUA PELO SEU URL)
const SCRIPT_URL = 'https://script.google.com/macros/s/SEU_ID_DO_SCRIPT_AQUI/exec';

// Variáveis globais para armazenar os dados
let allEquipments = [];
let allReports = [];
let currentFilter = 'all';
let searchTerm = '';

// Configuração dos itens de verificação por tipo de equipamento
const verificacaoItens = [
  {id: 'dispositivo_limite', titulo: 'Dispositivo de limite de velocidade (10 Km/h) com caçamba ou báscula elevada', 
   aplicaveis: {Poliguindaste: false, Vácuo: true, Hipervácuo: true, 'Alta pressão': false, 'Bomba sobre camionete': false, Aspirador: false}},
  
  {id: 'referencia', titulo: 'Referência', 
   aplicaveis: {Poliguindaste: true, Vácuo: true, Hipervácuo: true, 'Alta pressão': false, 'Bomba sobre camionete': false, Aspirador: true}},
  
  {id: 'dips', titulo: 'DIPS', 
   aplicaveis: {Poliguindaste: true, Vácuo: true, Hipervácuo: true, 'Alta pressão': true, 'Bomba sobre camionete': true, Aspirador: true}},
  
  {id: 'identificacao_pontos', titulo: 'Identificação (adesivos) dos pontos de apoio para subir e descer do equipamento', 
   aplicaveis: {Poliguindaste: true, Vácuo: true, Hipervácuo: true, 'Alta pressão': true, 'Bomba sobre camionete': true, Aspirador: true}},
  
  {id: 'luz_re', titulo: 'Luz de Ré', 
   aplicaveis: {Poliguindaste: true, Vácuo: true, Hipervácuo: true, 'Alta pressão': true, 'Bomba sobre camionete': true, Aspirador: true}},
  
  {id: 'anticolisao', titulo: 'Anticolisão', 
   aplicaveis: {Poliguindaste: false, Vácuo: true, Hipervácuo: true, 'Alta pressão': true, 'Bomba sobre camionete': true, Aspirador: true}},
  
  {id: 'laudo_integridade', titulo: 'Laudo de integridade mecânica', 
   aplicaveis: {Poliguindaste: true, Vácuo: true, Hipervácuo: true, 'Alta pressão': true, 'Bomba sobre camionete': true, Aspirador: true}},
  
  {id: 'plano_inspecao', titulo: 'Plano de inspeção e manutenção preventiva', 
   aplicaveis: {Poliguindaste: true, Vácuo: true, Hipervácuo: true, 'Alta pressão': true, 'Bomba sobre camionete': true, Aspirador: true}},
  
  {id: 'camera_re', titulo: 'Câmera de ré e sensor de estacionamento', 
   aplicaveis: {Poliguindaste: true, Vácuo: true, Hipervácuo: true, 'Alta pressão': true, 'Bomba sobre camionete': true, Aspirador: true}},
  
  {id: 'alerta_freio', titulo: 'Alerta de freio de estacionamento não acionado', 
   aplicaveis: {Poliguindaste: true, Vácuo: true, Hipervácuo: true, 'Alta pressão': true, 'Bomba sobre camionete': true, Aspirador: true}},
  
  {id: 'poltrona_ajustavel', titulo: 'Poltrona Ajustável com Sistema de Amortecimento', 
   aplicaveis: {Poliguindaste: true, Vácuo: true, Hipervácuo: true, 'Alta pressão': true, 'Bomba sobre camionete': true, Aspirador: false}},
  
  {id: 'sensor_fadiga', titulo: 'Sensor de fadiga do motorista/operador', 
   aplicaveis: {Poliguindaste: false, Vácuo: true, Hipervácuo: true, 'Alta pressão': true, 'Bomba sobre camionete': true, Aspirador: false}},
  
  {id: 'balanca_integrada', titulo: 'Balança integrada ao equipamento', 
   aplicaveis: {Poliguindaste: true, Vácuo: true, Hipervácuo: true, 'Alta pressão': true, 'Bomba sobre camionete': false, Aspirador: false}},
  
  {id: 'tag', titulo: 'TAG', 
   aplicaveis: {Poliguindaste: true, Vácuo: true, Hipervácuo: true, 'Alta pressão': true, 'Bomba sobre camionete': true, Aspirador: true}},
];

// Função que será executada quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  loadDashboardData();
  setupEventListeners();
  
  // Define a data de hoje como padrão no campo de data
  document.getElementById('verification-date').valueAsDate = new Date();
});

// Configura os manipuladores de eventos
function setupEventListeners() {
  // Navegação entre tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      this.classList.add('active');
      const tabId = 'tab-' + this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Filtros de equipamentos
  document.querySelectorAll('.filter-item').forEach(filter => {
    filter.addEventListener('click', function() {
      document.querySelectorAll('.filter-item').forEach(f => f.classList.remove('active'));
      this.classList.add('active');
      
      currentFilter = this.getAttribute('data-filter');
      updateEquipmentsTable();
    });
  });
  
  // Busca de equipamentos
  document.getElementById('search-input').addEventListener('input', function() {
    searchTerm = this.value;
    updateEquipmentsTable();
  });
  
  // Botões de exportação
  document.getElementById('export-excel').addEventListener('click', function() {
    fetchFromScript({action: 'exportData', format: 'excel'})
      .then(url => {
        if (url) {
          window.open(url, '_blank');
        } else {
          showError('Erro ao gerar a exportação');
        }
      })
      .catch(error => {
        showError('Erro ao exportar: ' + error);
      });
  });
  
  document.getElementById('export-pdf').addEventListener('click', function() {
    fetchFromScript({action: 'exportData', format: 'pdf'})
      .then(url => {
        if (url) {
          window.open(url, '_blank');
        } else {
          showError('Erro ao gerar a exportação');
        }
      })
      .catch(error => {
        showError('Erro ao exportar: ' + error);
      });
  });
  
  // Botão de novo registro
  document.getElementById('new-verification').addEventListener('click', function() {
    document.getElementById('form-overlay').style.display = 'block';
    document.getElementById('form-step-1').style.display = 'block';
    document.getElementById('form-step-2').style.display = 'none';
    document.getElementById('verification-form').reset();
  });
  
  // Cancelar formulário
  document.getElementById('cancel-form').addEventListener('click', function() {
    document.getElementById('form-overlay').style.display = 'none';
  });
  
  // Fechar formulário clicando fora dele
  document.getElementById('form-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
      this.style.display = 'none';
    }
  });
  
  // Botão próximo do formulário
  document.getElementById('next-step-1').addEventListener('click', function() {
    // Validar campos obrigatórios
    const equipmentId = document.getElementById('equipment-id').value;
    const equipmentType = document.getElementById('equipment-type').value;
    const responsibleName = document.getElementById('responsible-name').value;
    const verificationDate = document.getElementById('verification-date').value;
    
    if (!equipmentId || !equipmentType || !responsibleName || !verificationDate) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    // Verifica se o equipamento já foi verificado
    fetchFromScript({action: 'verificarEquipamento', idPlaca: equipmentId})
      .then(result => {
        if (result === "OK") {
          // Equipamento não existe ou não foi verificado, continua para a próxima etapa
          document.getElementById('form-step-1').style.display = 'none';
          document.getElementById('form-step-2').style.display = 'block';
          gerarItensVerificacao(document.getElementById('equipment-type').value);
        } else {
          // Equipamento já foi verificado, mostra mensagem
          showError(result);
        }
      })
      .catch(error => {
        showError('Erro ao verificar equipamento: ' + error);
      });
  });
  
  // Botão voltar do formulário
  document.getElementById('prev-step-2').addEventListener('click', function() {
    document.getElementById('form-step-1').style.display = 'block';
    document.getElementById('form-step-2').style.display = 'none';
  });
  
  // Mudança no tipo de equipamento
  document.getElementById('equipment-type').addEventListener('change', function() {
    if (this.value) {
      gerarItensVerificacao(this.value);
    }
  });
  
  // Envio do formulário
  document.getElementById('verification-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Coletar todos os dados do formulário
    const formData = {
      equipmentId: document.getElementById('equipment-id').value,
      equipmentType: document.getElementById('equipment-type').value,
      responsibleName: document.getElementById('responsible-name').value,
      verificationDate: document.getElementById('verification-date').value,
      observations: document.getElementById('observations').value,
      items: {}
    };
    
    // Verificar se todos os itens estão respondidos
    const tipoEquipamento = formData.equipmentType;
    const itensAplicaveis = verificacaoItens.filter(item => item.aplicaveis[tipoEquipamento]);
    
    for (const item of itensAplicaveis) {
      const radioButtons = document.querySelectorAll(`input[name="${item.id}"]:checked`);
      if (radioButtons.length === 0) {
        showError(`Por favor, responda todos os itens de verificação.`);
        return;
      }
      formData.items[item.id] = document.querySelector(`input[name="${item.id}"]:checked`).value;
    }
    
    // Enviar dados para o servidor
    fetchFromScript({action: 'salvarVerificacao', formData: formData})
      .then(result => {
        // Esconde o formulário
        document.getElementById('form-overlay').style.display = 'none';
        
        // Mostra mensagem de sucesso
        showSuccess('Verificação registrada com sucesso!');
        
        // Recarrega os dados
        loadDashboardData();
      })
      .catch(error => {
        showError('Erro ao enviar verificação: ' + error);
      });
  });
}

// Gera os campos de verificação com base no tipo de equipamento
function gerarItensVerificacao(tipoEquipamento) {
  const container = document.getElementById('dynamic-verification-items');
  container.innerHTML = '';
  
  if (!tipoEquipamento) {
    return;
  }
  
  // Filtra os itens aplicáveis ao tipo de equipamento selecionado
  const itensAplicaveis = verificacaoItens.filter(item => item.aplicaveis[tipoEquipamento]);
  
  // Cria os elementos de formulário para cada item
  itensAplicaveis.forEach(item => {
    const formItem = document.createElement('div');
    formItem.className = 'form-item';
    
    const title = document.createElement('div');
    title.className = 'form-item-title';
    title.textContent = item.titulo;
    formItem.appendChild(title);
    
    // Opções de resposta
    const opcoes = ['Conforme', 'Não Conforme', 'Não Aplicável'];
    opcoes.forEach((opcao, index) => {
      const formCheck = document.createElement('div');
      formCheck.className = 'form-check';
      
      const input = document.createElement('input');
      input.type = 'radio';
      input.id = `${item.id}-${index}`;
      input.name = item.id;
      input.value = opcao;
      
      const label = document.createElement('label');
      label.setAttribute('for', `${item.id}-${index}`);
      label.textContent = opcao;
      
      formCheck.appendChild(input);
      formCheck.appendChild(label);
      formItem.appendChild(formCheck);
    });
    
    container.appendChild(formItem);
  });
}

// Função para fazer requisições ao Apps Script via fetch API
async function fetchFromScript(params) {
  showLoading(true);
  
  try {
    // Prepara a URL com os parâmetros (para GET requests simples)
    let url = new URL(SCRIPT_URL);
    
    if (params.action === 'getDashboardData') {
      // GET request simples
      url.searchParams.append('action', params.action);
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      return data;
    } else if (params.action === 'verificarEquipamento') {
      // GET request com parâmetro
      url.searchParams.append('action', params.action);
      url.searchParams.append('idPlaca', params.idPlaca);
      
      const response = await fetch(url.toString());
      const data = await response.text();
      
      return data;
    } else if (params.action === 'exportData') {
      // GET request para exportação
      url.searchParams.append('action', params.action);
      url.searchParams.append('format', params.format);
      
      const response = await fetch(url.toString());
      const data = await response.text();
      
      return data;
    } else if (params.action === 'salvarVerificacao') {
      // POST request com dados complexos
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'salvarVerificacao',
          formData: params.formData
        })
      });
      
      const data = await response.text();
      return data;
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  } finally {
    showLoading(false);
  }
}

// Carrega os dados do servidor
function loadDashboardData() {
  showLoading(true);
  
  fetchFromScript({action: 'getDashboardData'})
    .then(data => onDataLoaded(data))
    .catch(error => onDataError(error));
}

// Quando os dados são carregados com sucesso
function onDataLoaded(data) {
  showLoading(false);
  
  // Verifica se há erro nos dados
  if (data.error) {
    showError(data.error);
  }
  
  // Armazena os dados globalmente
  allEquipments = data.equipments || [];
  allReports = data.reports || [];
  
  // Atualiza o resumo
  updateSummary(data.summary || {});
  
  // Preenche as tabelas
  updateEquipmentsTable();
  updateReportsSummary();
}

// Em caso de erro no carregamento
function onDataError(error) {
  showLoading(false);
  showError(error || 'Erro ao carregar dados');
}

// Atualiza os cards de resumo
function updateSummary(summary) {
  document.getElementById('total-equipments').textContent = summary.total || 0;
  document.getElementById('verified-equipments').textContent = summary.verified || 0;
  document.getElementById('pending-equipments').textContent = summary.pending || 0;
  document.getElementById('progress-percentage').textContent = (summary.progress || 0).toFixed(1) + '%';
  document.getElementById('progress-bar').style.width = (summary.progress || 0) + '%';
  document.getElementById('last-update').textContent = summary.lastUpdate || '—';
}

// Atualiza o resumo de relatórios no dashboard
function updateReportsSummary() {
  const tbody = document.getElementById('reports-summary-tbody');
  tbody.innerHTML = '';
  
  if (allReports.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5" style="text-align: center;">Nenhum relatório encontrado</td>';
    tbody.appendChild(row);
    return;
  }
  
  allReports.forEach(report => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${report.type || '-'}</td>
      <td>${report.total || 0}</td>
      <td>${report.verified || 0}</td>
      <td>${report.pending || 0}</td>
      <td>${(report.progress || 0).toFixed(1)}%</td>
    `;
    tbody.appendChild(row);
  });
}

// Atualiza a tabela de equipamentos
function updateEquipmentsTable() {
  const tbody = document.getElementById('equipments-tbody');
  tbody.innerHTML = '';
  
  // Filtra os equipamentos
  const filteredEquipments = filterEquipments();
  
  if (filteredEquipments.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5" style="text-align: center;">Nenhum equipamento encontrado</td>';
    tbody.appendChild(row);
    return;
  }
  
  // Adiciona cada equipamento na tabela
  filteredEquipments.forEach(equipment => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${equipment.id || '-'}</td>
      <td>${equipment.type || '-'}</td>
      <td><span class="status ${equipment.status === 'Verificado' ? 'status-verified' : 'status-pending'}">${equipment.status || '-'}</span></td>
      <td>${equipment.lastCheck || '-'}</td>
      <td>${equipment.responsible || '-'}</td>
    `;
    tbody.appendChild(row);
  });
}

// Filtra os equipamentos com base no filtro atual e termo de busca
function filterEquipments() {
  return allEquipments.filter(equipment => {
    // Aplica o filtro de tipo
    if (currentFilter !== 'all') {
      const filterMapping = {
        'poliguindaste': 'Poliguindaste',
        'vacuo': 'Vácuo',
        'hipervacuo': 'Hipervácuo',
        'alta-pressao': 'Alta pressão',
        'bomba': 'Bomba sobre camionete',
        'aspirador': 'Aspirador'
      };
      
      if (equipment.type !== filterMapping[currentFilter]) {
        return false;
      }
    }
    
    // Aplica o termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (equipment.id && equipment.id.toLowerCase().includes(searchLower)) || 
             (equipment.responsible && equipment.responsible.toLowerCase().includes(searchLower));
    }
    
    return true;
  });
}

// Mostra/esconde indicadores de carregamento
function showLoading(show) {
  const loadingElements = document.querySelectorAll('.loading');
  loadingElements.forEach(el => {
    el.style.display = show ? 'block' : 'none';
  });
  
  // Esconde as tabelas durante o carregamento
  if (show) {
    document.getElementById('equipments-table').style.display = 'none';
    document.getElementById('reports-summary-table').style.display = 'none';
  } else {
    document.getElementById('equipments-table').style.display = 'table';
    document.getElementById('reports-summary-table').style.display = 'table';
  }
}

// Mostra mensagem de erro
function showError(message) {
  const errorElement = document.getElementById('error-message');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  // Esconde a mensagem após 5 segundos
  setTimeout(function() {
    errorElement.style.display = 'none';
  }, 5000);
}

// Mostra mensagem de sucesso
function showSuccess(message) {
  const successElement = document.getElementById('success-message');
  successElement.textContent = message;
  successElement.style.display = 'block';
  
  // Esconde a mensagem após 5 segundos
  setTimeout(function() {
    successElement.style.display = 'none';
  }, 5000);
}
