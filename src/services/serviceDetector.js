/**
 * Detector conservador de ofertas de prestação de serviço.
 * Em caso de dúvida: NÃO classificar como serviço.
 */

export const SERVICE_PATTERNS = {
  offerVerbs: [
    /\bfaco\b/,
    /\bfazemos\b/,
    /\brealizo\b/,
    /\brealizamos\b/,
    /\bpresto\b/,
    /\bprestamos\b/,
    /\bofereco\b/,
    /\boferecemos\b/,
    /\btrabalho com\b/,
    /\batendo\b/,
    /\batendemos\b/,
    /\bdesenvolvo\b/,
    /\bdesenvolvemos\b/,
    /\bcrio\b/,
    /\bcriamos\b/,
    /\bconstruo\b/,
    /\bconstruimos\b/,
  ],
  serviceNouns: [
    /\binstalacoes?\b/,
    /\bmanutenc(ao|oes)\b/,
    /\bconsertos?\b/,
    /\breparos?\b/,
    /\blimpezas?\b/,
    /\bmontagens?\b/,
    /\breformas?\b/,
    /\bpinturas?\b/,
    /\bjardinagens?\b/,
    /\bhidraulica\b/,
    /\beletric(a|o|as|os)\b/,
    /\bcameras?\b/,
    /\bfretes?\b/,
    /\bmudancas?\b/,
    /\bsofa\b/,
    /\bpedreiro\b/,
    /\beletricista\b/,
    /\bencanador\b/,
    /\bpintor\b/,
    /\bjardineiro\b/,
    // digital / consultoria
    /\bsites?\b/,
    /\bsistemas?\b/,
    /\bautoma(c)?oes?\b/,
    /\bautomacoes?\b/,
    /\bseo\b/,
    /\bconsultoria\b/,
    /\bdesenvolvimento\b/,
    /\bsolucoes?\b/,
    /\bpresenca\s+online\b/,
    // aulas / serviços educacionais (oferta)
    /\baulas?\b/,
    /\bidiomas?\b/,
    /\bconversacao\b/,
    /\bdisjuntores?\b/,
    /\bquadros?\s+eletricos?\b/,
    /\biluminacao\b/,
    /\bcurtos?\s*circuitos?\b/,
    /\bfiacao\b/,
  ],
  phrases: [
    /\bservicos?\s*:/,
    /\bservicos?\s+de\b/,
    /\bprestacao\s+de\s+servicos?\b/,
    /\bdisponivel\s+para\s+servicos?\b/,
    /\bpara\s+servicos?\b/,
    /\bpequenos\s+reparos\b/,
    /\bfaco\s+(?:\S+\s+)*(instalacoes?|manutenc(ao|oes)|consertos?|reparos?|limpezas?|montagens?|reformas?|pinturas?|jardinagens?|fretes?|mudancas?)\b/,
    /\b(realizo|realizamos|presto|prestamos|ofereco|oferecemos)\s+(?:\S+\s+)*(instalacoes?|manutenc(ao|oes)|consertos?|reparos?|limpezas?|montagens?|reformas?|pinturas?|jardinagens?|fretes?|mudancas?|servicos?)\b/,
    /\b(prestamos|oferecemos|realizamos)\s+servicos?\b/,
    /\btrabalho\s+com\s+(instalacoes?|manutenc(ao|oes)|consertos?|reparos?|limpezas?|montagens?|reformas?|pinturas?|jardinagens?|cameras?)/,
    /\bservicos?\s+de\s+\w+/,
    // profissional + oferta
    /\beletricista\s+profissional\b/,
    /\bpara\s+instalacoes?\b/,
    /\binstalacoes?,\s*manutenc/,
    /\bmanutencao\s+(preventiva|corretiva)\b/,
    /\batendimento\s+rapido\b/,
    /\bservico\s+seguro\b/,
    // digital
    /\bdesenvolvimento\s+de\s+solucoes\b/,
    /\bsolucoes\s+digitais\b/,
    /\bsites?\s+profissionais?\b/,
    /\bsistemas?\s+personalizados?\b/,
    /\bautoma(c)?oes\s+de\s+processos\b/,
    /\bautomacoes\s+de\s+processos\b/,
    /\bconsultoria\s+tecnologica\b/,
    /\bpresenca\s+online\s+profissional\b/,
    /\bposicionamento\s+no\s+google\b/,
    /\bestrutura\s+digital\b/,
    /\bcriar\s+um\s+site\b/,
    /\bconstruir\s+uma\s+estrutura\s+digital\b/,
    // aulas / idiomas (oferta de serviço educacional)
    /\baulas\s+online\b/,
    /\baulas\s+praticas\b/,
    /\baulas\s+personalizadas\b/,
    /\bconversacao\s+desde\b/,
    /\bescola\s+(?:internacional\s+)?de\s+idiomas\b/,
    /\bfoco\s+em\s+comunicacao\b/,
  ],
};

/**
 * Padrões de emprego — contextualizados.
 * Evitar "vaga/vagas" isolados (ex.: "Vagas de terça a sexta" = horários).
 */
export const JOB_PATTERNS = [
  /\bvagas?\s+para\b/,
  /\bvagas?\s+de\s+emprego\b/,
  /\bvaga\s+de\s+\w*(eletricista|pintor|ajudante|pedreiro|encanador|vendedor|assistente|analista|dev|desenvolvedor|motorista)\b/,
  /\bcontratando\b/,
  /\bempresa\s+contratando\b/,
  /\bprocuro\s+emprego\b/,
  /\bprocuro\s+trabalho\b/,
  /\bprocuro\s+oportunidade\b/,
  /\bprocuro\s+vaga\b/,
  /\benvio\s+curriculo\b/,
  /\bcurriculo\b/,
  /\bdisponivel\s+para\s+trabalhar\b/,
  /\bestou\s+disponivel\s+para\s+trabalhar\b/,
  /\balguem\s+sabe\s+de\s+vaga\b/,
  /\bestamos\s+contratando\b/,
  /\boportunidade\s+de\s+emprego\b/,
  /\bemprego\b/,
];

export const RENTAL_PATTERNS = [
  /\balugo\b/,
  /\baluguel\b/,
  /\balugar\b/,
  /\bpara\s+alugar\b/,
  /\bprocuro\s+apartamento\s+para\s+alugar\b/,
  /\bcasa\s+para\s+alugar\b/,
  /\balguem\s+sabe\s+de\s+casa\s+para\s+alugar\b/,
  /\baluguel\s+de\b/,
];

export const SALE_PATTERNS = [
  /\bvendo\b/,
  /\ba\s+venda\b/,
  /\balguem\s+vende\b/,
];

export const PURCHASE_PATTERNS = [
  /\bcompro\b/,
  /\bprocuro\s+comprar\b/,
  /\bquero\s+comprar\b/,
];

export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchAny(text, patterns) {
  const hits = [];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) hits.push(pattern.source);
  }
  return hits;
}

function scoreCategory(hits, weight = 0.35) {
  if (!hits.length) return 0;
  return Math.min(0.98, 0.55 + hits.length * weight);
}

/**
 * Sinais de anúncio comercial. Um indício sozinho e genérico não chega a 0,8.
 * Link de loja, chamada de pedido ou combinação explícita de oferta, sim.
 * @returns {{ score: number, reasons: string[] }}
 */
export function scoreAdvertisement(rawText) {
  const raw = String(rawText || '');
  const normalized = normalizeText(raw);
  let score = 0;
  const reasons = [];

  const add = (points, reason) => {
    if (points <= 0) return;
    score += points;
    if (reason && !reasons.includes(reason)) reasons.push(reason);
  };

  // Afiliado / vitrine. "meli." basta, como pedido.
  if (/meli\./i.test(raw) || /mercadolivre\.com/i.test(raw)) {
    add(0.92, 'link de produto');
  }

  if (/99app\.com|brendi\.com\.br|ifood\.com|rappi\.com/i.test(raw)) {
    add(0.88, 'link de pedido');
  }

  if (/\bagende\s+sua\s+aula\b/.test(normalized)) add(0.86, 'agendamento de aula');
  if (/\bfaca\s+(?:ja\s+)?seu\s+pedido\b/.test(normalized)) add(0.86, 'chamada para pedido');
  if (/\bpeca\s+seu\s+(?:lanche|pedido|combo|hamburguer|burguer|burger)\b/.test(normalized)) {
    add(0.86, 'chamada para pedido');
  }

  // Oferta de aula: cada frase fica abaixo do corte; juntas, passam.
  if (/\baulas?\s+(?:sao\s+)?personalizadas\b/.test(normalized)) add(0.55, 'oferta de aula');
  if (/\bquer\s+aprender\s+a\s+(?:cantar|tocar)\b/.test(normalized)) add(0.45, 'oferta de aula');

  if (/\bpor\s+apenas\s+r\s*\d/.test(normalized)) add(0.55, 'preço promocional');
  if (/\bdelivery\s+ou\s+retirada\b/.test(normalized)) add(0.4, 'delivery');
  if (/\bpagamento\s+fa[cl]icitado\b/.test(normalized)) add(0.55, 'pagamento facilitado');

  const trip =
    /\b(reveillon|turismo|excursao|pacote)\b/.test(normalized) &&
    /\bsaida\b/.test(normalized) &&
    /\bretorno\b/.test(normalized);
  if (trip) add(0.5, 'pacote de viagem');

  // Higienização: a frase pronta basta; os pedaços soltos ficam abaixo do corte.
  if (/\bhigienizacao\s+profissional\b/.test(normalized)) add(0.88, 'higienização profissional');
  if (/\brenove\s+seu\s+(sofa|estofado|colchao)\b/.test(normalized)) add(0.5, 'oferta de higienização');
  if (/\bremocao\s+de\s+manchas\b/.test(normalized)) add(0.4, 'oferta de higienização');

  // Catálogo com tabela. "nossos serviços" ou um preço isolado não chegam a 0,8.
  const priceCount = normalized.match(/\br\s+\d{1,4}\s+\d{2}\b/g)?.length || 0;
  if (/\bnossos\s+servicos\b/.test(normalized) && priceCount >= 2) {
    add(0.9, 'tabela de serviços');
  }
  if (/\bnossos\s+servicos\b/.test(normalized) && /\borcamentos?\b/.test(normalized)) {
    add(0.86, 'catálogo de serviços');
  }

  // Convite de grupo só vira anúncio com cara de cupom/oferta. Link de grupo sozinho não conta.
  const dealWords =
    /\b(cupons?|descontos?)\b/.test(normalized) && /\b(promocoes|ofertas)\b/.test(normalized);
  const storeHits = ['mercado livre', 'amazon', 'shopee'].filter((store) =>
    normalized.includes(store),
  ).length;
  if (/chat\.whatsapp\.com/i.test(raw) && dealWords) add(0.9, 'grupo de ofertas');
  else if (storeHits >= 2 && dealWords) add(0.86, 'ofertas de loja');

  return {
    score: Math.min(0.98, score),
    reasons,
  };
}

/**
 * @param {string} text
 * @returns {{ isService: boolean, confidence: number, category: string, reason: string }}
 */
export function detectService(text) {
  const normalized = normalizeText(text);

  if (!normalized || normalized.length < 3) {
    return {
      isService: false,
      confidence: 0,
      category: 'unknown',
      reason: 'Texto insuficiente para classificação',
    };
  }

  const ad = scoreAdvertisement(text);
  if (ad.score >= 0.8) {
    return {
      isService: true,
      confidence: Number(ad.score.toFixed(2)),
      category: 'anuncio',
      reason: ad.reasons.length
        ? `Anúncio identificado (${ad.reasons.join(', ')})`
        : 'Anúncio identificado',
    };
  }

  const phraseHits = matchAny(normalized, SERVICE_PATTERNS.phrases);
  const verbHits = matchAny(normalized, SERVICE_PATTERNS.offerVerbs);
  const nounHits = matchAny(normalized, SERVICE_PATTERNS.serviceNouns);

  let serviceScore = 0;
  const reasons = [];

  if (phraseHits.length) {
    serviceScore += 0.55 + Math.min(0.35, phraseHits.length * 0.12);
    reasons.push('frase típica de prestação de serviço');
  }

  if (verbHits.length && nounHits.length) {
    serviceScore += 0.8 + Math.min(0.15, (verbHits.length + nounHits.length) * 0.04);
    reasons.push('oferta contextual de serviço');
  } else if (verbHits.length && !nounHits.length) {
    serviceScore += 0.15;
  } else if (!verbHits.length && nounHits.length === 1) {
    serviceScore += 0.1;
  }

  // Anúncio-catálogo: vários tipos de serviço listados (ex.: eletricista com lista)
  if (nounHits.length >= 3) {
    serviceScore += 0.75;
    reasons.push('catálogo de serviços');
  } else if (nounHits.length >= 2 && phraseHits.length) {
    serviceScore += 0.45;
    reasons.push('oferta com múltiplos serviços');
  }

  serviceScore = Math.min(0.98, serviceScore);

  const jobHits = matchAny(normalized, JOB_PATTERNS);
  const rentalHits = matchAny(normalized, RENTAL_PATTERNS);
  const saleHits = matchAny(normalized, SALE_PATTERNS);
  const purchaseHits = matchAny(normalized, PURCHASE_PATTERNS);

  const vetoCandidates = [
    { category: 'job', hits: jobHits, reason: 'Vaga de emprego identificada' },
    { category: 'rental', hits: rentalHits, reason: 'Aluguel identificado' },
    { category: 'sale', hits: saleHits, reason: 'Compra e venda (venda) identificada' },
    { category: 'purchase', hits: purchaseHits, reason: 'Compra e venda (compra) identificada' },
  ]
    .map((item) => ({
      ...item,
      confidence: scoreCategory(item.hits, 0.3),
    }))
    .filter((item) => item.hits.length > 0)
    .sort((a, b) => b.confidence - a.confidence);

  // Veto só se o sinal de emprego/aluguel/venda for mais forte que o de serviço
  // (evita "Vagas de terça a sexta" em anúncio de aula matar o detect)
  if (vetoCandidates.length > 0) {
    const top = vetoCandidates[0];
    if (serviceScore < 0.8 || top.confidence >= serviceScore) {
      return {
        isService: false,
        confidence: top.confidence,
        category: top.category,
        reason: top.reason,
      };
    }
  }

  if (serviceScore >= 0.8) {
    return {
      isService: true,
      confidence: Number(serviceScore.toFixed(2)),
      category: 'service',
      reason: reasons.length
        ? `Prestação de serviço identificada (${reasons.join(', ')})`
        : 'Prestação de serviço identificada',
    };
  }

  if (serviceScore >= 0.4) {
    return {
      isService: false,
      confidence: Number(serviceScore.toFixed(2)),
      category: 'unknown',
      reason: 'Indícios insuficientes — mensagem preservada por segurança',
    };
  }

  return {
    isService: false,
    confidence: Number(Math.max(serviceScore, 0.03).toFixed(2)),
    category: 'unknown',
    reason: 'Não identificada como oferta de serviço',
  };
}

export default detectService;
