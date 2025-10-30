import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group';
import { Checkbox } from './components/ui/checkbox';

// Import html2pdf
declare global {
  interface Window {
    html2pdf: any;
  }
}

export default function App() {
  // Form States - Calculator 1
  const [produtoNome, setProdutoNome] = useState('');
  const [basePF, setBasePF] = useState('');
  const [valorICMS0, setValorICMS0] = useState('');
  const [desconto, setDesconto] = useState('');
  const [cap, setCap] = useState('nao');
  const [valorPMVG, setValorPMVG] = useState('');
  const [valorPMVG0, setValorPMVG0] = useState('');
  const [repasse, setRepasse] = useState('10.75');
  const [chkDesonerado, setChkDesonerado] = useState(false);
  const [chkIsento, setChkIsento] = useState(false);

  // Form States - Calculator 2
  const [custoProduto, setCustoProduto] = useState('');
  const [valorPF, setValorPF] = useState('');
  const [valorVenda, setValorVenda] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');
  const [margemDireta, setMargemDireta] = useState('');
  const [repetirPF, setRepetirPF] = useState(false);

  // Result States
  const [showResultadoCusto, setShowResultadoCusto] = useState(false);
  const [showResultadoMargens, setShowResultadoMargens] = useState(false);
  const [showResumo, setShowResumo] = useState(false);
  const [valorCusto, setValorCusto] = useState('R$ 0,0000');
  const [margemBaseCusto, setMargemBaseCusto] = useState({ value: '0,00%', color: '' });
  const [margemPMVGCusto, setMargemPMVGCusto] = useState({ value: '0,00%', color: '' });
  const [showItemPMVGCusto, setShowItemPMVGCusto] = useState(false);
  const [margemVendaCusto, setMargemVendaCusto] = useState({ value: '0,00%', color: '' });
  const [margemEstimadoCusto, setMargemEstimadoCusto] = useState({ value: '0,00%', color: '' });
  const [margemPFPmvgCusto, setMargemPFPmvgCusto] = useState({ value: '0,00%', color: '' });
  const [margemVendaEstimado, setMargemVendaEstimado] = useState({ value: '0,00%', color: '', message: '' });
  const [avisoMargemEstimado, setAvisoMargemEstimado] = useState('');
  const [showAvisoPF, setShowAvisoPF] = useState(false);
  const [avisoTipoPF, setAvisoTipoPF] = useState('');
  const [sugestaoMargem, setSugestaoMargem] = useState('');

  // PDF Resume Data
  const [resumeData, setResumeData] = useState<any>({});

  // Load html2pdf script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Função global para zerar cálculos baseados na base
  const zerarCalculosPorBase = () => {
    setValorICMS0('');
    setValorPMVG('');
    setValorPMVG0('');
    setCustoProduto('');
    setValorPF('');
    setValorCusto('R$ 0,0000');
    setMargemBaseCusto({ value: '0,00%', color: '' });
    setMargemPMVGCusto({ value: '0,00%', color: '' });
    setMargemVendaCusto({ value: '0,00%', color: '' });
    setMargemEstimadoCusto({ value: '0,00%', color: '' });
    setMargemVendaEstimado({ value: '0,00%', color: '', message: '' });
    setMargemPFPmvgCusto({ value: '0,00%', color: '' });
    setShowItemPMVGCusto(false);
    setShowResultadoCusto(false);
    setShowResultadoMargens(false);
    setShowResumo(false);
    atualizarAvisoPorChecks();
  };

  // Atualiza aviso baseado nos checkboxes
  const atualizarAvisoPorChecks = () => {
    if (chkIsento) {
      setShowAvisoPF(true);
      setAvisoTipoPF('ISENTO');
    } else if (chkDesonerado) {
      setShowAvisoPF(true);
      setAvisoTipoPF('DESONERADO');
    } else {
      setShowAvisoPF(false);
      setAvisoTipoPF('');
    }
  };

  // Bloqueia repasse quando ISENTO
  const atualizarBloqueioRepassePorIsento = () => {
    if (chkIsento) {
      setRepasse('0');
    }
  };

  // Calcula ICMS 0% mesmo sem CAP quando ISENTO/DESONERADO
  const calcularICMS0SemCAP = () => {
    const basePFVal = parseFloat(basePF);
    
    if (isNaN(basePFVal) || basePFVal <= 0) {
      setValorICMS0('');
      return;
    }

    if (chkDesonerado || chkIsento) {
      const icms0 = +(basePFVal * 0.83).toFixed(4);
      setValorICMS0(icms0.toFixed(4));

      // Se CAP NÃO está ativo, atualiza o campo PF com ICMS 0%
      if (cap !== 'sim') {
        setValorPF(icms0.toFixed(4));
        setShowAvisoPF(true);
        setAvisoTipoPF(chkIsento ? 'ISENTO' : 'DESONERADO');
      }
    } else {
      // Se desmarcou, limpa ICMS 0%
      setValorICMS0('');
      
      // Se CAP NÃO está ativo, volta o PF normal
      if (cap !== 'sim') {
        setValorPF(basePFVal.toFixed(4));
        setShowAvisoPF(false);
      }
    }
  };

  // Calcula PMVG
  const calcularPMVG = () => {
    const basePFVal = parseFloat(basePF);
    
    if (cap !== 'sim') {
      setValorPMVG('');
      setValorPMVG0('');
      setShowAvisoPF(false);
      return;
    }

    if (isNaN(basePFVal) || basePFVal <= 0) return;

    // PMVG (21,53%) always on BASE PF
    const pmvgBase = Math.trunc((basePFVal * (1 - 21.53/100)) * 10000) / 10000;
    setValorPMVG(pmvgBase.toFixed(4));

    // When ISENTO/DESONERADO, calculate ICMS 0% and PMVG 0%
    if (chkDesonerado || chkIsento) {
      const icms0 = +(basePFVal * 0.83).toFixed(4);
      setValorICMS0(icms0.toFixed(4));

      const pmvg0 = icms0 * (1 - 21.53/100);
      setValorPMVG0(pmvg0.toFixed(4));

      // Calculator 2 uses PMVG 0%
      setValorPF(pmvg0.toFixed(4));
      setShowAvisoPF(true);
      setAvisoTipoPF(chkIsento ? 'ISENTO' : 'DESONERADO');
    } else {
      // No isento/desonerado: clear ICMS0 and hide PMVG 0%
      setValorICMS0('');
      setValorPMVG0('');

      // Calculator 2 uses PMVG on base
      setValorPF(pmvgBase.toFixed(4));
      setShowAvisoPF(false);
    }
  };

  // Mutual exclusive checkboxes - DESONERADO
  useEffect(() => {
    if (chkDesonerado && chkIsento) {
      setChkIsento(false);
    }
    calcularPMVG();
    calcularICMS0SemCAP();
    atualizarAvisoPorChecks();
  }, [chkDesonerado]);

  // Mutual exclusive checkboxes - ISENTO
  useEffect(() => {
    if (chkIsento && chkDesonerado) {
      setChkDesonerado(false);
    }
    calcularPMVG();
    calcularICMS0SemCAP();
    atualizarBloqueioRepassePorIsento();
    atualizarAvisoPorChecks();
  }, [chkIsento]);

  // Auto-fill valorPF when PMVG changes and CAP is active
  useEffect(() => {
    if (cap === 'sim' && valorPMVG) {
      setValorPF(valorPMVG);
    }
  }, [valorPMVG, cap]);

  // Repeat PF value
  useEffect(() => {
    if (repetirPF && valorPF) {
      setValorVenda(valorPF);
      setMargemDireta('');
      setSugestaoMargem('');
    }
  }, [repetirPF, valorPF]);

  // Recalculate when basePF changes
  useEffect(() => {
    const v = parseFloat(basePF);
    if (!basePF || isNaN(v) || v <= 0) {
      zerarCalculosPorBase();
      return;
    }
    if (cap === 'sim') {
      calcularPMVG();
    }
    calcularICMS0SemCAP();
  }, [basePF, cap]);

  const getColorClass = (percent: number) => {
    if (percent < 0) return 'negative';
    if (percent < 25) return 'warning';
    return 'positive';
  };

  const calcularCusto = () => {
    const basePFVal = parseFloat(basePF);
    const descontoVal = parseFloat(desconto);
    const repasseVal = parseFloat(repasse);

    if (isNaN(basePFVal) || isNaN(descontoVal)) {
      alert('Por favor, preencha a Base de Cálculo PF e o Desconto.');
      return;
    }

    let baseCalculo = basePFVal;
    let valorAtual = baseCalculo;

    // Apply discount
    valorAtual = valorAtual * (1 - descontoVal / 100);

    // Apply CAP if selected
    if (cap === 'sim') {
      valorAtual = valorAtual * (1 - 21.53 / 100);
    }

    // Apply Repasse
    if (repasseVal > 0) {
      valorAtual = valorAtual * (1 - repasseVal / 100);
    }

    const custoFinal = valorAtual;
    const margemPercent = ((baseCalculo - custoFinal) / custoFinal) * 100;

    setValorCusto(`R$ ${custoFinal.toFixed(4)}`);
    setMargemBaseCusto({
      value: `${margemPercent.toFixed(2)}%`,
      color: getColorClass(margemPercent)
    });

    // Calculate PMVG x Custo if PMVG exists
    const valorPMVGVal = parseFloat(valorPMVG);
    if (!isNaN(valorPMVGVal) && valorPMVGVal > 0) {
      const margemPMVGPercent = ((valorPMVGVal - custoFinal) / custoFinal) * 100;
      setMargemPMVGCusto({
        value: `${margemPMVGPercent.toFixed(2)}%`,
        color: getColorClass(margemPMVGPercent)
      });
      setShowItemPMVGCusto(true);
    } else {
      setShowItemPMVGCusto(false);
    }

    setShowResultadoCusto(true);

    // Auto-fill calculator 2
    setCustoProduto(custoFinal.toFixed(4));
  };

  const calcularVendaPorMargem = () => {
    const custo = parseFloat(custoProduto);
    const margemDiretaVal = parseFloat(margemDireta);

    if (margemDireta === '' || isNaN(margemDiretaVal)) {
      setValorVenda('');
      setSugestaoMargem('');
      return;
    }

    if (isNaN(custo) || custo <= 0) {
      setSugestaoMargem('');
      return;
    }

    const vendaCalculada = custo * (1 + margemDiretaVal / 100);
    setValorVenda(vendaCalculada.toFixed(4));
    setRepetirPF(false);

    // Check if has more than 2 decimal places
    const vendaArredondada = Math.round(vendaCalculada * 100) / 100;
    const temMaisDe2Casas = Math.abs(vendaCalculada - vendaArredondada) > 0.0001;

    if (temMaisDe2Casas) {
      const vendaBaixo = Math.floor(vendaCalculada * 100) / 100;
      const vendaCima = Math.ceil(vendaCalculada * 100) / 100;
      const margemBaixo = ((vendaBaixo / custo) - 1) * 100;
      const margemCima = ((vendaCima / custo) - 1) * 100;

      const diffBaixo = Math.abs(margemBaixo - margemDiretaVal);
      const diffCima = Math.abs(margemCima - margemDiretaVal);

      if (diffBaixo < diffCima) {
        setSugestaoMargem(`💡 Sugestão para 2 casas: ${margemBaixo.toFixed(2)}% (R$ ${vendaBaixo.toFixed(2)}) ou ${margemCima.toFixed(2)}% (R$ ${vendaCima.toFixed(2)})`);
      } else {
        setSugestaoMargem(`💡 Sugestão para 2 casas: ${margemCima.toFixed(2)}% (R$ ${vendaCima.toFixed(2)}) ou ${margemBaixo.toFixed(2)}% (R$ ${vendaBaixo.toFixed(2)})`);
      }
    } else {
      setSugestaoMargem('');
    }
  };

  useEffect(() => {
    calcularVendaPorMargem();
  }, [margemDireta, custoProduto]);

  const calcularMargens = () => {
    const custo = parseFloat(custoProduto);
    const venda = parseFloat(valorVenda);
    const pfpmvg = parseFloat(valorPF);
    const estimado = parseFloat(valorEstimado);

    const atualizarMargem = (valor: number) => {
      if (isNaN(valor) || !isFinite(valor)) {
        return { value: 'N/A', color: '' };
      }
      return {
        value: `${valor.toFixed(2)}%`,
        color: getColorClass(valor)
      };
    };

    // Check if we can meet estimated with margin >= 25%
    if (!isNaN(custo) && custo > 0 && !isNaN(estimado) && estimado > 0) {
      const margemCustoEstimado = ((estimado - custo) / custo) * 100;
      if (margemCustoEstimado >= 25) {
        setAvisoMargemEstimado(`✅ CONSEGUIMOS ATENDER O VALOR ESTIMADO com ${margemCustoEstimado.toFixed(2)}% de margem.`);
      } else {
        setAvisoMargemEstimado('');
      }
    } else {
      setAvisoMargemEstimado('');
    }

    if (isNaN(custo) || custo <= 0) {
      setMargemVendaCusto(atualizarMargem(NaN));
      setMargemEstimadoCusto(atualizarMargem(NaN));
    } else {
      const margemVCPercent = ((venda - custo) / custo) * 100;
      setMargemVendaCusto(atualizarMargem(margemVCPercent));

      const margemECPercent = ((estimado - custo) / custo) * 100;
      setMargemEstimadoCusto(atualizarMargem(margemECPercent));

      const margemPFPmvgPercent = ((pfpmvg - custo) / custo) * 100;
      setMargemPFPmvgCusto(atualizarMargem(margemPFPmvgPercent));
    }

    // Difference Venda x Estimado
    if (isNaN(estimado) || estimado === 0 || isNaN(venda) || venda === 0) {
      setMargemVendaEstimado({ value: 'N/A', color: '', message: '' });
    } else {
      const margemVEPercent = ((venda - estimado) / estimado) * 100;
      let mensagem = '';
      let cor = '';

      const diferencaPercentual = Math.abs(margemVEPercent);

      if (diferencaPercentual < 0.1) {
        mensagem = ' (VALOR ESTIMADO OK)';
        cor = 'positive';
      } else if (venda > estimado) {
        if (diferencaPercentual <= 1) {
          mensagem = ' (LEVEMENTE DEFASADO)';
          cor = 'warning';
        } else {
          mensagem = ' (DEFASADO)';
          cor = 'negative';
        }
      } else {
        mensagem = ' (ABAIXO DO ESTIMADO)';
        cor = 'positive';
      }

      setMargemVendaEstimado({
        value: `${margemVEPercent.toFixed(2)}%`,
        color: cor,
        message: mensagem
      });
    }

    // Fill resume data
    const resumeInfo = {
      produto: produtoNome || '—',
      pf: basePF || '0.0000',
      desc: (desconto || '0') + '%',
      cap: cap === 'sim' ? 'SIM' : 'NÃO',
      pmvg: valorPMVG || 'N/A',
      repasse: repasse + '%',
      custo: valorCusto,
      desonerado: chkDesonerado ? 'SIM' : 'NÃO',
      isento: chkIsento ? 'SIM' : 'NÃO',
      valorvenda: valorVenda || 'N/A',
      estimado: valorEstimado || 'N/A',
      m_vc: margemVendaCusto.value,
      m_ec: margemEstimadoCusto.value,
      m_pfpmvg: margemPFPmvgCusto.value,
      m_ve: margemVendaEstimado.value + (margemVendaEstimado.message || '')
    };

    setResumeData(resumeInfo);
    setShowResumo(true);
    setShowResultadoMargens(true);
  };

  const limparTudo = () => {
    if (!confirm('Deseja realmente limpar todos os campos?')) {
      return;
    }

    setProdutoNome('');
    setBasePF('');
    setValorICMS0('');
    setDesconto('');
    setValorPMVG('');
    setValorPMVG0('');
    setCustoProduto('');
    setValorPF('');
    setValorVenda('');
    setValorEstimado('');
    setMargemDireta('');
    setSugestaoMargem('');
    setChkDesonerado(false);
    setChkIsento(false);
    setRepetirPF(false);
    setCap('nao');
    setRepasse('10.75');
    setShowResultadoCusto(false);
    setShowResultadoMargens(false);
    setShowResumo(false);
    setAvisoMargemEstimado('');
    zerarCalculosPorBase();
  };

  const gerarPDFResumo = () => {
    const element = document.getElementById('resumoArea');
    if (!element || !window.html2pdf) {
      alert('Erro ao gerar PDF. Aguarde o carregamento da página.');
      return;
    }

    const opcoes = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: 'RELATÓRIO DE MARGENS.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opcoes).from(element).save();
  };

  return (
    <div className="min-h-screen px-6 py-12" style={{
      backgroundImage: `
        radial-gradient(120% 80% at 50% -10%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.00) 50%),
        linear-gradient(180deg, #91A5A8 0%, #9C9993 55%, #60575F 100%)
      `,
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="max-w-[1100px] mx-auto">
        {/* Calculator 1: Cost Calculation */}
        <div className="rounded-2xl p-8 mb-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl bg-white/70 border border-white/40" style={{
          background: 'radial-gradient(1200px 600px at 50% -10%, #EEEDE9 0%, #F5F4F1 40%, #F5F4F1 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
        }}>
          {/* Topbar: Título + Produto */}
          <div className="flex items-end justify-between gap-6 mb-6 pb-4 border-b border-gray-200/80 flex-wrap">
            <h1 className="text-[#171717] m-0 tracking-tight leading-[40px]">
              • Calculadora de Custo e Margens - MEDICAMENTOS
            </h1>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Label htmlFor="produtoNome" className="whitespace-nowrap m-0 text-gray-700 leading-[35px]">
                PRODUTO:
              </Label>
              <Input
                id="produtoNome"
                type="text"
                value={produtoNome}
                onChange={(e) => setProdutoNome(e.target.value)}
                placeholder="Ex.: Mesalazina 1g Supositório"
                className="h-[35px] w-[260px] border-gray-300 focus:border-gray-500 bg-white text-sm"
              />
            </div>
          </div>

          <h2 className="text-[#171717] mb-6 pb-3 border-b-2 border-gray-800 text-center tracking-tight">
            CÁLCULO DE CUSTO DO PRODUTO
          </h2>

          {/* Two Column: Base PF + ICMS 0% */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col space-y-3">
              <Label className="text-gray-700 leading-tight min-h-[40px]">
                BASE DE CÁLCULO PF (R$)
                <span className="block text-sm text-gray-500 mt-1">• Para base, considerar ICMS 17% - ES</span>
              </Label>
              <Input
                type="number"
                step="0.0001"
                value={basePF}
                onChange={(e) => setBasePF(e.target.value)}
                placeholder="Inserir PF 17%"
                className="h-11 bg-white/80"
              />
              <div className="flex gap-5 flex-wrap mt-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="chkDesonerado"
                    checked={chkDesonerado}
                    onCheckedChange={(checked) => setChkDesonerado(checked as boolean)}
                  />
                  <label htmlFor="chkDesonerado" className="cursor-pointer text-sm text-gray-700 whitespace-nowrap">
                    DESONERADO (87/02)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="chkIsento"
                    checked={chkIsento}
                    onCheckedChange={(checked) => setChkIsento(checked as boolean)}
                  />
                  <label htmlFor="chkIsento" className="cursor-pointer text-sm text-gray-700 whitespace-nowrap">
                    ISENTO (162/94 OU 140/01)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Label className="text-gray-700 min-h-[40px] flex items-end">VALOR ICMS 0% (R$):</Label>
              <Input
                type="number"
                step="0.0001"
                value={valorICMS0}
                onChange={(e) => setValorICMS0(e.target.value)}
                placeholder="Valor da base com ICMS 0%"
                className="h-11 bg-white/80"
              />
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <Label className="text-gray-700">CAP 21,53%</Label>
            <RadioGroup value={cap} onValueChange={(value) => {
              setCap(value);
              if (value === 'nao') {
                setValorPMVG('');
                setValorPMVG0('');
                setShowItemPMVGCusto(false);
              } else {
                calcularPMVG();
              }
            }}>
              <div className="flex gap-8">
                <div className="flex items-center gap-2.5">
                  <RadioGroupItem value="sim" id="capSim" />
                  <Label htmlFor="capSim" className="m-0 cursor-pointer text-gray-700">SIM</Label>
                </div>
                <div className="flex items-center gap-2.5">
                  <RadioGroupItem value="nao" id="capNao" />
                  <Label htmlFor="capNao" className="m-0 cursor-pointer text-gray-700">NÃO</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {cap === 'sim' && (
            <div className="mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-gray-700 whitespace-nowrap">VALOR DE VENDA - PMVG (CAP -21,53%) - R$</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={valorPMVG}
                    onChange={(e) => setValorPMVG(e.target.value)}
                    placeholder="Calculado automaticamente"
                    className="h-11 bg-white/80"
                  />
                </div>

                {(chkDesonerado || chkIsento) && (
                  <div className="space-y-3">
                    <Label className="text-gray-700 whitespace-nowrap">VALOR PMVG 0% — (ISENTO ou DESONERADO) - R$</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={valorPMVG0}
                      onChange={(e) => setValorPMVG0(e.target.value)}
                      placeholder="Preenchido quando ISENTO/DESONERADO"
                      className="h-11 bg-white/80"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-6 space-y-3">
            <Label className="text-gray-700">DESCONTO (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
              placeholder="Inserir desconto comercial recebido na cotação"
              className="h-11 bg-white/80"
            />
          </div>

          <div className="mb-6 space-y-4">
            <div>
              <Label className="text-gray-700 mb-1">REPASSE</Label>
              <p className="text-sm text-gray-500 mb-3">• Produto nacional: 10,75% - Produto Importado: 13,54%</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Botão 10,75% */}
              <div 
                className={`relative flex items-center justify-center min-h-[44px] px-3 py-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  repasse === '10.75'
                    ? 'bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] border-2 border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.3)] translate-y-[-2px]'
                    : 'bg-white/[0.08] backdrop-blur-[10px] border-2 border-white/15 hover:bg-white/15 hover:border-white/30 hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                } ${chkIsento ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !chkIsento && setRepasse('10.75')}
              >
                <label className={`cursor-pointer text-center m-0 pointer-events-none ${
                  repasse === '10.75' ? 'text-white' : 'text-[#171717]'
                }`}>
                  {repasse === '10.75' && '✓ '}10,75%<br /><small className="text-xs opacity-80">Nacional</small>
                </label>
              </div>

              {/* Botão 13,54% */}
              <div 
                className={`relative flex items-center justify-center min-h-[44px] px-3 py-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  repasse === '13.54'
                    ? 'bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] border-2 border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.3)] translate-y-[-2px]'
                    : 'bg-white/[0.08] backdrop-blur-[10px] border-2 border-white/15 hover:bg-white/15 hover:border-white/30 hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                } ${chkIsento ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !chkIsento && setRepasse('13.54')}
              >
                <label className={`cursor-pointer text-center m-0 pointer-events-none ${
                  repasse === '13.54' ? 'text-white' : 'text-[#171717]'
                }`}>
                  {repasse === '13.54' && '✓ '}13,54%<br /><small className="text-xs opacity-80">Importado</small>
                </label>
              </div>

              {/* Botão SEM INFORMAÇÃO */}
              <div 
                className={`relative flex items-center justify-center min-h-[44px] px-3 py-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  repasse === '0' && !chkIsento
                    ? 'bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] border-2 border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.3)] translate-y-[-2px]'
                    : 'bg-white/[0.08] backdrop-blur-[10px] border-2 border-white/15 hover:bg-white/15 hover:border-white/30 hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                } ${chkIsento ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !chkIsento && setRepasse('0')}
              >
                <label className={`cursor-pointer text-center m-0 pointer-events-none ${
                  repasse === '0' && !chkIsento ? 'text-white' : 'text-[#171717]'
                }`}>
                  {repasse === '0' && !chkIsento && '✓ '}SEM<br />INFORMAÇÃO
                </label>
              </div>

              {/* Botão SEM REPASSE (ISENTO) */}
              <div 
                className={`relative flex items-center justify-center min-h-[44px] px-3 py-2 rounded-xl transition-all duration-300 ${
                  chkIsento
                    ? 'bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] border-2 border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.3)] translate-y-[-2px] cursor-not-allowed'
                    : 'bg-white/[0.08] backdrop-blur-[10px] border-2 border-white/15 opacity-100 cursor-default hover:bg-white/15 hover:border-white/30 hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                }`}
                title="Marcado automaticamente quando [X] ISENTO"
              >
                <label className={`text-center m-0 pointer-events-none ${
                  chkIsento ? 'text-white' : 'text-[#171717]'
                }`}>
                  {chkIsento && '✓ '}SEM REPASSE<br /><small className="text-xs opacity-80">Isento</small>
                </label>
              </div>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-gray-200/50">
            <Button onClick={calcularCusto} className="px-8 py-6 text-base">
              CALCULAR CUSTO
            </Button>
          </div>
        </div>

        {/* Result Box - Cost */}
        {showResultadoCusto && (
          <div className="bg-gradient-to-br from-[#1a1a1a]/90 to-[#2d2d2d]/90 text-white p-6 rounded-2xl mb-8 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]" style={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}>
            <div className="flex justify-between items-center mb-3 p-4 bg-white/[0.08] backdrop-blur-[10px] rounded-xl border border-white/[0.05] transition-all duration-200 hover:bg-white/[0.12] hover:translate-x-1">
              <span className="whitespace-nowrap text-[#171717]" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.6)' }}>VALOR DE CUSTO R$</span>
              <span className="text-[#171717]" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.6)' }}>{valorCusto}</span>
            </div>
            <div className="flex justify-between items-center mb-3 p-4 bg-white/[0.08] backdrop-blur-[10px] rounded-xl border border-white/[0.05] transition-all duration-200 hover:bg-white/[0.12] hover:translate-x-1">
              <span className="whitespace-nowrap text-[#171717]" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.6)' }}>MARGEM → CUSTO X BASE PF</span>
              <span className={`${
                margemBaseCusto.color === 'positive' ? 'text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                margemBaseCusto.color === 'negative' ? 'text-[#ef4444] drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]' :
                margemBaseCusto.color === 'warning' ? 'text-[#f59e0b] drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]' : ''
              }`}>
                {margemBaseCusto.value}
              </span>
            </div>
            {showItemPMVGCusto && (
              <div className="flex justify-between items-center p-4 bg-white/[0.08] backdrop-blur-[10px] rounded-xl border border-white/[0.05] transition-all duration-200 hover:bg-white/[0.12] hover:translate-x-1">
                <span className="whitespace-nowrap text-[#171717]" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.6)' }}>MARGEM → CUSTO X PMVG</span>
                <span className={`${
                  margemPMVGCusto.color === 'positive' ? 'text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                  margemPMVGCusto.color === 'negative' ? 'text-[#ef4444] drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]' :
                  margemPMVGCusto.color === 'warning' ? 'text-[#f59e0b] drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]' : ''
                }`}>
                  {margemPMVGCusto.value}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-[#161822] to-transparent my-8" />

        {/* Calculator 2: Margins and Discrepancies */}
        <div className="rounded-2xl p-8 mb-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl bg-white/70 border border-white/40" style={{
          background: 'radial-gradient(1200px 600px at 50% -10%, #EEEDE9 0%, #F5F4F1 40%, #F5F4F1 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
        }}>
          <h2 className="text-[#171717] mb-6 pb-3 border-b-2 border-gray-800 text-center tracking-tight">
            CÁLCULO DE MARGENS E DEFASAGENS
          </h2>

          <div className="mb-6 space-y-3">
            <Label className="text-gray-700">VALOR DE CUSTO (R$)</Label>
            <Input
              type="number"
              step="0.0001"
              value={custoProduto}
              onChange={(e) => setCustoProduto(e.target.value)}
              placeholder="Importado automaticamente ou inserido manualmente"
              className="h-11 bg-white/80"
            />
          </div>

          <div className="mb-6 space-y-3">
            <Label className="text-gray-700">VALOR DO PF OU PMVG (R$)</Label>
            <Input
              type="number"
              step="0.0001"
              value={valorPF}
              onChange={(e) => setValorPF(e.target.value)}
              placeholder="Importado automaticamente ou inserido manualmente"
              className="h-11 bg-white/80"
            />
            {showAvisoPF && (
              <div className="text-[#ef4444] italic text-sm mt-2 p-3 bg-red-50/50 rounded-lg border border-red-200/50">
                PRODUTO MARCADO COMO: <strong>{avisoTipoPF}</strong> — <em>ATENÇÃO NO CÁLCULO</em>
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-gray-700">VALOR DE VENDA (R$)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={valorVenda}
                  onChange={(e) => {
                    setValorVenda(e.target.value);
                    setMargemDireta('');
                    setSugestaoMargem('');
                  }}
                  placeholder="Inserir valor de venda"
                  className="h-11 bg-white/80"
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="repetirPF"
                    checked={repetirPF}
                    onCheckedChange={(checked) => setRepetirPF(checked as boolean)}
                  />
                  <label htmlFor="repetirPF" className="cursor-pointer text-sm text-gray-700">
                    REPETIR PF
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-700">MARGEM DIRETA (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={margemDireta}
                  onChange={(e) => setMargemDireta(e.target.value)}
                  placeholder="Ex: 25 para 25% de margem"
                  className="h-11 bg-white/80"
                />
                <div className="text-xs text-gray-600 italic">
                  • Calcula automaticamente o valor de venda
                </div>
                {sugestaoMargem && (
                  <div className="text-xs text-[#ef4444] mt-2" dangerouslySetInnerHTML={{ __html: sugestaoMargem }} />
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <Label className="text-gray-700">VALOR ESTIMADO (R$)</Label>
            <Input
              type="number"
              step="0.0001"
              value={valorEstimado}
              onChange={(e) => setValorEstimado(e.target.value)}
              placeholder="Se houver, inserir valor estimado."
              className="h-11 bg-white/80"
            />
          </div>

          <div className="text-center pt-4 border-t border-gray-200/50">
            <Button onClick={calcularMargens} className="px-8 py-6 text-base">
              CALCULAR MARGENS
            </Button>
          </div>

          {/* Result Box - Margins */}
          {showResultadoMargens && (
            <div className="bg-gradient-to-br from-[#1a1a1a]/90 to-[#2d2d2d]/90 text-white p-6 rounded-2xl mt-6 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]" style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}>
              <div className="flex justify-between items-center mb-3 p-4 bg-white/[0.08] backdrop-blur-[10px] rounded-xl border border-white/[0.05] transition-all duration-200 hover:bg-white/[0.12] hover:translate-x-1 gap-3 flex-wrap">
                <span className="result-label min-w-[200px] text-[#171717]" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.6)' }}>MARGEM → CUSTO X VALOR DE VENDA</span>
                <span className={`text-right flex-shrink-0 ${
                  margemVendaCusto.color === 'positive' ? 'text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                  margemVendaCusto.color === 'negative' ? 'text-[#ef4444] drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]' :
                  margemVendaCusto.color === 'warning' ? 'text-[#f59e0b] drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]' : ''
                }`}>
                  {margemVendaCusto.value}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3 p-4 bg-white/[0.08] backdrop-blur-[10px] rounded-xl border border-white/[0.05] transition-all duration-200 hover:bg-white/[0.12] hover:translate-x-1 gap-3 flex-wrap">
                <span className="result-label min-w-[200px] text-[#171717]" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.6)' }}>MARGEM → CUSTO X VALOR ESTIMADO</span>
                <span className={`text-right flex-shrink-0 ${
                  margemEstimadoCusto.color === 'positive' ? 'text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                  margemEstimadoCusto.color === 'negative' ? 'text-[#ef4444] drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]' :
                  margemEstimadoCusto.color === 'warning' ? 'text-[#f59e0b] drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]' : ''
                }`}>
                  {margemEstimadoCusto.value}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3 p-4 bg-white/[0.08] backdrop-blur-[10px] rounded-xl border border-white/[0.05] transition-all duration-200 hover:bg-white/[0.12] hover:translate-x-1 gap-3 flex-wrap">
                <span className="result-label min-w-[200px] text-[#171717]" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.6)' }}>MARGEM → CUSTO X PF/PMVG</span>
                <span className={`text-right flex-shrink-0 ${
                  margemPFPmvgCusto.color === 'positive' ? 'text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                  margemPFPmvgCusto.color === 'negative' ? 'text-[#ef4444] drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]' :
                  margemPFPmvgCusto.color === 'warning' ? 'text-[#f59e0b] drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]' : ''
                }`}>
                  {margemPFPmvgCusto.value}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/[0.08] backdrop-blur-[10px] rounded-xl border border-white/[0.05] transition-all duration-200 hover:bg-white/[0.12] hover:translate-x-1 gap-3 flex-wrap">
                <span className="result-label min-w-[200px] text-[#171717]" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.6)' }}>DIFERENÇA % → VENDA X ESTIMADO</span>
                <span className={`text-right flex-shrink-0 ${
                  margemVendaEstimado.color === 'positive' ? 'text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                  margemVendaEstimado.color === 'negative' ? 'text-[#ef4444] drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]' :
                  margemVendaEstimado.color === 'warning' ? 'text-[#f59e0b] drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]' : ''
                }`}>
                  {margemVendaEstimado.value}{margemVendaEstimado.message}
                </span>
              </div>

              {avisoMargemEstimado && (
                <div className="text-[#10b981] text-sm mt-4 p-3 bg-green-50/10 rounded-lg border border-green-500/30">
                  {avisoMargemEstimado}
                </div>
              )}

              {/* Resume Area for PDF */}
              {showResumo && (
                <div id="resumoArea" className="bg-white border-[1.5px] border-gray-300 rounded-none p-6 mt-6 text-black shadow-sm">
                  <h3 className="mb-4 text-center tracking-tight">RELATÓRIO DE CUSTO DO PRODUTO</h3>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>PRODUTO</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.produto}</td></tr>
                      <tr className="h-3"><td colSpan={2} className="p-0 border-0 bg-transparent"></td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>BASE DE CÁLCULO PF (R$)</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.pf}</td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>DESCONTO (%)</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.desc}</td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>REPASSE (%)</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.repasse}</td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>CAP 21,53%</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.cap}</td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>DESONERADO</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.desonerado}</td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>ISENTO</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.isento}</td></tr>
                      <tr className="h-3"><td colSpan={2} className="p-0 border-0 bg-transparent"></td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>VALOR DE CUSTO (R$)</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.custo}</td></tr>
                      <tr className="h-3"><td colSpan={2} className="p-0 border-0 bg-transparent"></td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>VALOR DE VENDA (R$)</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.valorvenda}</td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>VALOR PMVG (R$)</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.pmvg}</td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>VALOR ESTIMADO (R$)</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.estimado}</td></tr>
                      <tr className="h-3"><td colSpan={2} className="p-0 border-0 bg-transparent"></td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>MARGEM → CUSTO X VALOR DE VENDA</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.m_vc}</td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>MARGEM → CUSTO X VALOR ESTIMADO</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.m_ec}</td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>MARGEM → CUSTO X VALOR DO PF OU PMVG</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.m_pfpmvg}</td></tr>
                      <tr><td className="border border-[#646464] p-3 text-sm" style={{ fontWeight: 600, color: '#171717' }}>DIFERENÇA % → VALOR DE VENDA X ESTIMADO</td><td className="border border-[#646464] p-3 text-right text-sm text-[#404040]">{resumeData.m_ve}</td></tr>
                    </tbody>
                  </table>
                  <div className="text-center mt-4 pt-4 border-t border-gray-200">
                    <Button onClick={gerarPDFResumo} className="px-6 py-4">📄 GERAR RELATÓRIO</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Clear Button - Glassmorphism Transparente (Vidro) */}
      <button
        onClick={limparTudo}
        className="fixed bottom-[30px] right-[30px] min-w-[80px] h-[50px] px-5 text-[#171717] border-2 border-white/40 rounded-[25px] cursor-pointer transition-all duration-300 hover:translate-y-[-5px] hover:scale-110 active:translate-y-[-2px] active:scale-105 z-[1000]"
        title="Limpar Tudo"
        aria-label="Limpar todos os campos"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        }}
      >
        Limpar Tudo 🗑️
      </button>

      {/* Footer */}
      <footer className="text-center p-8 mt-16 bg-gradient-to-br from-[#1a1a1a]/90 to-[#2d2d2d]/90 border border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden backdrop-blur-md" style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <span className="text-gray-400 tracking-wide uppercase text-sm">Desenvolvido por</span>
        <strong className="text-white ml-2 tracking-wide relative inline-block uppercase text-sm after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-px after:bg-gradient-to-r after:from-transparent after:via-blue-400 after:to-transparent">
          Vinicius R.
        </strong>
      </footer>
    </div>
  );
}
