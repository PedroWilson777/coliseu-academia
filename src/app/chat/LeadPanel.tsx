// Painel direito: informações do lead ou aluno
import type { ConvDetail } from './chat-types';
import { Avatar, Section, Row } from './chat-ui';

interface LeadPanelProps {
  conv: ConvDetail | null;
}

export function LeadPanel({ conv }: LeadPanelProps) {
  if (!conv) {
    return (
      <div className="overflow-y-auto p-5" style={{ background: 'var(--bg-2)', borderLeft: '1px solid var(--border)' }}>
        <div className="text-center text-sm py-10" style={{ color: 'var(--text-3)' }}>
          Selecione uma conversa
        </div>
      </div>
    );
  }

  const { person, type } = conv;

  return (
    <div className="overflow-y-auto p-5" style={{ background: 'var(--bg-2)', borderLeft: '1px solid var(--border)' }}>
      {/* Cabeçalho com avatar */}
      <div className="text-center mb-4">
        <div className="mx-auto mb-3">
          <Avatar name={person.name || person.phone} large student={type === 'STUDENT'} />
        </div>
        <div className="font-display text-xl">{person.name || 'Sem nome'}</div>
        <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-3)' }}>{person.phone}</div>
      </div>

      {/* Dados específicos por tipo */}
      {type === 'LEAD' ? (
        <>
          <Section title="Estágio do Lead">
            <Row label="Status" value={person.stage || 'NEW'} />
            <Row label="Qualificação" value={person.qualification || 'UNKNOWN'} />
            {person.experimentalDone && <Row label="Aula experimental" value="✅ feita" />}
          </Section>
          <Section title="Interesse">
            <Row label="Modalidade" value={person.interestedModality || '—'} />
            <Row label="Plano" value={person.interestedPlan || '—'} />
            <Row label="Pagamento" value={person.paymentMethod || '—'} />
          </Section>
        </>
      ) : (
        <Section title="Aluno">
          <Row label="Modalidade" value={person.modality || '—'} />
          <Row label="Plano" value={person.plan || '—'} />
          <Row label="Vencimento dia" value={person.paymentDay?.toString() || '—'} />
        </Section>
      )}

      {person.notes && (
        <Section title="Anotações">
          <div className="rounded-lg p-3 text-xs italic" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
            &quot;{person.notes}&quot;
          </div>
        </Section>
      )}
    </div>
  );
}
