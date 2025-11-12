import { Client, User } from '@/types/client';

export const SALES_REPS: User[] = [
  { id: '1', name: 'Juan Pérez', email: 'juan@lpgas.com', role: 'sales' },
  { id: '2', name: 'María García', email: 'maria@lpgas.com', role: 'sales' },
  { id: '3', name: 'Carlos López', email: 'carlos@lpgas.com', role: 'admin' },
];

export const AREAS = [
  'García',
  'Monterrey',
  'San Nicolás',
  'Apodaca',
  'El Carmen',
  'Salinas Victoria',
  'Guadalupe',
  'Escobedo',
];

export const generateMockClients = (): Client[] => {
  const types: Client['type'][] = ['residential', 'restaurant', 'commercial', 'food_truck', 'forklift'];
  const statuses: Client['status'][] = ['new', 'in_progress', 'closed'];
  const names = [
    'Restaurante El Buen Sabor',
    'Hotel Plaza',
    'Residencial Los Pinos 123',
    'Food Truck Tacos Express',
    'Almacén Central',
    'Panadería La Espiga',
    'Residencial Vista Hermosa 45',
    'Bodega Industrial Norte',
    'Food Truck Burgers & Co',
    'Residencial San Pedro 78',
    'Restaurante Mariscos Frescos',
    'Fábrica Textil del Valle',
    'Residencial Las Flores 92',
    'Hotel Ejecutivo',
    'Depósito LogiTrans',
  ];

  return names.map((name, index) => {
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60));
    
    const lastVisitDate = new Date(createdDate);
    lastVisitDate.setDate(lastVisitDate.getDate() + Math.floor(Math.random() * 30));

    const hasCredit = index % 3 === 0;
    const hasDiscount = index % 4 === 0;

    return {
      id: `client-${index + 1}`,
      name,
      type: types[index % types.length],
      address: `Calle ${Math.floor(Math.random() * 100) + 1}, Col. ${AREAS[index % AREAS.length]}`,
      phone: `+52 ${Math.floor(Math.random() * 900000000) + 100000000}`,
      email: `contacto${index + 1}@${name.toLowerCase().replace(/\s+/g, '')}.com`,
      lastVisit: statuses[index % statuses.length] === 'new' ? null : lastVisitDate.toISOString(),
      status: statuses[index % statuses.length],
      notes: index % 3 === 0 ? 'Cliente potencial, requiere seguimiento' : '',
      assignedTo: SALES_REPS[index % SALES_REPS.length].name,
      area: AREAS[index % AREAS.length],
      hasCredit,
      creditDays: hasCredit ? [15, 30, 45, 60][index % 4] : undefined,
      hasDiscount,
      discountAmount: hasDiscount ? [50, 100, 150, 200][index % 4] : undefined,
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString(),
    };
  });
};
