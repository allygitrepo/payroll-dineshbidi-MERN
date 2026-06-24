import apiClient from '../../../../shared/services/apiClient';

export const getNotes = async (companyId) => {
  if (!companyId) return [];
  try {
    const response = await apiClient.get(`/notes/company/${companyId}`);
    return response.data?.data || [];
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    throw error;
  }
};

export const saveNote = async (note) => {
  try {
    if (note.id) {
      // Update existing
      const { id, company_id, ...updatePayload } = note;
      const response = await apiClient.put(`/notes/${note.id}`, updatePayload, {
        headers: { 'company-id': company_id }
      });
      return response.data?.data;
    } else {
      // Create new
      const { id, ...createPayload } = note;
      const response = await apiClient.post(`/notes`, createPayload);
      return response.data?.data;
    }
  } catch (error) {
    console.error('Failed to save note:', error);
    throw error;
  }
};

export const deleteNote = async (id) => {
  try {
    const companyId = localStorage.getItem('selectedCompany');
    const response = await apiClient.delete(`/notes/${id}`, {
      headers: { 'company-id': companyId }
    });
    return response.data?.data;
  } catch (error) {
    console.error('Failed to delete note:', error);
    throw error;
  }
};
