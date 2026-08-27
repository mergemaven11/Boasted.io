import { createReceiptDraft } from '../src/receiptDraft';

describe('createReceiptDraft', () => {
  it('requires an accomplishment', () => {
    expect(createReceiptDraft('   ', 'Saved 20 minutes')).toBeNull();
  });

  it('normalizes user-entered accomplishment and result', () => {
    expect(createReceiptDraft('  Shipped safer deploys  ', '  30% fewer rollbacks  ')).toEqual({
      win: 'Shipped safer deploys',
      result: '30% fewer rollbacks',
      resultDisplay: '30% fewer rollbacks',
      visibility: 'private',
    });
  });

  it('never fabricates a missing result', () => {
    const draft = createReceiptDraft('Documented the incident response flow', '');
    expect(draft.result).toBe('');
    expect(draft.resultDisplay).toBe('Result not added yet — BragStack will not invent one.');
    expect(draft.visibility).toBe('private');
  });
});
