-- ALABQRI: normalize the public display name of library section 03.
-- Preserve the stable section ID, sort order, specialties, and article classifications.

UPDATE library_sections
SET name = '📿 الذكر والإتزان الإيماني'
WHERE id = 'dhikr-balance';
