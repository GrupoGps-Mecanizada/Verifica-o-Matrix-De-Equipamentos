/**
 * Sistema de Verificação de Equipamentos da Frota
 * Desenvolvido para controle de inspeções da GrupoGps - Mecanizada
 */

// Definição global dos itens de verificação
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

// Nome da chave para armazenamento local
const STORAGE_KEY = 'grupoGpsVerificacaoEquipamentos';

// Tipos de equipamentos disponíveis
const tiposEquipamento = ['Poliguindaste', 'Vácuo', 'Hipervácuo', 'Alta pressão', 'Bomba sobre camionete', 'Aspirador'];
