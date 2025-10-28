// Formateadores
const fmtCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const fmtInt = new Intl.NumberFormat('es-CL');
const fmtPct = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

window.calcUI = function () {
  return {
    // Estado principal
    seleccion: null,
    values: { dt: null, desc: null, pie: null, cuotas: null }, // CLP / CLP / CLP / int
    // Modal de edición
    modal: { open: false, field: null, title: '', raw: '', preview: '' },
    // Modal de resumen
    summary: { open: false },

    // Teclas disponibles
    teclas: [
      { id: 'dt',     label: 'D.T.' },
      { id: 'desc',   label: 'Desc.Prop' },
      { id: 'pie',    label: 'Pie' },
      { id: 'cuotas', label: 'Cuotas' },
      // puedes añadir más si quieres
    ],

    /* ======= Fórmula visible en pantalla ======= */
    tokenOrValue(key, label) {
      const v = this.values[key];
      if (v == null) return label;
      return key === 'cuotas' ? fmtInt.format(v) : fmtCLP.format(v);
    },
    formulaStr() {
      const DT   = this.tokenOrValue('dt', 'DT');
      const DESC = this.tokenOrValue('desc', 'Desc. Prop.');
      const PIE  = this.tokenOrValue('pie', 'Pie');
      const C    = this.tokenOrValue('cuotas', 'Cuotas');
      const ready = this.allSet();
      const total = ready ? this.calcTotalCLP() : 'Total';
      // Sin la palabra "cuotas" en el numerador/denominador, como pediste:
      return `(${DT} - ${DESC} - ${PIE}) / ${C} = ${total}`;
    },

    /* ======= Cálculos ======= */
    allSet() {
      const { dt, desc, pie, cuotas } = this.values;
      return dt != null && desc != null && pie != null && cuotas != null && cuotas > 0;
    },
    calcTotalNumber() {
      const { dt, desc, pie, cuotas } = this.values;
      if (!this.allSet()) return null;
      return (dt - desc - pie) / cuotas;
    },
    calcTotalCLP() {
      const n = this.calcTotalNumber();
      return n == null ? 'Total' : fmtCLP.format(n);
    },
    percentDesc() {
      const { dt, desc } = this.values;
      if (dt == null || dt === 0 || desc == null) return null;
      return (desc * 100) / dt;
    },
    percentDescStr() {
      const p = this.percentDesc();
      return p == null ? '—' : `${fmtPct.format(p)} %`;
    },
    totalStr() {
      return this.allSet() ? fmtCLP.format(this.calcTotalNumber()) : '—';
    },

    /* ======= Interacción de teclado ======= */
    handleKey(k) {
      if (this.seleccion && this.seleccion.id === k.id) {
        this.openModalFor(k.id);   // 2º click abre edición
      } else {
        this.seleccion = k;        // 1º click selecciona
      }
    },

    mostrar() { this.summary.open = true; }, // abre el modal de resumen

    /* ======= Modal de edición ======= */
    openModalFor(field) {
      this.modal.field = field;
      this.modal.open = true;
      this.modal.raw = this.prefillRaw(field);
      this.modal.title = this.titleFor(field);
      this.modal.preview = this.previewFor(field, this.modal.raw);
    },
    closeModal() {
      this.modal.open = false;
      this.modal.field = null;
      this.modal.raw = '';
      this.modal.preview = '';
    },
    saveModal() {
      const field = this.modal.field;
      if (!field) return;
      const parsed = this.parseRaw(field, this.modal.raw);
      this.values[field] = parsed;
      this.closeModal();
    },
    onModalInput() { this.modal.preview = this.previewFor(this.modal.field, this.modal.raw); },

    /* ======= Helpers ======= */
    titleFor(field) {
      switch (field) {
        case 'dt': return 'Ingresar D.T. (Deuda Total)';
        case 'desc': return 'Ingresar Descuento Proporcionado';
        case 'pie': return 'Ingresar Pie';
        case 'cuotas': return 'Ingresar Cuotas';
        default: return 'Ingresar Valor';
      }
    },
    prefillRaw(field) {
      const v = this.values[field];
      if (v == null) return '';
      return field === 'cuotas' ? String(v) : this.numberToRaw(v);
    },
    previewFor(field, raw) {
      const n = this.rawToNumber(raw);
      if (!raw || isNaN(n)) return '—';
      return field === 'cuotas' ? fmtInt.format(n) : fmtCLP.format(n);
    },
    parseRaw(field, raw) {
      const n = this.rawToNumber(raw);
      if (isNaN(n)) return null;
      return field === 'cuotas' ? Math.max(1, Math.trunc(n)) : Math.max(0, Math.trunc(n));
    },
    rawToNumber(str) {
      const digits = (str || '').replace(/\D+/g, '');
      return digits ? Number(digits) : NaN;
    },
    numberToRaw(n) { return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(n); },

    // Exponer formateadores al template
    formatCLP(n) { return fmtCLP.format(n); },
    formatEntero(n) { return fmtInt.format(n); },
  };
};
