/**
 * Código principal da aplicação
 * Responsável pela interface de usuário e eventos
 */

// Variáveis globais para armazenar os dados
let allEquipments = [];
let allReports = [];
let currentFilter = 'all';
let searchTerm = '';

// Função que será executada quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  // Inicializa o sistema se for a primeira execução
  configurarSistema();
  
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
    const url = exportData('excel');
    if (url) {
      // Cria um link temporário para o download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'verificacao-equipamentos.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      showSuccess('Exportação concluída com sucesso');
    }
  });
  
  document.getElementById('export-pdf').addEventListener('click', function() {
    exportData('pdf');
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
    const result = verificarEquipamento(equipmentId);
    
    if (result === "OK") {
      // Equipamento não existe ou não foi verificado, continua para a próxima etapa
      document.getElementById('form-step-1').style.display = 'none';
      document.getElementById('form-step-2').style.display = 'block';
      gerarItensVerificacao(document.getElementById('equipment-type').value);
    } else {
      // Equipamento já foi verificado, mostra mensagem
      showError(result);
    }
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
    try {
      const result = salvarVerificacao(formData);
      
      // Esconde o formulário
      document.getElementById('form-overlay').style.display = 'none';
      
      // Mostra mensagem de sucesso
      showSuccess(result);
      
      // Recarrega os dados
      loadDashboardData();
    } catch (error) {
      showError('Erro ao salvar verificação: ' + error.message);
    }
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

// Carrega os dados para o dashboard
function loadDashboardData() {
  showLoading(true);
  
  try {
    const data = getDashboardData();
    onDataLoaded(data);
  } catch (error) {
    onDataError(error.message);
  }
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
