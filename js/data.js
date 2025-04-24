/**
 * Funções de manipulação de dados
 * Adaptadas do Apps Script para usar localStorage
 */

// Inicializa o sistema
function configurarSistema() {
  let dados = getDadosArmazenados();
  
  // Se não existirem dados, inicializa com dados padrão
  if (!dados) {
    dados = {
      equipamentos: [],
      controle: {
        ultimaAtualizacao: new Date().toISOString(),
        totalEquipamentos: 0,
        equipamentosVerificados: 0,
        equipamentosPendentes: 0
      },
      relatorios: [],
      detalhes: []
    };
    
    // Inicializa relatórios com os tipos de equipamento
    tiposEquipamento.forEach(tipo => {
      dados.relatorios.push({
        tipo: tipo,
        total: 0,
        verificados: 0,
        pendentes: 0,
        progresso: 0,
        ultimaAtualizacao: new Date().toISOString()
      });
    });
    
    salvarDados(dados);
  }
  
  return 'Sistema configurado com sucesso!';
}

// Verifica se um equipamento já foi registrado e retorna mensagem
function verificarEquipamento(idPlaca) {
  if (!idPlaca) {
    return "Por favor, forneça um ID/Placa válido";
  }
  
  const dados = getDadosArmazenados();
  
  if (!dados || !dados.equipamentos) {
    return "OK"; // Se não houver dados, provavelmente é o primeiro uso
  }
  
  for (let i = 0; i < dados.equipamentos.length; i++) {
    if (dados.equipamentos[i].id === idPlaca && dados.equipamentos[i].status === 'Verificado') {
      return "Este equipamento já foi verificado em " + 
             formatarData(new Date(dados.equipamentos[i].ultimaVerificacao)) + 
             " por " + dados.equipamentos[i].responsavel;
    }
  }
  
  return "OK";
}

// Salva os dados de verificação
function salvarVerificacao(formData) {
  if (!formData) {
    throw new Error('Dados de verificação inválidos');
  }
  
  const dados = getDadosArmazenados() || configurarSistema();
  
  // Verifica se o equipamento já existe
  let equipamentoExistente = false;
  let indiceEquipamento = -1;
  
  for (let i = 0; i < dados.equipamentos.length; i++) {
    if (dados.equipamentos[i].id === formData.equipmentId) {
      equipamentoExistente = true;
      indiceEquipamento = i;
      break;
    }
  }
  
  const dataVerificacao = new Date(formData.verificationDate);
  
  // Atualiza ou adiciona o equipamento
  if (equipamentoExistente) {
    // Atualiza o equipamento existente
    dados.equipamentos[indiceEquipamento].status = 'Verificado';
    dados.equipamentos[indiceEquipamento].ultimaVerificacao = dataVerificacao.toISOString();
    dados.equipamentos[indiceEquipamento].responsavel = formData.responsibleName;
  } else {
    // Adiciona novo equipamento
    dados.equipamentos.push({
      id: formData.equipmentId,
      tipo: formData.equipmentType,
      status: 'Verificado',
      ultimaVerificacao: dataVerificacao.toISOString(),
      responsavel: formData.responsibleName
    });
  }
  
  // Registra os itens de verificação
  registrarItensVerificacao(dados, formData);
  
  // Atualiza as estatísticas
  atualizarEstatisticas(dados);
  
  // Salva os dados atualizados
  salvarDados(dados);
  
  return 'Verificação registrada com sucesso!';
}

// Registra os itens de verificação detalhados
function registrarItensVerificacao(dados, formData) {
  // Registra cada item de verificação
  for (const itemId in formData.items) {
    // Encontra o título do item com base no ID
    let tituloItem = itemId;
    for (const item of verificacaoItens) {
      if (item.id === itemId) {
        tituloItem = item.titulo;
        break;
      }
    }
    
    dados.detalhes.push({
      id: formData.equipmentId,
      dataVerificacao: new Date(formData.verificationDate).toISOString(),
      item: tituloItem,
      resultado: formData.items[itemId],
      observacoes: formData.observations || ''
    });
  }
}

// Atualiza as estatísticas
function atualizarEstatisticas(dados) {
  // Contadores por tipo
  const contadores = {};
  tiposEquipamento.forEach(tipo => {
    contadores[tipo] = {total: 0, verificados: 0};
  });
  
  // Conta total e status
  let total = dados.equipamentos.length;
  let verificados = 0;
  
  for (let i = 0; i < dados.equipamentos.length; i++) {
    const tipo = dados.equipamentos[i].tipo;
    const status = dados.equipamentos[i].status;
    
    if (contadores[tipo]) {
      contadores[tipo].total++;
      
      if (status === 'Verificado') {
        verificados++;
        contadores[tipo].verificados++;
      }
    }
  }
  
  // Atualiza o controle
  dados.controle.ultimaAtualizacao = new Date().toISOString();
  dados.controle.totalEquipamentos = total;
  dados.controle.equipamentosVerificados = verificados;
  dados.controle.equipamentosPendentes = total - verificados;
  
  // Atualiza os relatórios
  for (let i = 0; i < dados.relatorios.length; i++) {
    const tipo = dados.relatorios[i].tipo;
    dados.relatorios[i].total = contadores[tipo].total;
    dados.relatorios[i].verificados = contadores[tipo].verificados;
    dados.relatorios[i].pendentes = contadores[tipo].total - contadores[tipo].verificados;
    dados.relatorios[i].progresso = contadores[tipo].total > 0 ? 
                                    contadores[tipo].verificados / contadores[tipo].total : 0;
    dados.relatorios[i].ultimaAtualizacao = new Date().toISOString();
  }
}

// Obtém dados para o dashboard
function getDashboardData() {
  // Verifica se já existem dados armazenados
  let dados = getDadosArmazenados();
  
  // Se não existirem dados, configura o sistema
  if (!dados) {
    configurarSistema();
    dados = getDadosArmazenados();
  }
  
  // Estrutura os dados para enviar ao dashboard
  const result = {
    summary: {
      total: dados.controle.totalEquipamentos,
      verified: dados.controle.equipamentosVerificados,
      pending: dados.controle.equipamentosPendentes,
      progress: dados.controle.totalEquipamentos > 0 ? 
                (dados.controle.equipamentosVerificados / dados.controle.totalEquipamentos * 100) : 0,
      lastUpdate: formatarDataHora(new Date(dados.controle.ultimaAtualizacao))
    },
    equipments: [],
    reports: []
  };
  
  // Processa dados de equipamentos
  for (let i = 0; i < dados.equipamentos.length; i++) {
    result.equipments.push({
      id: dados.equipamentos[i].id,
      type: dados.equipamentos[i].tipo,
      status: dados.equipamentos[i].status,
      lastCheck: dados.equipamentos[i].ultimaVerificacao ? 
                formatarData(new Date(dados.equipamentos[i].ultimaVerificacao)) : '-',
      responsible: dados.equipamentos[i].responsavel || '-'
    });
  }
  
  // Processa dados de relatórios
  for (let i = 0; i < dados.relatorios.length; i++) {
    result.reports.push({
      type: dados.relatorios[i].tipo,
      total: dados.relatorios[i].total,
      verified: dados.relatorios[i].verificados,
      pending: dados.relatorios[i].pendentes,
      progress: dados.relatorios[i].progresso * 100,
      lastUpdate: formatarDataHora(new Date(dados.relatorios[i].ultimaAtualizacao))
    });
  }
  
  return result;
}

// Exporta os dados para Excel ou PDF
function exportData(format) {
  const dados = getDadosArmazenados();
  
  if (!dados) {
    throw new Error('Nenhum dado disponível para exportação');
  }
  
  if (format === 'excel') {
    // No ambiente GitHub Pages, vamos exportar como CSV
    let csv = 'ID/Placa,Tipo,Status,Última Verificação,Responsável\n';
    
    dados.equipamentos.forEach(equip => {
      csv += `${equip.id},${equip.tipo},${equip.status},${formatarData(new Date(equip.ultimaVerificacao))},${equip.responsavel}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    return url;
  } else if (format === 'pdf') {
    // Para PDF, podemos usar biblioteca externa como jsPDF
    // Ou simplesmente informar que esta funcionalidade requer uma biblioteca adicional
    alert('A exportação para PDF requer a biblioteca jsPDF. Por favor, inclua-a no seu projeto para ativar esta funcionalidade.');
    return null;
  }
  
  throw new Error('Formato não suportado');
}

// Funções auxiliares

// Obtém dados do localStorage
function getDadosArmazenados() {
  const dadosArmazenados = localStorage.getItem(STORAGE_KEY);
  return dadosArmazenados ? JSON.parse(dadosArmazenados) : null;
}

// Salva dados no localStorage
function salvarDados(dados) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

// Formata data no formato brasileiro
function formatarData(data) {
  return `${padZero(data.getDate())}/${padZero(data.getMonth() + 1)}/${data.getFullYear()}`;
}

// Formata data e hora no formato brasileiro
function formatarDataHora(data) {
  return `${padZero(data.getDate())}/${padZero(data.getMonth() + 1)}/${data.getFullYear()} ${padZero(data.getHours())}:${padZero(data.getMinutes())}:${padZero(data.getSeconds())}`;
}

// Adiciona zero à esquerda para números < 10
function padZero(num) {
  return num < 10 ? `0${num}` : num;
}
