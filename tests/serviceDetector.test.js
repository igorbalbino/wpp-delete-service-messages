import { describe, expect, it } from 'vitest';
import { detectService, normalizeText } from '../src/services/serviceDetector.js';

describe('normalizeText', () => {
  it('remove acentos e normaliza', () => {
    expect(normalizeText('  Faço Instalação Elétrica!  ')).toBe(
      'faco instalacao eletrica',
    );
  });
});

describe('detectService — serviços', () => {
  const cases = [
    'Faço instalação elétrica',
    'Prestamos serviços de pintura',
    'Eletricista disponível para serviços',
    'Faço manutenção de ar condicionado',
    'Faço pequenos reparos residenciais',
    'Ofereço serviço de jardinagem',
    'Faço limpeza de sofá',
    'Trabalho com instalação de câmeras',
    'Realizo manutenção hidráulica',
    'Serviços de pedreiro',
    'Faço frete e mudanças',
  ];

  for (const text of cases) {
    it(`SERVICE: ${text}`, () => {
      const result = detectService(text);
      expect(result.isService).toBe(true);
      expect(result.category).toBe('service');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });
  }
});

describe('detectService — emprego (preservar)', () => {
  const cases = [
    'Vaga para eletricista',
    'Estamos contratando eletricista',
    'Procuro emprego',
    'Procuro emprego como eletricista',
    'Alguém sabe de vaga de emprego?',
    'Empresa contratando ajudante',
    'Procuro trabalho',
    'Estou disponível para trabalhar',
    'Envio currículo',
    'Procuro oportunidade de emprego',
  ];

  for (const text of cases) {
    it(`JOB / IGNORE: ${text}`, () => {
      const result = detectService(text);
      expect(result.isService).toBe(false);
      expect(result.category).toBe('job');
    });
  }
});

describe('detectService — aluguel (preservar)', () => {
  const cases = [
    'Alugo apartamento',
    'Casa para alugar',
    'Aluguel de betoneira',
    'Alugo sala comercial',
    'Procuro apartamento para alugar',
    'Alguém sabe de casa para alugar?',
  ];

  for (const text of cases) {
    it(`RENTAL / IGNORE: ${text}`, () => {
      const result = detectService(text);
      expect(result.isService).toBe(false);
      expect(result.category).toBe('rental');
    });
  }
});

describe('detectService — venda (preservar)', () => {
  it('SALE / IGNORE: Vendo ferramenta', () => {
    const result = detectService('Vendo ferramenta');
    expect(result.isService).toBe(false);
    expect(result.category).toBe('sale');
  });

  it('SALE / IGNORE: Vendo carro', () => {
    const result = detectService('Vendo carro');
    expect(result.isService).toBe(false);
    expect(result.category).toBe('sale');
  });

  it('SALE / IGNORE: Alguém vende uma escada?', () => {
    const result = detectService('Alguém vende uma escada?');
    expect(result.isService).toBe(false);
    expect(result.category).toBe('sale');
  });
});

describe('detectService — compra (preservar)', () => {
  it('PURCHASE / IGNORE: Compro máquina usada', () => {
    const result = detectService('Compro máquina usada');
    expect(result.isService).toBe(false);
    expect(result.category).toBe('purchase');
  });

  it('PURCHASE / IGNORE: Procuro comprar uma furadeira', () => {
    const result = detectService('Procuro comprar uma furadeira');
    expect(result.isService).toBe(false);
    expect(result.category).toBe('purchase');
  });
});

describe('detectService — anúncios reais', () => {
  const digital = `Desenvolvimento de soluções digitais focadas em crescimento orgânico e presença online profissional.
* Sites profissionais
* Sistemas personalizados
* Automações de processos
* SEO e posicionamento no Google
* Estrutura preparada para IA (ChatGPT, Gemini e outros)
* Consultoria tecnológica

Alguns projetos já em produção:
* fluentlyfocused.com (escola internacional de idiomas)
* hora-do-show.creatioinc.com (plataforma para artistas e eventos)
* medflow.creatioinc.com (CRM médico com Assistente virtual)

A ideia não é apenas criar um site, mas construir uma estrutura digital que ajude sua empresa a ser encontrada, gerar credibilidade e conquistar novos clientes.`;

  const aulas = `Fluently Focused — Aulas Online de Idiomas

Idiomas:
Português
Inglês
Espanhol
Italiano
Japonês
Grego
Guarani (voltado para médicos)

Conversação desde a primeira aula.
Aulas práticas, personalizadas e com foco em comunicação real.

Vagas de terça a sexta`;

  const eletricista = `Eletricista | Instalações, Manutenção e Reparos Elétricos

Eletricista profissional para instalações, manutenção e reparos elétricos residenciais e comerciais.
Serviços:
- Instalação de tomadas e interruptores
- Troca de disjuntores e quadros elétricos
- Instalação de chuveiros e torneiras elétricas
- Iluminação residencial e comercial
- Identificação e correção de curtos-circuitos
- Manutenção preventiva e corretiva
- Instalação de ventiladores de teto
- Passagem e organização de fiação
- Adequação elétrica para equipamentos e máquinas

Atendimento rápido, serviço seguro e acabamento de qualidade.`;

  it('SERVICE: anúncio de soluções digitais', () => {
    const result = detectService(digital);
    expect(result.isService).toBe(true);
    expect(result.category).toBe('service');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('SERVICE: anúncio de aulas (vagas = horários, não emprego)', () => {
    const result = detectService(aulas);
    expect(result.isService).toBe(true);
    expect(result.category).toBe('service');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('SERVICE: anúncio de eletricista', () => {
    const result = detectService(eletricista);
    expect(result.isService).toBe(true);
    expect(result.category).toBe('service');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });
});

describe('detectService — conservador', () => {
  it('não classifica palavra isolada como serviço', () => {
    const result = detectService('pintura');
    expect(result.isService).toBe(false);
  });

  it('vaga para pintor não é serviço', () => {
    const result = detectService('Vaga para pintor');
    expect(result.isService).toBe(false);
    expect(result.category).toBe('job');
  });
});
