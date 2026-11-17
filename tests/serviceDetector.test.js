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

describe('detectService — anúncios comerciais', () => {
  const cases = [
    `QUER APRENDER A CANTAR OU TOCAR VIOLÃO?

As aulas são personalizadas e adaptadas aos seus objetivos, seja para começar do zero, aperfeiçoar sua técnica ou ganhar mais segurança para se apresentar.
Aulas de canto e violão com Raíssa Soares.
Agende sua aula:
(31) 99674-7586
Instagram:
@raissa.musica`,
    `Olha o que eu encontrei! Garrafa Térmica 1 Litro Com Termômetro Digital Bebidas Quentes E Frias Para Café Água Chá Leite Gorillaz no Mercado Livre. Entra aqui:  https://meli.la/1P862fC`,
    `RÉVEILLON EM CABO FRIO✅
Saída 29/12/2026
Retorno 03/01/2027
CINCO DIAS

Saída 30/12/2026
Retorno 03/01/2027
QUATRO DIAS
 chama whatsapp 👇🏽👇🏽
pagamento falicitado até a data da viagem

https://api.whatsapp.com/send?phone=5531986773137

https://www.instagram.com/lm_turismoofc?igsh=MWIycjJpajcwZ3p6eA==`,
    `🔥🍔 QUEM TEM FOME DE VERDADE, VEM PRA DECISÃO! 🍔🔥

Tem combo para dividir, para matar a fome e para aproveitar sem pensar duas vezes! 😋👇

 peça seu lanche pela 99food:
https://oia.99app.com/dlp9/bbufgf?area=BR
Decisão Lanches
986740638`,
    `🌧️🍔 DOMINGOU COM CHUVA E PROMOÇÃO NO BOLA BURGUER! 🔥

Tá chovendo? 🌧️ Então deixa que a fome a gente resolve! 😋

🍔 Hambúrguer + Batata Frita 🍟 + Refrigerante 🥤 por apenas R$ 32,90! 🤩

🔥 Chuva combina com filme, cobertor e um lanche caprichado do BOLA BURGUER!

⏰ Atendimento das 18h às 00h
🛵 Delivery ou retirada!

❤️💛 BOLA BURGUER — A chuva cai, mas a fome não espera! 🍔🔥

📲 Faça já seu pedido!
https://pedido.brendi.com.br/bola-burguer-paraiso?v=10PORCENTO`,
    `🛋️ Renove seu sofá!
✨ Higienização profissional
✨ Remoção de manchas e odores
✨ Mais conforto para sua família
📲 wa.me/31993822903
📍 BH, Contagem e região.`,
    `🌸✨ SUA PEÇA FAVORITA MERECE UMA SEGUNDA CHANCE! ✨🌸

Sabe aquele biquíni que você ama, aquele vestido que precisa de um ajuste ou aquela calça que ficaria perfeita com a bainha no comprimento certo?

A Parla D’Amore – Arte em Lingerie tem a solução! 💕

Trabalhamos com carinho, cuidado e capricho para deixar suas peças lindas e prontinhas para serem usadas novamente!

🩷 CONFIRA ALGUNS DOS NOSSOS SERVIÇOS:

👙 Reforma em biquínis – a partir de R$ 25,00
🧵 Troca de alças – R$ 10,00
💕 Troca de colchetes – R$ 10,00
👗 Bainhas simples – R$ 10,00
✂️ Reparos e pequenos consertos em geral.

Não deixe aquela peça querida esquecida no guarda-roupa! Dê a ela uma nova oportunidade! 🌷

📲 Orçamentos e atendimento pelo WhatsApp:
31 99738-4661

💗 PARLA D’AMORE`,
    `Quem quer economizar em suplementos e produtos fitness, fica a dica:

Entre no grupo do WhatsApp Sou Fitness para receber em primeira mão promoções, cupons e descontos que encontro no Mercado Livre, Amazon e Shopee.

O grupo é 100% gratuito, sem spam e só com ofertas reais.

Quem quiser participar:

https://chat.whatsapp.com/IVHutLrEuUgCMEqius6uAD`,
  ];

  for (const text of cases) {
    it(`ANUNCIO: ${text.slice(0, 42)}`, () => {
      const result = detectService(text);
      expect(result.category).toBe('anuncio');
      expect(result.isService).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });
  }
});

describe('detectService — conversa comum (preservar)', () => {
  const cases = [
    'Bom dia! Obrigada pela senhorita',
    'Vou ver com calma daqui a pouco porque meu dia hoje está bonito',
    'me chama no whatsapp 31999998888',
    'as aulas de violão da minha filha são hoje às 14h',
    'achei mais barato no mercado livre',
    'paguei R$ 32,90 no almoço',
    'tem promoção de tomate na feira',
    'quer aprender a tocar violão?',
    'é delivery ou retirada?',
    'feliz réveillon! saída da festa 1h e retorno de manhã',
    'as aulas são personalizadas na escola do meu filho',
    'entra no grupo do bairro https://chat.whatsapp.com/abcDEF123',
    'me passa um orçamento pelo whatsapp',
    'Alugo apartamento a partir de R$ 1.200',
    'como tiro manchas do sofá?',
    'meu contato wa.me/31999998888',
    'vi uns cupons e descontos na amazon e na shopee',
  ];

  for (const text of cases) {
    it(`KEEP: ${text}`, () => {
      const result = detectService(text);
      expect(result.isService).toBe(false);
      expect(result.category).not.toBe('anuncio');
    });
  }
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
