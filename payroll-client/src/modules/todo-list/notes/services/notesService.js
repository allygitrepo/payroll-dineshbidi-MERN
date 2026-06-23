const STORAGE_KEY = 'payroll_notes';

const defaultNotes = [
  {
    id: 'n1',
    date: '2026-06-20',
    content: 'Verify EPF Challan date submission with the accounting department.'
  },
  {
    id: 'n2',
    date: '2026-06-22',
    content: "Follow up on Kandan Kumar's AADHAAR KYC verification document status."
  },
  {
    id: 'n3',
    date: '2026-06-23',
    content: 'Convert monthly payroll Excel sheets to standard bank formats for salary disbursement.'
  }
];

export const getNotes = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultNotes));
    return defaultNotes;
  }
  return JSON.parse(data);
};

export const saveNote = (note) => {
  const notes = getNotes();
  if (note.id) {
    const index = notes.findIndex(item => item.id === note.id);
    if (index !== -1) {
      notes[index] = note;
    }
  } else {
    const nextId = String(notes.length > 0 ? Math.max(...notes.map(item => parseInt(item.id.replace('n', '')) || 0)) + 1 : 1);
    const newNote = { ...note, id: `n${nextId}` };
    notes.unshift(newNote); // Put new notes at the top
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  return notes;
};

export const deleteNote = (id) => {
  const notes = getNotes();
  const filtered = notes.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};
