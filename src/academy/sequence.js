export const lessonOrder = ['promocion', 'doble', 'clavada', 'mate-octava', 'descubierta', 'peon-pasado', 'columna-abierta', 'puesto-avanzado', 'italiana', 'siciliana', 'espanola', 'francesa', 'gambito-dama', 'caro-kann', 'escandinava', 'escocesa', 'londres', 'eslava', 'inglesa', 'india-rey'];
export const lessonNumber = id => lessonOrder.indexOf(id) + 1;
export function nextLesson(id, content) {
  const index = lessonOrder.indexOf(id);
  return index < 0 ? null : content.find(item => item.id === lessonOrder[index + 1]) ?? null;
}
